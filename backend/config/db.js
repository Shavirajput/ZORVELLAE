// config/db.js
// MongoDB connection with graceful error handling and retry logic.

const mongoose = require('mongoose');

const INITIAL_RETRY_DELAY_MS = 5000;
const MAX_RETRY_DELAY_MS = 30000;

function logConnectionError(error, message) {
  const errorType =
    error && typeof error.name === 'string' ? error.name : 'UnknownError';
  console.error(`${message} (${errorType}); connection details omitted.`);
}

const connectDB = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zorvellae';

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected.');
  });
  mongoose.connection.on('error', (error) => {
    logConnectionError(error, 'MongoDB connection error');
  });

  let retryDelayMs = INITIAL_RETRY_DELAY_MS;
  let loggedTroubleshooting = false;

  while (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(MONGO_URI, {
        dbName: 'zorvellae',
        serverSelectionTimeoutMS: 5000,
      });

      console.log('MongoDB connected (database: zorvellae).');
      return;
    } catch (error) {
      logConnectionError(
        error,
        loggedTroubleshooting
          ? 'MongoDB reconnection attempt failed'
          : 'MongoDB connection failed',
      );
      if (!loggedTroubleshooting) {
        console.error('Check Atlas Network Access, credentials, and cluster availability.');
        loggedTroubleshooting = true;
      }
      console.warn(`Retrying MongoDB connection in ${retryDelayMs / 1000}s.`);
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      retryDelayMs = Math.min(retryDelayMs * 2, MAX_RETRY_DELAY_MS);
    }
  }
};

module.exports = connectDB;
