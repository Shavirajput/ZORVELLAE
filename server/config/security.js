'use strict';

const jwt = require('jsonwebtoken');

const SESSION_COOKIE_NAME = 'zorvellae_session';
const SESSION_COOKIE_PATH = '/api';
const LEGACY_SESSION_COOKIE_PATH = '/api/auth';
const MAX_SESSION_SECONDS = 30 * 24 * 60 * 60;

const configuredClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const clientOrigin = new URL(configuredClientUrl).origin;
const allowedOrigins = new Set([clientOrigin]);

if (process.env.NODE_ENV !== 'production') {
  [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ].forEach((origin) => allowedOrigins.add(origin));
}

function parseLifetime(value) {
  if (typeof value !== 'string') return null;

  const numericSeconds = /^\d+$/.test(value) ? Number(value) : null;
  const match = /^([1-9]\d*)(s|m|h|d)$/i.exec(value);
  const multiplier = match
    ? { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 }[match[2].toLowerCase()]
    : null;
  const seconds = numericSeconds ?? (match ? Number(match[1]) * multiplier : null);

  if (
    !Number.isSafeInteger(seconds) ||
    seconds < 60 ||
    seconds > MAX_SESSION_SECONDS
  ) {
    return null;
  }
  return { seconds, expiresIn: numericSeconds ?? value };
}

function getAuthConfiguration() {
  const secret = process.env.JWT_SECRET;
  const minimumSecretBytes =
    process.env.NODE_ENV === 'production' ? 64 : 32;
  const lifetime = parseLifetime(process.env.JWT_EXPIRES_IN || '1h');

  if (
    typeof secret !== 'string' ||
    Buffer.byteLength(secret, 'utf8') < minimumSecretBytes ||
    /^(replace|change|example)/i.test(secret) ||
    !lifetime
  ) {
    return null;
  }

  return { secret, ...lifetime };
}

function createSession(userId) {
  const configuration = getAuthConfiguration();
  if (!configuration) return null;

  const token = jwt.sign(
    { sub: String(userId), typ: 'customer' },
    configuration.secret,
    {
      algorithm: 'HS256',
      expiresIn: configuration.expiresIn,
    },
  );
  return { token, maxAge: configuration.seconds * 1000 };
}

function sessionCookieOptions(maxAge, path = SESSION_COOKIE_PATH) {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path,
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

function setSessionCookie(res, session) {
  res.clearCookie(
    SESSION_COOKIE_NAME,
    sessionCookieOptions(undefined, LEGACY_SESSION_COOKIE_PATH),
  );
  res.cookie(
    SESSION_COOKIE_NAME,
    session.token,
    sessionCookieOptions(session.maxAge),
  );
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions());
  res.clearCookie(
    SESSION_COOKIE_NAME,
    sessionCookieOptions(undefined, LEGACY_SESSION_COOKIE_PATH),
  );
}

function readSessionCookie(req) {
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== 'string') return null;

  const matches = [];
  for (const pair of cookieHeader.split(';')) {
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    if (pair.slice(0, separator).trim() === SESSION_COOKIE_NAME) {
      matches.push(pair.slice(separator + 1).trim());
    }
  }

  if (
    matches.length !== 1 ||
    matches[0].length > 4096 ||
    !/^[A-Za-z0-9._-]+$/.test(matches[0])
  ) {
    return null;
  }
  return matches[0];
}

module.exports = {
  allowedOrigins,
  clearSessionCookie,
  createSession,
  getAuthConfiguration,
  readSessionCookie,
  setSessionCookie,
};
