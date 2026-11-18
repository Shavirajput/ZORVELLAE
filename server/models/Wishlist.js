const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    productIds: {
      type: [String],
      default: [],
      validate: {
        validator: (productIds) => new Set(productIds).size === productIds.length,
        message: 'Wishlist products must be unique.',
      },
    },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
