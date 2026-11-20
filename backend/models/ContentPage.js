'use strict';

const mongoose = require('mongoose');

const contentSectionSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, maxlength: 120, required: true },
    body: { type: String, trim: true, maxlength: 6000, required: true },
  },
  { _id: false },
);

const contentPageSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      enum: ['about-us', 'our-science'],
      required: true,
      unique: true,
      immutable: true,
    },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    introduction: { type: String, trim: true, maxlength: 10000, default: '' },
    sections: {
      type: [contentSectionSchema],
      default: [],
      validate: {
        validator: (sections) => sections.length <= 30,
        message: 'A content page can contain no more than 30 sections.',
      },
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true, strict: 'throw' },
);

module.exports =
  mongoose.models.ContentPage || mongoose.model('ContentPage', contentPageSchema);
