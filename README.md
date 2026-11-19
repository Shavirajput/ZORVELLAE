# ZORVELLAE

Existing MERN storefront and API. The project is organized into `frontend/`
(React/Vite) and `backend/` (Express/Mongoose). Development product records and
prices are samples only; no real purchases or payments are enabled.

## Requirements

- Node.js and npm versions supported by the installed Vite and Express packages.
- MongoDB access is required for catalog, account, and customer persistence
  features. Atlas currently has an unresolved TLS handshake failure; see
  `docs/PROJECT_AUDIT.md`.

## Install

From the repository root, install each existing package's dependencies:

```powershell
npm install
npm install --prefix frontend
npm install --prefix backend
```

The backend reads `backend/.env`. A placeholder template is available at
`backend/.env.example`; create the real file only if it does not already exist
and fill in approved local configuration. Never commit `.env` files.
`MONGO_URI` is used by the backend and the selected database name is
`zorvellae`. Authentication also requires a sufficiently long `JWT_SECRET`.

The frontend API client uses the Vite `/api` proxy to `http://localhost:5000` by
default. Set `CLIENT_URL` to the frontend origin if changing the dev server
origin.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the backend and frontend development servers |
| `npm run build` | Build the frontend for production |
| `npm run lint` | Run frontend Oxlint |
| `npm start` | Start the backend API only |
| `npm --prefix backend run seed:catalog` | Explicit development catalog seed; requires `NODE_ENV=development` and `SEED_DEMO_DATA=true` |

The seed command is not run automatically at startup. It upserts only marked
development sample records and does not delete database data.

## API and customer data

- Health: `GET /api/health`
- Auth: `/api/auth`
- Public catalog: `/api/products`, `/api/categories`
- Authenticated customer data: `/api/customer`

Guest cart and wishlist state remain browser-local. Authenticated cart,
wishlist, address, profile, and order-record APIs require the database. Demo
checkout submissions stay in memory and do not create permanent order records.
Payment processing, shipping rates, taxes, and delivery estimates are not
configured.

## Documentation

- `docs/PROJECT_AUDIT.md` — current findings, blockers, and prioritized work.
- `docs/FEATURES.md` — implemented, partial, missing, and unverified features.
- `docs/ARCHITECTURE.md` — application structure, data flows, and security
  boundaries.
- `docs/PAGE_INVENTORY.md` and `docs/DESIGN_SYSTEM.md` — approved page/design
  references and brand tokens.

Approved PDFs in `references/approved-pdf-designs/` are the design authority.
Stitch exports are supporting references only.
