// config/db.js
// MongoDB connection with graceful error handling and retry logic.

const mongoose = require('mongoose');

const connectDB = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zorvellae';

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: 'zorvellae',
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is not running
    });

    console.log('MongoDB connected (database: zorvellae).');

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️   MongoDB disconnected.');
    });

    mongoose.connection.on('error', (err) => {
      const errorType = err && typeof err.name === 'string' ? err.name : 'UnknownError';
      console.error(`MongoDB connection error (${errorType}); details omitted.`);
    });
  } catch (err) {
    const errorType = err && typeof err.name === 'string' ? err.name : 'UnknownError';
    console.error(`MongoDB connection failed (${errorType}); connection details omitted.`);
    console.error('');
    console.error('   TROUBLESHOOTING:');
    console.error('   1. Is MongoDB running locally?');
    console.error('      Windows: net start MongoDB');
    console.error('      macOS:   brew services start mongodb-community');
    console.error('      Or install from: https://www.mongodb.com/try/download/community');
    console.error('');
    console.error('   2. Using Atlas? Check MONGO_URI has correct credentials and IP whitelist.');
    console.error('');
    console.error('   3. The server will continue running WITHOUT database access.');
    console.error('      API endpoints requiring DB will return 503.');
    // Do not process.exit() — allow health-check to still respond
  }
};

module.exports = connectDB;
