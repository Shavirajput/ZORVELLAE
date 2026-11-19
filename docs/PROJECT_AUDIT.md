# ZORVELLAE Project Audit

**Audit date:** 2026-11-19  
**Scope:** Existing repository structure, customer frontend, API, MongoDB models,
configuration, available references, dependencies, and current working-tree state.

## Executive summary

This is an existing React/Vite + Express/Mongoose application, not a starter
project. During this work, the existing `client/` and `server/` directories were
moved to `frontend/` and `backend/`; all files, uncommitted source changes, and
`server/.env` were preserved as `backend/.env`. The shopping catalog, customer
authentication, customer data persistence, demo checkout, and customer
order-record foundation are present. The customer order work and some database
retry changes remain uncommitted.

The Atlas connection is **not verified**. A prior direct diagnostic reproduced
TLS alert 80 on all three Atlas SRV targets after TCP connected, with TLS 1.2 and
1.3. The root cause beyond the TLS handshake rejection has not been established.
All database-backed behavior remains unverified against the live database.

The customer editorial pages and admin dashboard described in the project brief
are not implemented. Several documented route names do not match the routes
currently registered. The requested `frontend/` and `backend/` directory layout
has now been applied; admin and content gaps remain.

## Existing repository shape

```text
ZORVELLAE/
  frontend/                React 19, Vite 8, Tailwind 3 application
  backend/                 Express 5 API, Mongoose 9 models and routes
  docs/                    Planning, API, schema, design and page documentation
  references/               Approved PDF references (currently untracked)
  stitch-exports/           Supporting Stitch exports (currently untracked)
  package.json              Root dev/build/lint orchestration
  package-lock.json         Root tooling lockfile
  .gitignore
```

There are 37 JSX files under `frontend/src` and 26 JavaScript files under
`backend/`. A root `README.md` has been added. `backend/.env` exists and is
ignored by Git; its values were not read or displayed during this audit. The
approved PDF directory contains 13 PDFs.

## Current feature assessment

| Area | Finding |
|---|---|
| Storefront layout | Existing shared navigation, announcement bar, footer, main layout, and brand tokens. |
| Home | Implemented with API-backed featured cards and loading/error/empty states; hero imagery remains a placeholder. |
| Shop and category collection | Implemented with API-backed search, category/price-band filters, sorting, pagination, responsive filter drawer, and loading/error/empty states. Requires MongoDB. |
| Product detail | Implemented with gallery placeholders, variants, quantity, wishlist, cart action, information accordions, and related products. Demo items cannot be purchased. Requires MongoDB for product data. |
| Cart and wishlist | Implemented. Guest state uses local storage; signed-in state uses customer APIs. Wishlist cards now use the public catalog API; cart/confirmation line details still resolve from development sample data. |
| Checkout | A local demo review and in-memory confirmation only. It creates no permanent order, payment, shipment, or shipping/tax total. |
| Customer auth/account | Registration, login, logout, session refresh, profile, addresses, cart, and wishlist flows are present. Account routes require an authenticated session. Backend persistence requires MongoDB. |
| Customer orders | An order model, owner-scoped order API, idempotency, snapshots, and account history/detail pages are present in uncommitted work. Demo checkout does not call order creation. Live database behavior is unverified. |
| Editorial/customer content | Routines, routine builder, skin concerns, ingredient library, science, about, and contact currently resolve to a generic placeholder page. No contact submission API exists. |
| Admin | No admin routes, admin user model/role flow, admin API, or dashboard UI. `adminOnly` exists but current customer authentication does not populate an admin role, so it is not an implemented admin security boundary. |
| Payments and shipping | Not implemented. No rates, taxes, payment credentials, or delivery promises are configured. |

## Routes and documented-route discrepancies

Registered frontend routes are in `frontend/src/App.jsx`. Legacy routine-builder
and science paths redirect to the documented canonical routes. Remaining
differences from the page inventory and project brief:

- `/contact/thank-you` is documented but not registered.
- There are no `/admin/*` routes.
- The wildcard route displays the generic placeholder instead of a dedicated 404.

The category route has a compatibility alias at `/shop/:category` in addition
to `/shop/category/:slug`.

## Backend/API assessment

Implemented API groups:

- Authentication: register, login, logout, current user, profile update.
- Public catalog: paginated product search/filter/sort and category/product
  lookups.
- Authenticated customer data: cart, wishlist, addresses, default address, and
  order creation/history/detail.
- Health: reports Mongoose connection state and selected database name when
  connected.

There are no admin, inventory, contact, review, ingredient, upload, or settings
API routes. API envelopes are centralized in `backend/utils/apiResponse.js`.
Ownership-sensitive customer operations query with the authenticated user ID.

The health handler always returns HTTP 200 and includes the actual database
state. It is a liveness-style endpoint, not a readiness signal suitable for
gating traffic.

## Configuration and dependencies

- Root commands: `npm run dev`, `npm run build`, and `npm run lint`.
- Frontend: React, React Router, Axios, Tailwind, Lucide, Vite, and Oxlint.
- Backend: Express, Mongoose, bcryptjs, JWT, express-validator, Helmet, CORS,
  rate limiting, Morgan, dotenv, and nodemon.
- Backend declares `npm run lint` using ESLint; ESLint was not installed in the
  previous validation environment. Frontend lint uses Oxlint.
- `backend/server.js` loads `backend/.env` without overriding already-set
  environment variables. `backend/config/db.js` explicitly selects database
  `zorvellae`, keeps TLS validation at defaults, reports sanitized error types,
  and retries with backoff.
- The Vite `/api` proxy targets `http://localhost:5000`.
- `multer` is declared but there is no upload route or upload workflow.
- The root `.gitignore` ignores `.env` files and excludes dependency/build
  directories. Environment examples are committed; real environment files are
  not.

## Data and trust boundaries

- `frontend/src/data/formulations.js` is the development sample source used by
  the explicit seed script. Samples and prices are clearly marked, and seed
  records are set to demo-only and not purchase-available.
- `backend/scripts/seedCatalog.js` requires development mode and
  `SEED_DEMO_DATA=true`; it upserts only demo targets and does not delete data.
- Customer passwords are bcrypt-hashed, excluded from normal queries, and
  never returned in API payloads.
- Session JWTs are held in HTTP-only cookies; the frontend does not receive the
  secret or token.
- Guest cart and wishlist state is local to the browser. Authenticated customer
  state is stored in MongoDB and scoped to the session owner.
- The explicit order API derives prices and item details from catalog records,
  requires the customer's saved address and cart, and rejects demo/unavailable
  products. It is not connected to the demo checkout.

## Known blockers and risks

1. **MongoDB Atlas TLS:** Current API health reports `disconnected`. The direct
   sanitized error is `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR` / TLS alert 80 from
   each SRV target, after TCP connection. TLS 1.2 and 1.3 both fail. The
   workspace cannot inspect Atlas-side logs or network policy, so the ultimate
   source of the alert remains unknown. Do not disable certificate validation.
2. **Content/assets:** Product listings, prices, descriptions, ingredients,
   imagery, and editorial claims are development placeholders until approved
   product data and owned media are supplied.
3. **Commerce integrations:** No payment provider, shipping rates, tax rules,
   or delivery promises are configured. No real payment/order claim should be
   made from the demo checkout.
4. **Admin authorization:** Admin functionality is absent. Existing middleware
   is insufficient to provide it; server-enforced admin identity/role handling
   and protected routes must be designed before dashboard UI.
5. **Working tree:** The earlier order-management implementation, database retry
   logic, and local reference exports are uncommitted changes. Do not revert,
   overwrite, or delete them during the remaining work.

## Verification performed in this work

- `npm run build`: passed after migration and the homepage/wishlist catalog
  integration changes.
- `npm run lint`: passed with frontend Oxlint.
- Backend JavaScript syntax parsing: all 26 `.js` files passed.
- `npm run dev`: started both migrated applications; frontend and API health
  smoke requests returned HTTP 200. The Vite `/api` proxy also reached the API.
- Browser smoke checks: canonical route redirects passed; homepage and wishlist
  displayed catalog-unavailable states when the API/database was unavailable;
  wishlist empty state returned after clearing test-only browser storage.
- Responsive viewport check on the homepage: 390, 768, 1280, and 1440 px; no
  horizontal overflow detected.
- `git diff --check`: passed. `backend/.env` remains ignored.
- `npm --prefix backend run lint`: not available because ESLint is not installed;
  no dependency was added.
- Atlas connection and database-dependent integration tests: not verified. API
  health returned `disconnected`; no database records were created.

## Prioritized implementation checklist

1. **Complete:** Reorganize `client/` and `server/` into `frontend/` and
   `backend/` without losing the environment file or uncommitted work; update
   commands and paths.
2. **In progress:** Close remaining customer content and integration gaps
   without inventing claims or assets; do not connect demo checkout to
   permanent order creation.
3. Define and implement server-enforced admin identity and APIs before building
   protected admin UI.
4. Keep Atlas-dependent tests explicitly blocked until a real verified
   connection is available; continue running independent frontend/backend
   checks.
5. Only perform final visual implementation against approved PDFs; Stitch HTML
   remains a supporting reference.
