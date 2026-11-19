# ZORVELLAE Architecture

**Current state audited:** 2026-11-19  
**Repository layout:** `frontend/` and `backend/`.

## Current runtime topology

```text
Browser
  └── React 19 + Vite 8 + React Router 7
        ├── ShopContext: customer auth/session, guest/cart/wishlist, saved addresses
        ├── AdminContext: separate admin session and route state
        └── Axios API client (credentials enabled)
              └── Vite /api proxy -> Express 5 on localhost:5000
                    ├── auth routes
                    ├── admin auth/dashboard/catalog-management routes
                    ├── public catalog routes
                    ├── authenticated customer routes
                    ├── health route
                    └── Mongoose 9 -> MongoDB Atlas database "zorvellae"
```

The application directories have been migrated from `client/` and `server/`.
Root scripts use npm `--prefix` and `concurrently` to run both development
servers. `npm run start` starts the backend API; it does not serve the frontend.

## Frontend organization

```text
frontend/src/
  App.jsx                     Route table and ShopProvider
  layouts/MainLayout.jsx      Shared storefront frame
  context/ShopContext.jsx     Authenticated and guest state orchestration
  services/                   Axios-backed auth/catalog/customer/order clients
  data/formulations.js        Development sample data and price helpers
  components/
    account/ admin/ cart/ checkout/ forms/ layout/ product/
  pages/                      Route-level customer and admin pages
  utils/cart.js               Cart line and demo subtotal helpers
```

Guest cart/wishlist data is stored in browser local storage. Signed-in data is
loaded from `/api/customer/*`; this state is not merged into guest data. The
product/category pages, homepage featured cards, and wishlist display use the
catalog API. Cart and demo-confirmation line details still resolve through the
centralized development sample module.

The account layout protects customer account pages. Checkout is intentionally
not a payment flow: it creates an in-memory demo confirmation and does not call
the permanent order API.

## Backend organization

```text
backend/
  server.js
  config/                     db.js, security.js
  middleware/                 auth, origin check, error handling, not-found
  models/                     User, Category, Product, Cart, Wishlist, Address,
                              Order (Order is currently uncommitted)
  controllers/                auth, admin, admin catalog, public catalog, customer data, orders
  routes/                     auth, admin, products, categories, customer, health
  validators/adminCatalog.js  Admin catalog input and status validation
  services/imageStorage.js    HTTPS image-reference validation boundary
  scripts/seedCatalog.js      Explicit development-only sample seed
  scripts/provisionAdmin.js   Operator-only existing-account role promotion
  tests/                       Database-independent authorization, validation,
                               model, and catalog contract tests
  utils/                      response envelope and async handler
```

`backend/server.js` loads `backend/.env` with dotenv and does not override existing
environment variables. `backend/config/db.js` uses `MONGO_URI`, selects
`zorvellae`, leaves TLS verification at the Node/MongoDB defaults, and retries
connection failures with backoff. The Atlas TLS handshake currently fails, so
the API can start while database-backed endpoints return safe unavailable
responses.

## Data model and request boundaries

- `User` owns one `Cart`, one `Wishlist`, multiple `Address` records, and many
  `Order` records.
- `Product` references `Category`; catalog product IDs and variant IDs are
  stable strings. Admin edits retain variant IDs where present; variant SKU and
  optional product compare-at price are persisted separately from public
  catalog response shapes.
- Cart items store product/variant IDs and quantity, not trusted prices.
- Order items and shipping address are immutable snapshots. The order subtotal
  is computed from database product variant prices; shipping and tax remain
  uncalculated.
- Customer authentication uses bcryptjs and a signed JWT in an HTTP-only
  customer cookie. Admin authentication uses a separate signing secret,
  `JWT_ADMIN_SECRET`, and `zorvellae_admin_session` cookie. Admin JWTs and
  customer JWTs have distinct token types and are not interchangeable. The
  browser uses credentialed Axios requests; tokens and secrets are never
  returned to client code.
- `User.role` defaults to `customer`; public registration assigns `customer`
  explicitly. There is no public admin-registration route. An authorized
  operator can promote an existing account through the interactive
  `admin:provision` command. Protected admin requests re-check the persisted
  role on every request.
- Customer APIs scope lookups and writes to the authenticated session subject.
- Public catalog responses only include active/published records.
- Seed data is clearly demo-only and unavailable for purchase; the seed command
  requires development mode and explicit `SEED_DEMO_DATA=true`.

## API ownership

| Concern | Current route prefix | Current responsibility |
|---|---|---|
| Health | `/api/health` | Report process and actual Mongoose state |
| Auth/profile | `/api/auth` | Customer register/login/logout/current-user/profile |
| Catalog | `/api/products`, `/api/categories` | Public read/search/filter/sort |
| Customer data | `/api/customer` | Customer cart, wishlist, addresses, and order records |
| Admin | `/api/admin` | Separate login/logout/current-admin session, protected dashboard summary, and product/category CRUD |
| Contact/operations | Not present | Contact, CRUD, inventory and settings APIs are not implemented |

API responses use `{ success, message, data?, pagination? }` or
`{ success: false, message, errors? }`. Input validation is applied at route
boundaries with `express-validator`; model/controller checks enforce availability
and ownership.

## Security and external integration boundaries

- `.env` files are ignored; `backend/.env.example` contains placeholders only.
- CORS allows configured client origins and credentials.
- Auth mutation routes verify request origin.
- Admin authorization checks both the separately signed admin token and the
  current database role. If Atlas is unavailable, protected admin operations
  fail closed with `503`; no admin session is accepted without verifying the
  persisted account.
- Product and category CRUD accepts only explicit editable fields, validates
  slugs, prices, variants, category references, statuses, and image references
  on the server. Product prices are derived from variant prices; new records
  are not made purchase-available by these APIs. Category deletion is rejected
  while any product references it.
- Dashboard revenue is reported unavailable because orders have no verified
  payment state. Inventory is reported not configured because the Product model
  has no stock data. Neither value is inferred or filled with fabricated
  analytics.
- Catalog images are HTTPS references only; URL reachability and business
  ownership are not verified. The existing ignored local
  `backend/uploads/` directory and static route are not durable image storage;
  no upload endpoint or storage provider is configured. Product/category
  management does not claim that local paths are production URLs. Provider
  integration must replace or extend the `imageStorage` validation boundary
  after a storage service is approved.
- No payment provider, shipping-rate service, tax configuration, contact mail
  service, or production image storage integration is present.
- The health endpoint always returns HTTP 200 while including the current
  database connection status; it functions as liveness, not readiness.

## MongoDB availability

The current failure is a TLS handshake alert (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`,
TLS alert 80) after TCP succeeds to each resolved Atlas SRV target. Forced TLS
1.2 and TLS 1.3 attempts both fail. The workspace cannot inspect Atlas-side
connection logs or the network path; the underlying source of the alert remains
unconfirmed. Catalog CRUD is therefore covered by database-independent
validation and authorization tests only; live CRUD and duplicate-index behavior
remain blocked. Do not bypass TLS verification or substitute local/mock
storage for production persistence.

## Migration completed

Target:

```text
ZORVELLAE/
  frontend/
  backend/                    (includes the preserved environment file as .env)
  references/                (preserve as-is)
  stitch-exports/            (preserve as-is)
  docs/
  package.json
  package-lock.json
  .gitignore
  README.md
```

The source directories were moved without recreating or deleting project files.
The root scripts, ignore paths, seed script's centralized-data path, and
documentation references were updated. Frontend build and lint, backend syntax,
and moved frontend/backend/proxy startup smoke tests have passed. The database
was disconnected during the smoke test, so no database-dependent behavior was
verified. No dependencies were added for this reorganization.
