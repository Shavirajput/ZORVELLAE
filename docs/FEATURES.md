# ZORVELLAE Feature Status

This checklist describes actual code paths, not merely links or buttons. Status
is intentionally split between implementation and verification: the Atlas
connection currently fails during TLS negotiation, so persistence and API
behavior have not been verified against the live database.

Legend:

- **Implemented** — meaningful UI/API behavior exists in the repository.
- **Partial** — some behavior exists but does not satisfy the full feature
  scope.
- **Missing** — no functional implementation found.
- **Blocked/unverified** — code exists but depends on a currently unavailable
  live MongoDB connection or external business/provider configuration.

## Customer-facing features

| Feature | Status | Notes |
|---|---|---|
| Homepage | Partial | Existing editorial sections and links; featured products now load from the catalog API with loading/error/empty states. Hero imagery remains a placeholder. |
| Shop all | Implemented; DB-unverified | API-backed search, category and price-band filtering, sort, pagination, responsive filters, and request states. |
| Category collection | Implemented; DB-unverified | Heading, description, banner slot, breadcrumb, filters, and product grid. |
| Product detail | Implemented; DB-unverified | Gallery placeholder support, variants, quantity, wishlist, sample cart action, accordions, related items. No purchase-available demo product. |
| Guest cart | Implemented | Stored in browser local storage; no merge to customer cart. |
| Authenticated cart | Implemented; DB-unverified | Customer-scoped API supports add, update, remove, and clear. |
| Guest wishlist | Implemented | Stored in browser local storage; saved product cards load from the public catalog API. |
| Authenticated wishlist | Implemented; DB-unverified | Customer-scoped API supports add, remove, and clear; catalog rendering remains DB-dependent. |
| Registration/login/logout | Implemented; DB-unverified | Validated API flows, bcrypt password hashes, HTTP-only session cookie, and session refresh. |
| Protected account | Implemented; DB-unverified | `AccountLayout` redirects unauthenticated users and distinguishes session loading/errors. |
| Profile | Implemented; DB-unverified | Name/email persistence through current-user API. |
| Saved addresses | Implemented; DB-unverified | Owner-scoped CRUD, server validation, and default address selection. |
| Checkout | Partial by design | Validated local demo submission only. No permanent order, payment, shipment, tax, shipping rate, or payable total. |
| Demo confirmation | Implemented | In-memory session-only reference; does not become an order-history record. |
| Permanent customer order API | Implemented in uncommitted work; DB-unverified | Authenticated cart/address-based order creation, idempotency, snapshots, owner-scoped history/detail; not used by demo checkout. |
| Customer order pages | Implemented in uncommitted work; DB-unverified | History/detail UI with loading, errors, empty state, pagination, and temporary-demo handling. |
| Routines and routine builder | Missing | Routes render a generic placeholder. `/routine-builder` redirects to the canonical `/routines/builder`. |
| Skin concerns | Missing | Current route renders a generic placeholder. |
| Ingredient library | Missing | Current route renders a generic placeholder; no ingredient API/model. |
| Our science | Missing | Canonical route `/our-science` renders a generic placeholder; `/science` redirects to it. |
| About | Missing | Current route renders a generic placeholder. |
| Contact form/confirmation | Missing | `/contact` is a generic placeholder; no submission API or `/contact/thank-you` route. |
| Dedicated not-found page | Missing | The wildcard route renders the generic placeholder. |

## Admin and operations

| Feature | Status | Notes |
|---|---|---|
| Admin login and role model | Implemented; DB-unverified | `User.role` defaults to `customer`; admin login requires persisted admin role, separate signing secret, and separate HTTP-only cookie. Provisioning is operator-only. |
| Protected admin API | Implemented; DB-unverified | Every protected request verifies admin token and reloads the persisted role; customers and customer JWTs are rejected. |
| Admin dashboard foundation | Implemented; DB-unverified | Protected API returns actual record counts and recent orders; verified revenue and inventory are explicitly unavailable until supported by models/integrations. |
| Admin dashboard responsive shell | Implemented | Admin login/dashboard routes, protected layout, sidebar, profile, logout, mobile nav; order/customer/inventory/settings sections remain disabled. |
| Product management | Implemented; DB-unverified | Protected search/filter/pagination, create/edit/delete, variants/SKU, server-validated prices, HTTPS image references, and publication status. New products are not purchase-available. |
| Category management | Implemented; DB-unverified | Protected search/filter/pagination, create/edit/delete, status and image reference; deletion is blocked while products reference the category. |
| Catalog image upload | Not configured | No durable image service exists. Admin accepts HTTPS URL references only; it does not verify ownership or availability, and local `/uploads` paths are rejected. |
| Order management | Missing | Customer order lifecycle is modeled; no admin list/status-update API or UI. |
| Customer management | Missing | No admin customer APIs or pages. |
| Inventory | Missing | No inventory/SKU/stock model or API. |
| Store settings | Missing | No settings model/API/UI. |
| Image uploads | Missing | `multer` is installed, but no upload routes or complete storage workflow exist. |
| Contact submissions | Missing | No contact model/API/admin inbox. |
| Payment processing | Intentionally disabled | No provider integration; credentials must not be simulated. |
| Shipping/tax calculation | Intentionally unconfigured | No approved rates, rules, or delivery promises. |

## API inventory

| API group | Implemented endpoints |
|---|---|
| Health | `GET /api/health` |
| Authentication | `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me`; `PATCH /api/auth/me` |
| Catalog | `GET /api/products`, `/api/products/:slug`, `/api/categories`, `/api/categories/:slug` |
| Customer cart | `GET/DELETE /api/customer/cart`; `POST/PATCH/DELETE /api/customer/cart/items` |
| Customer wishlist | `GET/DELETE /api/customer/wishlist`; `POST /api/customer/wishlist/items`; `DELETE /api/customer/wishlist/items/:productId` |
| Customer addresses | `GET/POST /api/customer/addresses`; `PATCH/DELETE /api/customer/addresses/:addressId`; `PATCH /api/customer/addresses/:addressId/default` |
| Customer orders | `POST /api/customer/orders`; `GET /api/customer/orders`; `GET /api/customer/orders/:orderId` |
| Admin authentication | `POST /api/admin/auth/login`, `POST /api/admin/auth/logout`, `GET /api/admin/auth/me` |
| Admin dashboard | `GET /api/admin/dashboard` |
| Admin products | `GET/POST /api/admin/products`; `GET/PUT/DELETE /api/admin/products/:productId` |
| Admin categories | `GET/POST /api/admin/categories`; `GET/PUT/DELETE /api/admin/categories/:categoryId` |
| Contact/ingredient/inventory/settings/payment | No API routes found |

## Route discrepancies

- `/contact/thank-you` appears in the inventory but is not registered.
- Admin routes now include `/admin/login`, `/admin/dashboard`, product
  list/create/edit routes, and category list/create/edit routes. They are
  protected by the admin session context; API-backed session verification
  requires MongoDB.

## Verification state

- Frontend production build and Oxlint passed for the admin foundation and
  catalog UI. All 36 backend JavaScript files passed syntax parsing.
- `npm --prefix backend test` passed 15 isolated tests covering product and
  category validation, list query validation, model/index fields, unauthorized
  admin CRUD methods, and existing public catalog route/response compatibility.
- Mocked Playwright UI checks found no horizontal overflow on the product list
  at 390, 768, 1280, and 1440 px; category list and both create forms at 390 px.
  The responsive admin navigation opened at 390 px. Mock records were used;
  these checks do not verify real API or database behavior.
- `git diff --check` passed. Backend ESLint did not run because ESLint is not
  installed; no package was added.
- Live CRUD, persisted duplicate-slug behavior, invalid category references,
  and category dependency checks remain unverified because Atlas is
  disconnected.
- The running API health endpoint reports MongoDB disconnected; public catalog
  GET requests return safe `503` responses, while unauthenticated admin product
  access returns `401`.
- Root `npm run dev` started both applications; frontend, backend health, and
  Vite proxy smoke checks returned HTTP 200.
- Canonical routine/science route redirects passed browser checks. Homepage and
  wishlist catalog failure states and the wishlist empty state passed browser
  checks. Homepage responsive checks at 390, 768, 1280, and 1440 px detected no
  horizontal overflow.
- Atlas is currently disconnected due to a TLS alert from the remote endpoint or
  intervening network path. The exact source is not confirmed.
- Database model/API behavior, persistence across refresh/login, and
  cross-customer isolation are therefore not verified against Atlas.
- Earlier order-foundation validation reported frontend build/lint and backend
  syntax checks passed; live DB tests did not run. Re-run local checks after
  migration or implementation changes.
- Do not describe the application as production-ready. Approved content/assets,
  real database verification, remaining admin workflows, contact handling,
  payment, shipping/tax policy, and full responsive QA remain outstanding.
- Admin role guards, session token-type rejection, customer-cookie rejection,
  route protection, and default customer-role validation are covered by
  `backend/tests/admin-auth.test.js`; these checks do not require Atlas.
