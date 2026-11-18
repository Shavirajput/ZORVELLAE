# ZORVELLAE — Database Schema

**Database:** MongoDB<br>
**ODM:** Mongoose 9<br>
**Naming Convention:** camelCase fields, PascalCase model names

The implemented customer-data models are `User`, `Cart`, `Wishlist`, and `Address`.
Orders, payments, reviews, and ingredients below remain future schema planning only.

---

## Entity Relationship Overview

```
User ──────────────── Cart (1:1)
User ──────────────── Wishlist (1:1)
User ──────────────── Order (1:N)
User ──────────────── Address (1:N)
User ──────────────── Review (1:N)

Product ────────────── Category (N:1)
Product ────────────── Review (1:N)
Product ────────────── Ingredient (N:M via ingredientRefs)

Order ──────────────── OrderItem (embedded)
Order ──────────────── Address (embedded snapshot)
Order ──────────────── Payment (1:1 embedded)

ContactMessage ─────── (standalone)
Ingredient ─────────── (standalone, referenced by Product)
```

---

## 1. User Model (implemented)

`User` stores a trimmed name, normalized unique email, bcrypt password hash
(`passwordHash`, excluded from normal queries), and an optional
`defaultShippingAddress` reference. Profile name and email updates are persisted
through the authenticated profile API. Session JWTs are only sent in an
HTTP-only cookie; they are not returned to the frontend.

---

## 2. Category Model

```js
// models/Category.js
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: String,
  image: String,
  icon: String,              // Material Symbol name or Lucide icon name
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,            // For subcategories (optional)
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  seoTitle: String,
  seoDescription: String,
}, { timestamps: true });
```

**Seed Categories (from references):**
1. Targeted Serums & Elixirs
2. Barrier Creams & Hydrators
3. Gentle Cleansers
4. Eye Care
5. Curated Ritual Sets

---

## 3. Product Model

```js
// models/Product.js
const variantSchema = new mongoose.Schema({
  label: { type: String, required: true },     // "30ml", "50ml"
  sku:   { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: null },
  stock: { type: Number, required: true, min: 0, default: 0 },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const ingredientRefSchema = new mongoose.Schema({
  ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient' },
  percentage: String,     // "3%", "0.5%"
  displayOrder: Number,
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },

  // Descriptions
  shortDescription: { type: String, maxlength: 300 },
  whatItDoes: String,         // Accordion section 1
  howToApply: String,         // Accordion section 2
  clinicalResults: String,    // Accordion section 3
  fullInciList: String,       // Full INCI ingredient list (text)

  // Pricing (base / default variant price mirrors variants[0])
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, default: null },

  // Variants (size/format options)
  variants: [variantSchema],

  // Images
  images: [{ type: String }],  // Array of image URLs / paths

  // Ingredients (rich references)
  ingredients: [ingredientRefSchema],

  // Clinical & marketing metadata
  badges:        [String],     // ["Bestseller", "Step 02"]
  skinConcerns:  [String],     // ["Dryness", "Hyperpigmentation"]
  clinicalClaim: String,       // "92% improvement in 28 days"
  batchInfo: {
    batchNumber:   String,
    hplcVerified:  { type: Boolean, default: false },
    purityPercent: Number,
  },
  certifications: [String],    // ["Non-Comedogenic", "Cruelty-Free", "Phyto-Derived"]

  // Commerce flags
  isActive:   { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isBestseller: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },

  // Aggregated stats (denormalized for performance)
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  soldCount:   { type: Number, default: 0 },

  // SEO
  seoTitle:       String,
  seoDescription: String,
}, { timestamps: true });
```

**Indexes:**
- `slug` — unique
- `category` — for category page queries
- `isActive`, `isFeatured` — for shop/homepage
- `price` — for price sort/filter
- Text index on `name`, `shortDescription` — for search

---

## 4. Ingredient Model

```js
// models/Ingredient.js
const ingredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  inci: {
    type: String,            // International Nomenclature Cosmetic Ingredient
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },

  type: {
    type: String,
    enum: ['lipid', 'peptide', 'botanical', 'vitamin', 'acid', 'ceramide', 'other'],
  },

  // Monograph content
  origin: String,            // "Cold-fermented Rosa Canina seeds"
  mechanism: String,         // How it works at cellular level
  clinicalEvidence: String,  // Clinical trial summary
  purityProfile: String,     // "99.8% Chromatographic"
  bioavailability: String,   // "98.4% Micellar Sub-micron"

  // Display
  icon: String,              // Icon name
  image: String,             // Hero image URL
  tags: [String],            // ["Barrier", "Anti-aging", "Brightening"]

  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

---

## 5. Cart Model (implemented)

One cart is stored per authenticated customer. Items store the catalog's stable
product ID, variant ID, and quantity (1–99); display prices and product details
continue to come from the centralized catalog. Demo selections remain
non-purchasable.

---

## 6. Wishlist Model (implemented)

One wishlist is stored per authenticated customer as unique stable catalog
product IDs. Guest cart and wishlist selections remain in browser storage and
are never used as another customer's account data.

---

## 7. Address Model (implemented)

Each address references its owning customer and stores validated first/last
name, address lines, city, region, postal code, and country. The customer's
`defaultShippingAddress` reference is the single source of truth for default
selection. The first saved address becomes default; deleting the default selects
the oldest remaining address.

---

## 8. Order Model

```js
// models/Order.js
const orderItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName:  String,         // Snapshot at time of order
  productImage: String,
  variantSku:   String,
  variantLabel: String,
  price:        Number,
  quantity:     Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,              // Auto-generated: ZVL-2026-001234
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  items: [orderItemSchema],

  shippingAddress: {           // Snapshot of address at order time
    fullName: String,
    phone:    String,
    line1:    String,
    line2:    String,
    city:     String,
    state:    String,
    pincode:  String,
    country:  String,
  },

  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'complimentary'],
    default: 'standard',
  },
  shippingCost: { type: Number, default: 0 },

  pricing: {
    subtotal:    { type: Number, required: true },
    discount:    { type: Number, default: 0 },
    couponCode:  String,
    shipping:    { type: Number, default: 0 },
    total:       { type: Number, required: true },
  },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },

  payment: {
    method:    { type: String, enum: ['razorpay', 'stripe', 'cod'] },
    status:    { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
    // Razorpay
    razorpayOrderId:   String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    // Stripe
    stripePaymentIntentId: String,
    paidAt: Date,
  },

  tracking: {
    carrier:        String,
    trackingNumber: String,
    trackingUrl:    String,
    dispatchedAt:   Date,
    estimatedDelivery: Date,
  },

  notes: String,              // Customer notes at checkout
  cancelReason: String,

}, { timestamps: true });
```

**Indexes:**
- `orderNumber` — unique
- `user` — customer order history
- `status` — admin filtering
- `createdAt` — sorting
- `payment.razorpayPaymentId` — payment lookup

---

## 9. Review Model

```js
// models/Review.js
const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  title:     { type: String, maxlength: 100 },
  body:      { type: String, required: true, maxlength: 1000 },
  verified:  { type: Boolean, default: false },  // Verified purchase
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

// Compound unique index: one review per user per product
// reviewSchema.index({ product: 1, user: 1 }, { unique: true });
// Post-save hook: recalculate product.rating and product.reviewCount
```

---

## 10. ContactMessage Model

```js
// models/ContactMessage.js
const contactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  email:   { type: String, required: true, lowercase: true },
  subject: { type: String, required: true, maxlength: 200 },
  message: { type: String, required: true, maxlength: 2000 },
  isRead:  { type: Boolean, default: false },
  readAt:  Date,
  repliedAt: Date,
}, { timestamps: true });
```

---

## MongoDB Indexes Summary

```js
// Performance-critical indexes
User:            email (unique), defaultShippingAddress
Category:        slug (unique), isActive
Product:         slug (unique), category, isActive, isFeatured, price,
                 text({ name: 'text', shortDescription: 'text' })
Ingredient:      slug (unique), type, isActive
Cart:            customer (unique)
Wishlist:        customer (unique)
Address:         customer, createdAt
Order:           orderNumber (unique), user, status, createdAt,
                 "payment.razorpayPaymentId"
Review:          { product, user } (unique compound), product, isVisible
ContactMessage:  isRead, createdAt
```

---

## Environment Variables

```env
# server/.env

# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/zorvellae

# JWT
JWT_SECRET=your_very_long_random_secret_here
JWT_EXPIRES_IN=7d
JWT_ADMIN_EXPIRES_IN=1d

# Payment (Razorpay)
RAZORPAY_KEY_ID=rzp_test_xxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Or Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx

# Email (Nodemailer - Gmail or SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=zorvellae@gmail.com
SMTP_PASS=app_specific_password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

```env
# client/.env

VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxx
```
