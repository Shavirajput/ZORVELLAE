'use strict';

const mongoose = require('mongoose');
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const {
  buildPagination,
  sendError,
  sendSuccess,
} = require('../utils/apiResponse');
const {
  InputValidationError,
  parseAdminContactMessageListQuery,
  parseAdminContactMessageStatus,
} = require('../validators/adminContent');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Contact messages are temporarily unavailable.');
  return false;
}

function databaseError(res, error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin contact message request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Contact messages are temporarily unavailable.');
}

function sendValidationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
}

function parseMessageId(value) {
  return typeof value === 'string' && mongoose.isValidObjectId(value);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function presentContactMessage(message, includeBody = false) {
  const result = {
    id: message._id.toString(),
    name: message.name,
    email: message.email,
    subject: message.subject,
    status: message.status,
    readAt: message.readAt,
    resolvedAt: message.resolvedAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
  if (includeBody) result.message = message.message;
  return result;
}

const listAdminContactMessages = asyncHandler(async (req, res) => {
  let query;
  try {
    query = parseAdminContactMessageListQuery(req.query);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const filter = {};
    if (query.status !== 'all') filter.status = query.status;
    if (query.search) {
      const search = new RegExp(escapeRegExp(query.search), 'i');
      filter.$or = [{ name: search }, { email: search }, { subject: search }];
    }
    const [messages, total] = await Promise.all([
      ContactMessage.find(filter)
        .select('name email subject status readAt resolvedAt createdAt updatedAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .lean(),
      ContactMessage.countDocuments(filter),
    ]);
    return sendSuccess(
      res,
      200,
      'Contact messages retrieved.',
      messages.map((message) => presentContactMessage(message)),
      buildPagination(query.page, query.limit, total),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const getAdminContactMessage = asyncHandler(async (req, res) => {
  if (!parseMessageId(req.params.messageId)) {
    return sendError(res, 400, 'A valid contact message identifier is required.');
  }
  if (!databaseReady(res)) return;
  try {
    const message = await ContactMessage.findById(req.params.messageId).lean();
    if (!message) return sendError(res, 404, 'Contact message not found.');
    return sendSuccess(
      res,
      200,
      'Contact message retrieved.',
      presentContactMessage(message, true),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateAdminContactMessageStatus = asyncHandler(async (req, res) => {
  if (!parseMessageId(req.params.messageId)) {
    return sendError(res, 400, 'A valid contact message identifier is required.');
  }
  let status;
  try {
    status = parseAdminContactMessageStatus(req.body);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const current = await ContactMessage.findById(req.params.messageId).lean();
    if (!current) return sendError(res, 404, 'Contact message not found.');
    const now = new Date();
    const update = {
      status,
      readAt: current.readAt || now,
      resolvedAt: status === 'resolved' ? current.resolvedAt || now : null,
    };
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.messageId,
      { $set: update },
      { new: true, runValidators: true },
    ).lean();
    return sendSuccess(
      res,
      200,
      'Contact message status updated.',
      presentContactMessage(message, true),
    );
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return sendError(res, 400, 'The contact message status could not be updated.');
    }
    return databaseError(res, error);
  }
});

module.exports = {
  getAdminContactMessage,
  listAdminContactMessages,
  updateAdminContactMessageStatus,
};
