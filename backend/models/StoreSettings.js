'use strict';

const mongoose = require('mongoose');

const storeAddressSchema = new mongoose.Schema(
  {
    addressLine1: { type: String, trim: true, default: '' },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    region: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const taxConfigurationSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    ratePercent: { type: Number, min: 0, max: 100, default: null },
    isInclusive: { type: Boolean, default: false },
  },
  { _id: false },
);

const shippingConfigurationSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    flatRate: { type: Number, min: 0, default: null },
  },
  { _id: false },
);

const checkoutConfigurationSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: null },
    allowGuestCheckout: { type: Boolean, default: null },
  },
  { _id: false },
);

const storeSettingsSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      enum: ['primary'],
      default: 'primary',
      immutable: true,
    },
    storeName: { type: String, trim: true, maxlength: 120, default: '' },
    storeLogoUrl: { type: String, trim: true, maxlength: 2048, default: '' },
    supportEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    supportPhone: { type: String, trim: true, maxlength: 30, default: '' },
    storeAddress: { type: storeAddressSchema, default: () => ({}) },
    currencyCode: {
      type: String,
      trim: true,
      uppercase: true,
      match: /^(?:[A-Z]{3})?$/,
      default: '',
    },
    taxConfiguration: {
      type: taxConfigurationSchema,
      default: () => ({}),
    },
    shippingConfiguration: {
      type: shippingConfigurationSchema,
      default: () => ({}),
    },
    checkoutConfiguration: {
      type: checkoutConfigurationSchema,
      default: () => ({}),
    },
  },
  { timestamps: true, strict: 'throw' },
);

module.exports =
  mongoose.models.StoreSettings ||
  mongoose.model('StoreSettings', storeSettingsSchema);
