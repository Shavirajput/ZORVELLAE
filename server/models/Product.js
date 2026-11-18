const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    alt: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const variantSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
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
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    categoryLabel: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      match: /^[A-Z]{3}$/,
      default: 'USD',
    },
    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator: (variants) => variants.length > 0,
        message: 'At least one product variant is required.',
      },
    },
    ingredients: {
      type: String,
      trim: true,
      default: '',
    },
    usage: {
      type: String,
      trim: true,
      default: '',
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    badge: {
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
    purchaseAvailable: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

productSchema.pre('validate', function preventDemoPurchases() {
  if (this.variants.length > 0) {
    this.price = Math.min(...this.variants.map((variant) => variant.price));
  }
  if (this.isDemo && this.purchaseAvailable) {
    this.invalidate(
      'purchaseAvailable',
      'Demo products cannot be made available for purchase.',
    );
  }
});

productSchema.index({ isActive: 1, isPublished: 1, sortOrder: 1 });
productSchema.index({ category: 1, isActive: 1, isPublished: 1 });

module.exports =
  mongoose.models.Product || mongoose.model('Product', productSchema);
