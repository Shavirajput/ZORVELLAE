'use strict';

const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
  override: false,
});

const User = require('../models/User');
class ProvisionAdminError extends Error {}

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => prompt.question(question, resolve));
}

async function provisionAdmin() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new ProvisionAdminError(
      'Run the admin provisioning command in an interactive terminal.',
    );
  }
  if (!process.env.MONGO_URI) {
    throw new ProvisionAdminError(
      'MONGO_URI is required to provision an administrator.',
    );
  }

  const email = (await ask('Existing account email to promote: '))
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new ProvisionAdminError('Enter a valid account email address.');
  }
  const confirmation = (await ask('Re-enter the email to confirm promotion: '))
    .trim()
    .toLowerCase();
  if (confirmation !== email) {
    throw new ProvisionAdminError(
      'The confirmation did not match; no role was changed.',
    );
  }

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: 'zorvellae',
    serverSelectionTimeoutMS: 10000,
  });
  if (mongoose.connection.name !== 'zorvellae') {
    throw new ProvisionAdminError(
      'The connected database is not the expected application database.',
    );
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ProvisionAdminError(
      'No existing account matches that email; no role was changed.',
    );
  }
  if (user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
  console.log('The existing account now has administrator access.');
}

provisionAdmin()
  .catch((error) => {
    const errorType =
      typeof error?.name === 'string' ? error.name : 'UnknownError';
    console.error(
      error instanceof ProvisionAdminError
        ? error.message
        : `Administrator provisioning failed (${errorType}); details omitted.`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    prompt.close();
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch {
        console.error('Database disconnect failed; details omitted.');
        process.exitCode = 1;
      }
    }
  });
