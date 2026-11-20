'use strict';

const mongoose = require('mongoose');
const ContentPage = require('../models/ContentPage');
const asyncHandler = require('../utils/asyncHandler');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const {
  InputValidationError,
  parseAdminContentPage,
  parseContentPageKey,
} = require('../validators/adminContent');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Content pages are temporarily unavailable.');
  return false;
}

function databaseError(res, error) {
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin content page request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Content pages are temporarily unavailable.');
}

function sendValidationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
}

function presentContentPage(page, key) {
  return {
    id: page?._id ? page._id.toString() : null,
    key,
    title: page?.title || '',
    introduction: page?.introduction || '',
    sections: Array.isArray(page?.sections)
      ? page.sections.map((section) => ({
          heading: section.heading,
          body: section.body,
        }))
      : [],
    status: page?.status || 'draft',
    updatedAt: page?.updatedAt || null,
  };
}

const getAdminContentPage = asyncHandler(async (req, res) => {
  const { pageKey } = req.params;
  if (!parseContentPageKey(pageKey)) {
    return sendError(res, 400, 'Choose a supported content page.');
  }
  if (!databaseReady(res)) return;

  try {
    const page = await ContentPage.findOne({ key: pageKey }).lean();
    return sendSuccess(
      res,
      200,
      'Content page retrieved.',
      presentContentPage(page, pageKey),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateAdminContentPage = asyncHandler(async (req, res) => {
  const { pageKey } = req.params;
  if (!parseContentPageKey(pageKey)) {
    return sendError(res, 400, 'Choose a supported content page.');
  }

  let pageInput;
  try {
    pageInput = parseAdminContentPage(req.body);
  } catch (error) {
    if (sendValidationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const page = await ContentPage.findOneAndUpdate(
      { key: pageKey },
      { $set: pageInput, $setOnInsert: { key: pageKey } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return sendSuccess(
      res,
      200,
      'Content page saved.',
      presentContentPage(page, pageKey),
    );
  } catch (error) {
    if (error?.code === 11000) {
      return sendError(res, 409, 'This content page is being updated. Please retry.');
    }
    if (error?.name === 'ValidationError') {
      return sendError(res, 400, 'The content page could not be saved.');
    }
    return databaseError(res, error);
  }
});

module.exports = { getAdminContentPage, updateAdminContentPage };
