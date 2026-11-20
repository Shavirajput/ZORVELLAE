# ZORVELLAE — Database Schema

**Database:** MongoDB<br>
**ODM:** Mongoose 9<br>
**Naming Convention:** camelCase fields, PascalCase model names

Implemented models include customer and catalog data (`User`, `Cart`, `Wishlist`,
`Address`, `Order`, `Category`, `Product`), admin store settings, and content
management (`ContentPage`, `Ingredient`, `ContactMessage`). Payment processing
and reviews remain future schema planning only. Content records are not seeded.

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

Order ──────────────── OrderItem (embedded)
Order ──────────────── Address (embedded snapshot)
Order ──────────────── Payment (1:1 embedded)

ContentPage ────────── (standalone, unique key per managed page)
Ingredient ─────────── (standalone admin-managed reference record)
ContactMessage ─────── (standalone admin-managed message)
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
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true, default: '' },
  bannerImage: { type: String, trim: true, default: '' },
  sortOrder: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false },
}, { timestamps: true });
```

Admin category statuses map to the existing `isActive` and `isPublished`
flags. Categories referenced by products cannot be deleted through the admin
API.

---

## 3. Product Model

```js
// models/Product.js
const variantSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  sku: { type: String, trim: true, uppercase: true, default: '' },
  stockQuantity: { type: Number, min: 0 }, // Optional; absent means untracked
}, { _id: false });

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
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
  description: { type: String, required: true, trim: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  categoryLabel: { type: String, required: true, trim: true },
  images: [{ url: { type: String, required: true }, alt: { type: String, required: true } }],
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  currency: { type: String, required: true, uppercase: true, default: 'USD' },
  variants: [variantSchema],
  ingredients: { type: String, trim: true, default: '' },
  usage: { type: String, trim: true, default: '' },
  specifications: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
  badge: { type: String, trim: true, default: '' },
  sortOrder: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false },
  purchaseAvailable: { type: Boolean, default: false },
}, { timestamps: true });
```

The model computes the base `price` from the lowest variant price during
validation and prevents demo products from being purchase-available.
`stockQuantity` is optional and validated as a non-negative whole number;
missing quantities remain untracked rather than defaulting to zero. Admin
catalog edits preserve quantities for retained variant IDs and cannot directly
set stock. Admin input validation normalizes SKU values, requires SKUs to be
unique within a product payload, and a partial unique MongoDB index prevents
non-empty SKU reuse across product records.

The admin inventory API uses an `InventoryAdjustment` audit collection with
product/variant snapshots, action, previous/new quantity, adjustment amount,
required reason, admin reference, and timestamp. Stock and the matching audit
record are updated together in a MongoDB transaction. No checkout or order
creation path deducts inventory.

**Indexes:** unique product `id` and `slug`; `{ isActive, isPublished,
sortOrder }`; and `{ category, isActive, isPublished }`.

---

## Store Settings Model

`StoreSettings` is a singleton configuration document with the fixed string
`_id: "primary"`. The model stores store identity/logo URL, support contacts,
address, currency code, and nested tax, shipping, and checkout configuration.
No payment credentials or secret fields are part of the schema. Empty store
details and currency, disabled tax/shipping with `null` rates, and unconfigured
checkout preferences are safe initial values; no store data or rates are
invented. The admin GET endpoint returns defaults without persisting a
document, and updates always target the fixed ID.

Tax, shipping, and checkout fields are configuration only. They are not wired
to checkout behavior or calculations in this milestone.

---

## ContentPage Model (implemented)

`ContentPage` stores one editable record per supported key: `about-us` or
`our-science`. Each document contains a title, introduction, ordered plain-text
sections, and `draft`/`published` status. The admin API returns an empty draft
without persisting one when a key has not yet been saved. There is no seeded
content or public read API in this milestone.

## Ingredient Model (implemented)

`Ingredient` stores `name`, optional `inci`, unique normalized `slug`, optional
approved `summary` and `monograph`, `sortOrder`, and `draft`/`published`
status. A published record requires a summary or monograph. No sample records,
scientific claims, evidence ratings, or ingredient/product relationships are
created. CRUD and search are protected by admin authorization.

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

## 8. Order Model (implemented)

`Order` stores a unique generated `ZV-YYYYMMDD-<random suffix>` reference and
an idempotency key unique within its customer account. Items preserve product,
variant, image, quantity, unit-price, and line-total snapshots. The selected
shipping address and contact email are also snapshotted. A compound owner/date
index supports paginated customer history.

The order subtotal is calculated from current server-side catalog variant
prices. Shipping and tax are explicitly marked `not_calculated`; neither is
included in the subtotal. Status starts at `placed`, with a timestamped history
and a defined lifecycle of `placed`, `processing`, `shipped`, `delivered`, or
`cancelled`. No customer status mutation, admin order workflow, or payment
processing is implemented.

Order creation reads only the authenticated customer's cart and saved address.
It rejects inactive, unpublished, demo, unavailable, or mismatched variants.
Order details always filter by both order ID and authenticated owner.

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

`ContactMessage` stores immutable sender fields (`name`, normalized `email`,
`subject`, and `message`) with admin-managed `unread`, `read`, or `resolved`
status plus `readAt` and `resolvedAt` timestamps. Admin APIs provide paginated
listing, detail, and read/resolved updates. There is no public submission
endpoint or seeded message data; an approved intake workflow is still needed.

---

## MongoDB Indexes Summary

```js
// Performance-critical indexes
User:            email (unique), defaultShippingAddress
Category:        slug (unique), isActive
Product:         id (unique), slug (unique), { isActive, isPublished,
                 sortOrder }, { category, isActive, isPublished }
ContentPage:     key (unique), status
Ingredient:      slug (unique), { status, sortOrder, name }, inci
Cart:            customer (unique)
Wishlist:        customer (unique)
Address:         customer, createdAt
Order:           orderNumber (unique), user, status, createdAt,
                 "payment.razorpayPaymentId"
Review:          { product, user } (unique compound), product, isVisible
ContactMessage:  { status, createdAt }, { email, createdAt }
```

---

## Environment Variables

```env
# backend/.env

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
# frontend/.env

VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxx
```
