'use strict';

const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      immutable: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      immutable: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      immutable: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
      immutable: true,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'resolved'],
      default: 'unread',
    },
    readAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: 'throw' },
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });

module.exports =
  mongoose.models.ContactMessage ||
  mongoose.model('ContactMessage', contactMessageSchema);
