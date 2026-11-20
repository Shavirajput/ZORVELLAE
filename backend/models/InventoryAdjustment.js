'use strict';

const mongoose = require('mongoose');

const inventoryAdjustmentSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
      immutable: true,
    },
    productName: { type: String, required: true, trim: true, immutable: true },
    variantId: { type: String, required: true, trim: true, immutable: true },
    variantLabel: { type: String, required: true, trim: true, immutable: true },
    sku: { type: String, trim: true, default: '', immutable: true },
    action: {
      type: String,
      enum: ['set', 'increment', 'decrement'],
      required: true,
      immutable: true,
    },
    previousQuantity: { type: Number, min: 0, default: null, immutable: true },
    newQuantity: { type: Number, min: 0, required: true, immutable: true },
    adjustmentAmount: { type: Number, min: 0, required: true, immutable: true },
    reason: { type: String, required: true, trim: true, immutable: true },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: { createdAt: 'adjustedAt', updatedAt: false },
  },
);

inventoryAdjustmentSchema.index({
  product: 1,
  variantId: 1,
  adjustedAt: -1,
  _id: -1,
});

module.exports =
  mongoose.models.InventoryAdjustment ||
  mongoose.model('InventoryAdjustment', inventoryAdjustmentSchema);
