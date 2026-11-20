'use strict';

const mongoose = require('mongoose');
const StoreSettings = require('../models/StoreSettings');
const asyncHandler = require('../utils/asyncHandler');
const { sendError, sendSuccess } = require('../utils/apiResponse');
const {
  InputValidationError,
  parseAdminStoreSettings,
} = require('../validators/adminStoreSettings');

function databaseReady(res) {
  if (mongoose.connection.readyState === 1) return true;
  sendError(res, 503, 'Store settings are temporarily unavailable.');
  return false;
}

function validationError(res, error) {
  if (!(error instanceof InputValidationError)) return false;
  sendError(res, 400, error.message, error.errors);
  return true;
}

function databaseError(res, error) {
  if (error?.name === 'ValidationError') {
    const errors = Object.entries(error.errors || {}).map(([field, value]) => ({
      field,
      message: value.message,
    }));
    return sendError(res, 400, 'Please check the provided information.', errors);
  }
  const errorType = typeof error?.name === 'string' ? error.name : 'UnknownError';
  console.error(`Admin store settings request failed (${errorType}); details omitted.`);
  return sendError(res, 503, 'Store settings are temporarily unavailable.');
}

function presentStoreSettings(settings = {}) {
  return {
    storeName: settings.storeName || '',
    storeLogoUrl: settings.storeLogoUrl || '',
    supportEmail: settings.supportEmail || '',
    supportPhone: settings.supportPhone || '',
    storeAddress: {
      addressLine1: settings.storeAddress?.addressLine1 || '',
      addressLine2: settings.storeAddress?.addressLine2 || '',
      city: settings.storeAddress?.city || '',
      region: settings.storeAddress?.region || '',
      postalCode: settings.storeAddress?.postalCode || '',
      country: settings.storeAddress?.country || '',
    },
    currencyCode: settings.currencyCode || '',
    taxConfiguration: {
      enabled: settings.taxConfiguration?.enabled === true,
      ratePercent: settings.taxConfiguration?.ratePercent ?? null,
      isInclusive: settings.taxConfiguration?.isInclusive === true,
    },
    shippingConfiguration: {
      enabled: settings.shippingConfiguration?.enabled === true,
      flatRate: settings.shippingConfiguration?.flatRate ?? null,
    },
    checkoutConfiguration: {
      enabled: settings.checkoutConfiguration?.enabled ?? null,
      allowGuestCheckout:
        settings.checkoutConfiguration?.allowGuestCheckout ?? null,
    },
    updatedAt: settings.updatedAt || null,
  };
}

const getAdminStoreSettings = asyncHandler(async (_req, res) => {
  if (!databaseReady(res)) return;
  try {
    const settings = await StoreSettings.findById('primary').lean();
    return sendSuccess(
      res,
      200,
      'Store settings retrieved.',
      presentStoreSettings(settings || new StoreSettings().toObject()),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

const updateAdminStoreSettings = asyncHandler(async (req, res) => {
  let settings;
  try {
    settings = parseAdminStoreSettings(req.body);
  } catch (error) {
    if (validationError(res, error)) return;
    throw error;
  }
  if (!databaseReady(res)) return;

  try {
    const updated = await StoreSettings.findByIdAndUpdate(
      'primary',
      { $set: settings },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true,
      },
    ).lean();
    return sendSuccess(
      res,
      200,
      'Store settings saved.',
      presentStoreSettings(updated),
    );
  } catch (error) {
    return databaseError(res, error);
  }
});

module.exports = {
  getAdminStoreSettings,
  presentStoreSettings,
  updateAdminStoreSettings,
};
