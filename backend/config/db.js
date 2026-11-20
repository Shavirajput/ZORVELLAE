// config/db.js
// MongoDB connection with graceful error handling and retry logic.

const mongoose = require('mongoose');

const INITIAL_RETRY_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 30000;
const SERVER_SELECTION_TIMEOUT_MS = 5000;
const SAFE_IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;

function safeIdentifier(value) {
  return typeof value === 'string' && SAFE_IDENTIFIER.test(value)
    ? value
    : null;
}

function safeErrorEntry(error) {
  if (!error || typeof error !== 'object') return null;
  const entry = {};
  const name = safeIdentifier(error.name);
  const code = typeof error.code === 'number'
    ? error.code
    : safeIdentifier(error.code);
  const codeName = safeIdentifier(error.codeName);
  if (name) entry.name = name;
  if (code !== null) entry.code = code;
  if (codeName) entry.codeName = codeName;
  return Object.keys(entry).length ? entry : null;
}

function connectionErrorDetails(error) {
  const errors = [];
  const visited = new Set();
  const pending = [error];

  while (pending.length && errors.length < 8) {
    const current = pending.shift();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);

    const entry = safeErrorEntry(current);
    if (entry) errors.push(entry);
    if (current.cause) pending.push(current.cause);
    if (current.originalError) pending.push(current.originalError);

    const servers = current.reason?.servers;
    if (servers && typeof servers.values === 'function') {
      for (const server of servers.values()) {
        if (server?.error) pending.push(server.error);
      }
    }
  }

  const codes = errors.map((entry) => entry.code);
  const codeNames = errors.map((entry) => entry.codeName);
  let stage = 'server-selection';
  if (codes.some((code) => typeof code === 'string' && code.startsWith('ERR_SSL_'))) {
    stage = 'tls-handshake';
  } else if (codes.some((code) => ['ENOTFOUND', 'EAI_AGAIN'].includes(code))) {
    stage = 'dns-resolution';
  } else if (
    codes.some((code) => ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET'].includes(code))
  ) {
    stage = 'tcp-or-server-selection';
  } else if (
    codes.includes(18) ||
    codeNames.includes('AuthenticationFailed') ||
    errors.some((entry) => entry.name === 'MongoAuthenticationError')
  ) {
    stage = 'authentication';
  }

  return { stage, errors };
}

function connectionHint(stage) {
  if (stage === 'tls-handshake') {
    return 'TLS negotiation failed before MongoDB authentication. Check Atlas service/network policy and local egress or TLS inspection; keep certificate validation enabled.';
  }
  if (stage === 'dns-resolution') {
    return 'Check the Atlas cluster hostname and DNS/SRV resolution from this runtime.';
  }
  if (stage === 'tcp-or-server-selection') {
    return 'Check outbound access to Atlas on port 27017, Atlas Network Access, and cluster availability.';
  }
  if (stage === 'authentication') {
    return 'Check the MongoDB database user and URI credential encoding.';
  }
  return 'Check Atlas cluster availability, Network Access, and the configured MongoDB URI.';
}

function configurationSummary(uri, source) {
  try {
    const parsed = new URL(uri);
    return {
      source,
      scheme: parsed.protocol.replace(/:$/, ''),
      credentialsPresent: Boolean(parsed.username && parsed.password),
      databasePathPresent: Boolean(parsed.pathname && parsed.pathname !== '/'),
      optionNames: [...parsed.searchParams.keys()].sort(),
      database: 'zorvellae',
      tlsVerification: 'strict-default',
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    };
  } catch {
    return {
      source,
      scheme: 'invalid',
      database: 'zorvellae',
      tlsVerification: 'strict-default',
      serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
    };
  }
}

function logConnectionError(error, message) {
  const details = connectionErrorDetails(error);
  console.error(
    `${message}: ${JSON.stringify(details)}; URI, hostname, message, and stack omitted.`,
  );
  return details;
}

const connectDB = async () => {
  const configuredUri = process.env.MONGO_URI;
  const MONGO_URI = configuredUri || 'mongodb://127.0.0.1:27017/zorvellae';
  const configuration = configurationSummary(
    MONGO_URI,
    configuredUri ? 'environment' : 'local-fallback',
  );

  console.log(`MongoDB connection configuration: ${JSON.stringify(configuration)}.`);

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
  mongoose.connection.on('error', (error) => {
    logConnectionError(error, 'MongoDB connection error');
  });

  let retryDelayMs = INITIAL_RETRY_DELAY_MS;
  let loggedTroubleshooting = false;
  let attempt = 0;

  while (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(MONGO_URI, {
        dbName: 'zorvellae',
        serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
      });

      console.log('MongoDB connected (database: zorvellae).');
      return;
    } catch (error) {
      attempt += 1;
      const details = logConnectionError(
        error,
        `MongoDB connection attempt ${attempt} failed`,
      );
      if (!loggedTroubleshooting) {
        console.error(connectionHint(details.stage));
        loggedTroubleshooting = true;
      }
      console.warn(`Retrying MongoDB connection in ${retryDelayMs / 1000}s.`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
    }
  }
};

module.exports = connectDB;
module.exports.connectionErrorDetails = connectionErrorDetails;
module.exports.configurationSummary = configurationSummary;
