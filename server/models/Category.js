const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    bannerImage: {
      type: String,
      trim: true,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, isPublished: 1, sortOrder: 1 });

module.exports =
  mongoose.models.Category || mongoose.model('Category', categorySchema);
