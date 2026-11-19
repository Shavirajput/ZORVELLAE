// middleware/auth.js
// Verifies the customer session cookie and attaches its trusted subject to req.user.

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  clearAdminSessionCookie,
  getAdminAuthConfiguration,
  getAuthConfiguration,
  readAdminSessionCookie,
  readSessionCookie,
} = require('../config/security');
const { sendError } = require('../utils/apiResponse');

const protect = (req, res, next) => {
  const token = readSessionCookie(req);
  if (!token) {
    return sendError(res, 401, 'Authentication is required.');
  }

  const configuration = getAuthConfiguration();
  if (!configuration) {
    return sendError(res, 503, 'Authentication is temporarily unavailable.');
  }

  try {
    const decoded = jwt.verify(token, configuration.secret, {
      algorithms: ['HS256'],
    });
    if (
      decoded.typ !== 'customer' ||
      typeof decoded.sub !== 'string' ||
      !mongoose.Types.ObjectId.isValid(decoded.sub)
    ) {
      return sendError(res, 401, 'Authentication is required.');
    }
    req.user = decoded;
    return next();
  } catch {
    return sendError(res, 401, 'Authentication is required.');
  }
};

const protectAdmin = async (req, res, next) => {
  const token = readAdminSessionCookie(req);
  if (!token) {
    return sendError(res, 401, 'Admin authentication is required.');
  }

  const configuration = getAdminAuthConfiguration();
  if (!configuration) {
    return sendError(res, 503, 'Admin authentication is temporarily unavailable.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, configuration.secret, {
      algorithms: ['HS256'],
    });
  } catch {
    clearAdminSessionCookie(res);
    return sendError(res, 401, 'Admin authentication is required.');
  }

  if (
    decoded.typ !== 'admin' ||
    typeof decoded.sub !== 'string' ||
    !mongoose.Types.ObjectId.isValid(decoded.sub)
  ) {
    clearAdminSessionCookie(res);
    return sendError(res, 401, 'Admin authentication is required.');
  }

  if (mongoose.connection.readyState !== 1) {
    return sendError(res, 503, 'Admin authentication is temporarily unavailable.');
  }

  let user;
  try {
    user = await User.findById(decoded.sub).select('name email role').lean();
  } catch (error) {
    const errorType =
      typeof error?.name === 'string' ? error.name : 'UnknownError';
    console.error(`Admin session lookup failed (${errorType}); details omitted.`);
    return sendError(res, 503, 'Admin authentication is temporarily unavailable.');
  }

  if (!user) {
    clearAdminSessionCookie(res);
    return sendError(res, 401, 'Admin authentication is required.');
  }
  if (user.role !== 'admin') {
    clearAdminSessionCookie(res);
    return sendError(res, 403, 'Admin access is not available.');
  }

  req.admin = {
    sub: String(user._id),
    role: user.role,
    name: user.name,
    email: user.email,
  };
  return next();
};

const adminOnly = (req, res, next) => {
  if (req.admin && req.admin.role === 'admin') {
    return next();
  }
  return sendError(res, 403, 'Admin access is not available.');
};

module.exports = { adminOnly, protect, protectAdmin };
