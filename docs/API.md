# ZORVELLAE API Reference

**Base URL:** `http://localhost:5000/api` in local development  
**Format:** JSON response envelopes; browser requests include credentials  
**Current database status:** MongoDB Atlas is disconnected due to an unresolved
TLS handshake failure. Database-dependent endpoints are implemented but not
verified against live data.

Existing customer and catalog endpoints are listed in [API_PLAN.md](./API_PLAN.md).
This document records the admin foundation and catalog-management APIs.

## Admin authentication

Admin sessions use a distinct HTTP-only `zorvellae_admin_session` cookie scoped
to `/api/admin`. The cookie contains a JWT signed with `JWT_ADMIN_SECRET`, which
must be a separate secret from the customer `JWT_SECRET`. In production the
cookie is `Secure` and `SameSite=None`; in non-production it is non-Secure and
`SameSite=Lax`. Admin JWTs are not accepted as customer JWTs, and customer
cookies are not accepted by admin routes.

Every protected request verifies the admin JWT, checks the current database
connection, and loads the user's persisted role. Demoted or deleted accounts
lose access on the next request.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/admin/auth/login` | Public, rate-limited, origin-checked | Verify an existing admin account and set the admin session cookie |
| POST | `/api/admin/auth/logout` | Origin-checked | Clear the admin session cookie |
| GET | `/api/admin/auth/me` | Admin | Return the current admin identity |
| GET | `/api/admin/dashboard` | Admin | Return catalog/customer/order counts, recent records, revenue availability and inventory status |
| GET | `/api/admin/products` | Admin | Search/filter products with pagination |
| POST | `/api/admin/products` | Admin | Create a product |
| GET | `/api/admin/products/:productId` | Admin | Retrieve a product for editing |
| PUT | `/api/admin/products/:productId` | Admin | Replace editable product fields |
| DELETE | `/api/admin/products/:productId` | Admin | Delete a product after explicit UI confirmation |
| GET | `/api/admin/categories` | Admin | Search/filter categories with pagination |
| POST | `/api/admin/categories` | Admin | Create a category |
| GET | `/api/admin/categories/:categoryId` | Admin | Retrieve a category for editing |
| PUT | `/api/admin/categories/:categoryId` | Admin | Replace editable category fields |
| DELETE | `/api/admin/categories/:categoryId` | Admin | Delete a category only when no products reference it |

All catalog-management routes follow the admin dashboard routes under the
existing `protectAdmin` and `adminOnly` middleware. They revalidate the session
and persisted administrator role for every request. Customer or anonymous
sessions are rejected.

### Product management

List query parameters:

| Parameter | Meaning |
|---|---|
| `page` | One-based page, default `1` |
| `limit` | Page size, default `20`, maximum `100` |
| `search` | Case-insensitive name, slug, description, or category-label search; max 100 characters |
| `categoryId` | MongoDB category record ID |
| `status` | `all`, `draft`, `published`, or `inactive`; default `all` |

Create and update accept the complete editable payload:

```json
{
  "name": "Product name",
  "slug": "product-name",
  "description": "Approved product description",
  "categoryId": "<category record id>",
  "currency": "USD",
  "compareAtPrice": 90,
  "variants": [
    { "id": "30ml", "label": "30 ml", "sku": "SERUM-30", "price": 68 }
  ],
  "images": [
    { "url": "https://approved-image-host.example/product.jpg", "alt": "Product bottle" }
  ],
  "status": "draft"
}
```

`compareAtPrice` is optional and must be higher than the lowest variant price.
Variant prices are non-negative amounts with at most two decimals; the product
`price` is computed by the server from the lowest variant price. Variant IDs
are retained when supplied and generated for new variants. SKU values are
normalized and must be unique across product variants. Only supported editable
fields are accepted; callers cannot set the product record ID, demo flag, or
purchase availability. New products default to unavailable for purchase.

Statuses map to the existing model flags: `published` means active and
published; `draft` means active and unpublished; `inactive` means inactive
and unpublished. A product can only be published into an active, published
category. Catalog response fields used by the customer API remain unchanged;
variant SKU and compare-at metadata are not added to public product responses.

### Category management

Category list supports `page`, `limit`, `search`, and the same `status` values.
Create/update accept `name`, `slug`, `description`, `bannerImage`,
`sortOrder`, and `status`. A category referenced by any product cannot be
deleted (`409 Conflict`). Duplicate product or category slugs return `409`;
invalid payloads or category IDs return `400`; missing records return `404`;
database outages return a safe `503` error envelope.

### Image storage boundary

There is no configured durable image-storage provider or upload workflow.
Catalog management accepts absolute HTTPS image references and alt text; it
does not upload files, fetch images on the server, verify that a URL is
reachable or owned by the business, or treat local `/uploads/...` paths as
production assets. `backend/services/imageStorage.js` is the validation
boundary to replace or extend when an approved storage provider is selected.
The existing ignored `backend/uploads/` static directory is not a production
storage integration.

Admin login accepts:

```json
{
  "email": "operator@example.com",
  "password": "<operator-supplied password>"
}
```

The password is verified against the existing bcrypt hash. The response omits
the password hash and JWT. Invalid credentials use the same generic response
regardless of account role.

## Dashboard response behavior

The dashboard envelope is the standard
`{ "success": true, "message": "...", "data": { ... } }`.

- `metrics.products`, `categories`, `customers`, and `orders` are database
  counts.
- `recentOrders` contains up to eight persisted order summaries. Order records
  are not evidence of payment.
- `metrics.revenue.amount` and `.currency` are `null`, with `status: "unavailable"`
  until verified paid-payment records exist. Order lifecycle statuses are not
  treated as payment verification.
- `inventory.status` is `"not_configured"` because the current Product model
  has no stock fields. No fabricated stock counts or low-stock records are
  returned.
- A database outage returns `503` with a safe error envelope; it does not
  return success-shaped placeholder metrics.

## Initial administrator provisioning

There is no public admin-registration endpoint. Public customer registration
always creates a `customer`.

An authorized operator must first arrange an existing account through the
approved account process, configure a distinct high-entropy `JWT_ADMIN_SECRET`
in the backend environment, then run `npm --prefix backend run admin:provision`
in a trusted interactive shell. The script asks for the existing email twice,
connects only to the configured `zorvellae` database, and changes only that
existing account's role. It neither creates an account nor prints the database
URI. Protect the shell and database credentials, run only against the intended
environment, and grant this role only to explicitly authorized personnel.

The provisioning command and admin login both require MongoDB. They cannot be
verified while Atlas is disconnected.

## Remaining admin work

Customer management, order mutation, inventory management, settings, and
verified payment integration are not implemented. Do not treat disabled
navigation entries as working APIs.
