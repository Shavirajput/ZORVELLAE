// middleware/auth.js
// Verifies the customer session cookie and attaches its trusted subject to req.user.

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const {
  getAuthConfiguration,
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

// Admin-only: must have role === 'admin'
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Admin access is not available.',
  });
};

module.exports = { protect, adminOnly };
