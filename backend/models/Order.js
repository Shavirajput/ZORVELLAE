'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, trim: true },
    productSlug: { type: String, required: true, trim: true },
    productName: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: '' },
    imageAlt: { type: String, default: '' },
    variantId: { type: String, required: true, trim: true },
    variantLabel: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      required: true,
    },
    changedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      immutable: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      immutable: true,
      validate: {
        validator: (items) => items.length > 0,
        message: 'An order must contain at least one item.',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
      immutable: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
      immutable: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      immutable: true,
    },
    shippingStatus: {
      type: String,
      enum: ['not_calculated'],
      default: 'not_calculated',
      immutable: true,
    },
    taxStatus: {
      type: String,
      enum: ['not_calculated'],
      default: 'not_calculated',
      immutable: true,
    },
    status: {
      type: String,
      enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'placed',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [{ status: 'placed', changedAt: new Date() }],
    },
  },
  { timestamps: true },
);

orderSchema.index({ customer: 1, idempotencyKey: 1 }, { unique: true });
orderSchema.index({ customer: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
