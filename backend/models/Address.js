const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    addressLine2: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    region: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    country: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true },
);

addressSchema.index({ customer: 1, createdAt: 1 });

module.exports =
  mongoose.models.Address || mongoose.model('Address', addressSchema);
