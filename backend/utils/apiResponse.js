// utils/apiResponse.js
// Standardised API response helpers for consistency across all controllers.

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {string} message - Human-readable message
 * @param {any} data - Response payload
 * @param {object|null} pagination - Optional pagination metadata
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, pagination = null) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {string} message - Error message
 * @param {Array|null} errors - Validation errors array
 */
const sendError = (res, statusCode = 500, message = 'Server error', errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

/**
 * Build a pagination object from Mongoose query results.
 */
const buildPagination = (page, limit, total) => ({
  page: parseInt(page),
  limit: parseInt(limit),
  total,
  pages: Math.ceil(total / limit),
});

module.exports = { sendSuccess, sendError, buildPagination };
