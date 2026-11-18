# ZORVELLAE — API Plan

**Base URL (dev):** `http://localhost:5000/api`<br>
**Auth:** Signed JWT in an HTTP-only session cookie; browser requests use credentials<br>
**Format:** JSON<br>
**Versioning:** `/api/v1/` prefix recommended for future-proofing

This document includes both implemented and planned endpoints. Authentication,
customer cart, wishlist, and address endpoints are implemented. Order and
payment processing are not implemented.

---

## Authentication Legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public — no auth required |
| 🔐 | Protected — customer JWT required |
| 🛡️ | Admin — admin JWT + role check required |

---

## 1. Auth API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | 🔓 | Register new customer |
| POST | `/api/auth/login` | 🔓 | Login and set HTTP-only session cookie |
| POST | `/api/auth/admin/login` | 🔓 | Admin login, returns admin JWT |
| GET | `/api/auth/me` | 🔐 | Get current user profile |
| PATCH | `/api/auth/me` | 🔐 | Update profile name and email |
| PUT | `/api/auth/change-password` | 🔐 | Change password |
| POST | `/api/auth/logout` | 🔓 | Clear the session cookie |

**Register Request:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "password": "SecurePass123!"
}
```

**Login Response:** The JWT is not returned in JSON; it is set as an HTTP-only
cookie with environment-appropriate `Secure` and `SameSite` settings.
```json
{
  "success": true,
  "message": "Signed in.",
  "data": {
    "id": "...",
    "name": "Customer",
    "email": "customer@example.test"
  }
}
```

---

## 2. Product API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | 🔓 | List active, published products (paginated, filtered, sorted) |
| GET | `/api/products/:slug` | 🔓 | Get one active, published product by slug |

**GET /api/products — Query Params:**
```
?page=1
&limit=12
&search=serum
&category=serums,cleansers
&priceBand=all | under-50 | 50-70 | over-70
&sort=featured | price-low | price-high | name
```

**Response envelope:** `{ "success": true, "message": "...", "data": [...], "pagination": { "page": 1, "limit": 12, "total": 0, "pages": 0 } }`

Product data includes stable `id` and `slug`, name, description, category slug and label, images, price/currency, variants, ingredients, usage, specifications, demo status, and purchase availability. The API does not expose product creation or mutation routes in this milestone. Demo products are not purchase-available.

Invalid query parameters return `400`; unknown categories/products return `404`; unavailable catalog storage returns a safe `503`.

## 3. Category API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/categories` | 🔓 | List active, published categories with product counts |
| GET | `/api/categories/:slug` | 🔓 | Get one active, published category with product count |

Category responses include slug, name, description, optional banner image, display order, demo status, and product count. Category mutation routes are not implemented in this milestone.

The explicit development-only seed command imports centralized sample data from `client/src/data/formulations.js`, upserts demo records without deleting data, and requires `NODE_ENV=development` plus `SEED_DEMO_DATA=true`.

---

## 4. Ingredient API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/ingredients` | 🔓 | All ingredients (paginated, filterable) |
| GET | `/api/ingredients/:slug` | 🔓 | Single ingredient monograph |
| POST | `/api/ingredients` | 🛡️ | Create ingredient entry |
| PUT | `/api/ingredients/:id` | 🛡️ | Update ingredient |
| DELETE | `/api/ingredients/:id` | 🛡️ | Delete ingredient |

**GET /api/ingredients — Query Params:**
```
?page=1&limit=20&search=ceramide&type=lipid|peptide|botanical
```

---

## 5. Cart API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/customer/cart` | 🔐 | Get the authenticated customer's cart |
| POST | `/api/customer/cart/items` | 🔐 | Add a product variant and quantity |
| PATCH | `/api/customer/cart/items` | 🔐 | Set an item's quantity |
| DELETE | `/api/customer/cart/items` | 🔐 | Remove a product variant |
| DELETE | `/api/customer/cart` | 🔐 | Clear the authenticated customer's cart |

Guest cart state remains in browser storage and is not merged into customer
accounts. Cart records contain stable catalog product/variant IDs and quantity;
prices are always read from catalog data.

**Add to Cart Request:**
```json
{
  "productId": "demo-barrier-serum",
  "variantId": "30ml",
  "quantity": 1
}
```

---

## 6. Wishlist API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/customer/wishlist` | 🔐 | Get the authenticated customer's product IDs |
| POST | `/api/customer/wishlist/items` | 🔐 | Add a product to the wishlist |
| DELETE | `/api/customer/wishlist/items/:productId` | 🔐 | Remove a product |
| DELETE | `/api/customer/wishlist` | 🔐 | Clear the authenticated customer's wishlist |

Guest wishlist state remains in browser storage and is not merged into customer
accounts. All customer endpoints scope database queries to the authenticated
session subject.

---

## 7. Order API

> **Not implemented.** Checkout remains a local demo confirmation. No permanent
> orders are created by the customer-data milestone.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | 🔐 | Create order (post-payment confirmation) |
| GET | `/api/orders` | 🔐 | Get current user's orders |
| GET | `/api/orders/:id` | 🔐 | Single order detail |
| GET | `/api/orders/admin/all` | 🛡️ | All orders (admin) |
| PUT | `/api/orders/:id/status` | 🛡️ | Update order status |
| PUT | `/api/orders/:id/tracking` | 🛡️ | Add tracking info |

**Create Order Request:**
```json
{
  "items": [
    { "product": "...", "variant": "ZVL-CBS-30", "quantity": 1, "price": 68.00 }
  ],
  "shippingAddress": {
    "name": "Priya Sharma",
    "line1": "12, MG Road",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "country": "India",
    "phone": "+91 9876543210"
  },
  "shippingMethod": "standard",
  "paymentMethod": "razorpay",
  "paymentResult": {
    "razorpay_order_id": "...",
    "razorpay_payment_id": "...",
    "razorpay_signature": "..."
  },
  "subtotal": 68.00,
  "shippingCost": 0,
  "discount": 0,
  "total": 68.00
}
```

---

## 8. Payment API

> **Not implemented.** No payment processing or payment credentials are enabled.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payment/create-order` | 🔐 | Create Razorpay/Stripe payment order |
| POST | `/api/payment/verify` | 🔐 | Verify payment signature (backend) |

**Create Payment Order Request:**
```json
{ "amount": 6800, "currency": "INR" }
```

**Verify Payment Request:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_hash"
}
```

> [!IMPORTANT]
> Payment signature verification **must** happen on the backend using `crypto.createHmac('sha256', secret)`. Never trust the frontend for payment confirmation.

---

## 9. Address API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/customer/addresses` | 🔐 | Get the authenticated customer's addresses |
| POST | `/api/customer/addresses` | 🔐 | Save a validated address |
| PATCH | `/api/customer/addresses/:addressId` | 🔐 | Update an owned address |
| DELETE | `/api/customer/addresses/:addressId` | 🔐 | Delete an owned address |
| PATCH | `/api/customer/addresses/:addressId/default` | 🔐 | Set an owned address as default |

Address reads and mutations verify the session owner. The first saved address
becomes default; deleting the default selects the oldest remaining address.

---

## 10. Review API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products/:slug/reviews` | 🔓 | Get product reviews |
| POST | `/api/products/:slug/reviews` | 🔐 | Submit review |
| DELETE | `/api/reviews/:id` | 🛡️ | Delete review (admin) |

---

## 11. Contact API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/contact` | 🔓 | Submit contact form |
| GET | `/api/contact` | 🛡️ | List all messages (admin) |
| PUT | `/api/contact/:id/read` | 🛡️ | Mark message as read |

**Contact Request:**
```json
{
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "subject": "Product Enquiry",
  "message": "I'd like to know more about..."
}
```

---

## 12. Admin Analytics API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/analytics/overview` | 🛡️ | Total orders, revenue, customers |
| GET | `/api/admin/analytics/revenue?period=7d|30d|90d` | 🛡️ | Revenue chart data |
| GET | `/api/admin/analytics/top-products` | 🛡️ | Best-selling products |
| GET | `/api/admin/customers` | 🛡️ | All customers |
| GET | `/api/admin/customers/:id` | 🛡️ | Customer detail + order history |

---

## 13. Upload API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/upload` | 🛡️ | Upload image (product/ingredient) |
| DELETE | `/api/upload/:filename` | 🛡️ | Delete uploaded image |

---

## Standard Response Envelope

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 48,
    "pages": 4
  }
}

// Error
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## Middleware Architecture

```
server/
├── middleware/
│   ├── auth.js           # verifyToken — decodes JWT, attaches req.user
│   ├── adminAuth.js      # verifyAdmin — checks req.user.role === 'admin'
│   ├── validate.js       # express-validator error handler
│   ├── errorHandler.js   # Global error handler middleware
│   ├── notFound.js       # 404 handler
│   └── upload.js         # multer config for image uploads
```
