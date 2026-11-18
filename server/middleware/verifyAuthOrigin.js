const { allowedOrigins } = require('../config/security');
const { sendError } = require('../utils/apiResponse');

function verifyAuthOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin || allowedOrigins.has(origin)) return next();
  return sendError(res, 403, 'Request origin is not allowed.');
}

module.exports = verifyAuthOrigin;
