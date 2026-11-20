'use strict';

const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    inci: { type: String, trim: true, maxlength: 160, default: '' },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      unique: true,
    },
    summary: { type: String, trim: true, maxlength: 500, default: '' },
    monograph: { type: String, trim: true, maxlength: 10000, default: '' },
    sortOrder: { type: Number, min: 0, max: 10000, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  { timestamps: true, strict: 'throw' },
);

ingredientSchema.index({ status: 1, sortOrder: 1, name: 1 });
ingredientSchema.index({ inci: 1 });

module.exports =
  mongoose.models.Ingredient || mongoose.model('Ingredient', ingredientSchema);
