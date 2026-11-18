'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');
const {
  clearSessionCookie,
  createSession,
  getAuthConfiguration,
  setSessionCookie,
} = require('../config/security');
const asyncHandler = require('../utils/asyncHandler');
const { sendError, sendSuccess } = require('../utils/apiResponse');

const BCRYPT_ROUNDS = 12;
let dummyPasswordHash;

function presentUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function authUnavailable(res, error) {
  const errorType =
    typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Authentication request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Authentication is temporarily unavailable.');
}

function isDuplicateEmailError(error) {
  return error?.code === 11000 &&
    (error.keyPattern?.email === 1 || error.keyValue?.email);
}

async function getDummyPasswordHash() {
  if (!dummyPasswordHash) {
    dummyPasswordHash = bcrypt.hash(
      crypto.randomBytes(32).toString('hex'),
      BCRYPT_ROUNDS,
    );
  }
  return dummyPasswordHash;
}

const register = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return sendError(res, 503, 'Authentication is temporarily unavailable.');
  }
  if (!getAuthConfiguration()) {
    return sendError(res, 503, 'Authentication is temporarily unavailable.');
  }

  try {
    await User.init();
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: await bcrypt.hash(req.body.password, BCRYPT_ROUNDS),
    });
    const session = createSession(user._id);
    if (!session) {
      return sendError(res, 503, 'Authentication is temporarily unavailable.');
    }
    await user.save();
    setSessionCookie(res, session);
    return sendSuccess(res, 201, 'Account created.', presentUser(user));
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return sendError(res, 409, 'An account with this email already exists.');
    }
    return authUnavailable(res, error);
  }
});

const login = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1 || !getAuthConfiguration()) {
    return sendError(res, 503, 'Authentication is temporarily unavailable.');
  }

  try {
    const user = await User.findOne({ email: req.body.email }).select(
      '+passwordHash',
    );
    const hash = user ? user.passwordHash : await getDummyPasswordHash();
    const passwordMatches = await bcrypt.compare(req.body.password, hash);
    if (!user || !passwordMatches) {
      return sendError(res, 401, 'Email or password is incorrect.');
    }

    const session = createSession(user._id);
    if (!session) {
      return sendError(res, 503, 'Authentication is temporarily unavailable.');
    }
    setSessionCookie(res, session);
    return sendSuccess(res, 200, 'Signed in.', presentUser(user));
  } catch (error) {
    return authUnavailable(res, error);
  }
});

const logout = asyncHandler(async (req, res) => {
  clearSessionCookie(res);
  return sendSuccess(res, 200, 'Signed out.');
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return sendError(res, 503, 'Authentication is temporarily unavailable.');
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      clearSessionCookie(res);
      return sendError(res, 401, 'Authentication is required.');
    }
    return sendSuccess(res, 200, 'Current user retrieved.', presentUser(user));
  } catch (error) {
    return authUnavailable(res, error);
  }
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return sendError(res, 503, 'Authentication is temporarily unavailable.');
  }

  try {
    const user = await User.findById(req.user.sub);
    if (!user) {
      clearSessionCookie(res);
      return sendError(res, 401, 'Authentication is required.');
    }

    user.name = req.body.name;
    user.email = req.body.email;
    await user.save();
    return sendSuccess(res, 200, 'Profile updated.', presentUser(user));
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return sendError(res, 409, 'An account with this email already exists.');
    }
    return authUnavailable(res, error);
  }
});

module.exports = {
  getCurrentUser,
  login,
  logout,
  register,
  updateCurrentUser,
};
