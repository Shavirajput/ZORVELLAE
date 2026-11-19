# ZORVELLAE — Page Inventory

**Total Customer-Facing Routes Identified: 23** (including derived account subpages)

## Customer Shopping Milestone

The customer shopping implementation covers Shop All (`/shop`), Category Collection (`/shop/category/:slug`), Product Detail (`/product/:slug`), Cart (`/cart`), Wishlist (`/wishlist`), Checkout (`/checkout`), and Order Confirmation (`/order-confirmation/:id`). Shop, collection, and product detail pages read catalog data from the MongoDB API. `frontend/src/data/formulations.js` remains the single development sample source for the explicit seed command. Signed-in customers' carts and wishlists persist in MongoDB; guest selections remain in browser storage and are not merged into customer accounts.

All current catalog entries, prices, product copy, and image visuals are development placeholders. They are not approved product listings and cannot be purchased. Checkout validates contact and shipping details and displays a cart-derived subtotal, but shipping rates, taxes, and delivery estimates are not configured; therefore no payable total is shown. A signed-in customer's account email and default saved address may prefill checkout, but submitting creates only a local, in-memory demo confirmation. It does not create an order, process payment, or arrange shipment. Replace the sample data and labeled image placeholders only after approved product details and owned photography are supplied.

The public catalog API provides paginated product listing with category, search, price-band, and sort filters; product and category slug lookups; and published/active catalog visibility. Demo seed records are marked as such and are not purchase-available. Run `npm --prefix backend run seed:catalog` only in development with `SEED_DEMO_DATA=true`; the repeatable seed upserts the sample records and does not delete data.

## Customer Account Milestone

The customer account experience covers registration (`/register`), login (`/login`), dashboard (`/account`), profile (`/account/profile`), saved addresses (`/account/addresses`), order history (`/account/orders`), and order details (`/account/orders/:id`). Registration and login use the backend session API with an HTTP-only cookie; protected account APIs scope data to the authenticated customer. Profile details, cart, wishlist, and saved addresses persist in MongoDB. The default saved address is available to prefill the demo checkout. Passwords are never stored in browser storage or returned by the API. Customer order history and detail pages read only persisted orders owned by the signed-in customer; demo checkout confirmation references remain temporary and are not permanent account orders.

---

## Customer-Facing Pages

| # | Page Name | Route | PDF Source | Stitch References | Priority |
|---|-----------|-------|-----------|-------------------|----------|
| 1 | **Homepage** | `/` | `ZORVELLAE — Homepage.pdf` | `main_homepage`, `zorvellae_science_led_skincare_home_1`, `zorvellae_science_led_skincare_home_2`, `zorvellae_science_led_skincare_home_hero_motion`, `zorvellae_science_led_skincare_home_interactive_mega_menus`, `zorvellae_home_with_interactive_cart_drawer` | 🔴 P0 |
| 2 | **Shop All Formulations** | `/shop` | `ZORVELLAE — Shop All Formulations.pdf` | `zorvellae_shop_all_formulations_1`, `zorvellae_shop_all_formulations_2` | 🔴 P0 |
| 3 | **Category Collection** | `/shop/category/:slug` | `ZORVELLAE — Category Collection_ Targeted Serums & Elixirs.pdf` | `zorvellae_targeted_serums_cellular_elixirs_category_collection` | 🔴 P0 |
| 4 | **Product Detail Page (PDP)** | `/product/:slug` | `ZORVELLAE — Ceramide + Bio-Peptide Barrier Serum.pdf` | `zorvellae_ceramide_bio_peptide_barrier_serum_pdp_1`, `zorvellae_ceramide_bio_peptide_barrier_serum_pdp_2`, `zorvellae_ceramide_barrier_serum_pdp_with_interactive_cart_drawer` | 🔴 P0 |
| 5 | **Cart / Formulation Dossier** | `/cart` | `ZORVELLAE — Formulation Dossier & Cart.pdf` | `zorvellae_your_skin_ritual_cart`, `zorvellae_your_skin_ritual_cart_formulation_dispensation` | 🔴 P0 |
| 6 | **Checkout** | `/checkout` | `ZORVELLAE — Clinical Checkout & Formulation Dispatch.pdf` | `zorvellae_clinical_checkout_dispensation_payment` | 🔴 P0 |
| 7 | **Order Confirmation** | `/order-confirmation/:id` | `ZORVELLAE — Monograph Dispatch Confirmation & Telemetry.pdf` | — | 🔴 P0 |
| 8 | **Skincare Routines & Circadian Protocols** | `/routines` | `ZORVELLAE — Skincare Routines & Circadian Protocols.pdf` | `zorvellae_your_skin._your_ritual._skincare_routines` | 🟡 P1 |
| 9 | **Build Your Custom Routine (Routine Builder)** | `/routines/builder` | `ZORVELLAE — Build Your Custom Routine.pdf` | `zorvellae_diagnostic_routine_architecture_skin_quiz`, `zorvellae_get_to_know_your_skin_skincare_quiz` | 🟡 P1 |
| 10 | **Skin Concerns & Clinical Indications** | `/skin-concerns` | `ZORVELLAE — Skin Concerns & Clinical Indications.pdf` | `zorvellae_understand_your_skin_better_skin_concerns` | 🟡 P1 |
| 11 | **Ingredient Library (Monograph Index)** | `/ingredients` | *(Stitch-only — no dedicated PDF, confirmed from nav)* | `zorvellae_know_what_goes_into_your_skincare_ingredient_library` | 🟡 P1 |
| 12 | **Our Science** | `/our-science` | *(Stitch-only — no dedicated PDF, confirmed from nav)* | `zorvellae_science_is_at_the_heart_of_better_skincare_our_science` | 🟡 P1 |
| 13 | **About Us** | `/about` | *(Stitch-only — no dedicated PDF, confirmed from nav)* | `zorvellae_where_botanical_purity_meets_clinical_efficacy_about_us` | 🟡 P1 |
| 14 | **Contact Us** | `/contact` | `ZORVELLAE — Contact Us.pdf` | — | 🟢 P2 |
| 15 | **Message Received (Contact Confirmation)** | `/contact/thank-you` | `ZORVELLAE — Message Received.pdf` | — | 🟢 P2 |
| 16 | **Customer Registration** | `/register` | *(Auth page — derived from account PDF)* | — | 🔴 P0 |
| 17 | **Customer Login** | `/login` | *(Auth page — derived from account PDF)* | — | 🔴 P0 |
| 18 | **Customer Account Dashboard** | `/account` | `ZORVELLAE — Client Account & Monograph History.pdf` | — | 🟡 P1 |
| 19 | **Profile Details** | `/account/profile` | *(Derived from Client Account PDF)* | — | 🟡 P1 |
| 20 | **Saved Addresses** | `/account/addresses` | *(Derived from Client Account and Checkout PDFs)* | — | 🟡 P1 |
| 21 | **Order History** | `/account/orders` | `ZORVELLAE — Client Account & Monograph History.pdf` | — | 🟡 P1 |
| 22 | **Order Detail** | `/account/orders/:id` | *(Derived from account & confirmation PDF)* | — | 🟡 P1 |
| 23 | **Wishlist** | `/wishlist` | *(Functional requirement — UI from shop/PDP reference)* | — | 🟡 P1 |

---

## Admin Dashboard Pages

| # | Page Name | Route | Notes |
|---|-----------|-------|-------|
| A1 | Admin Login | `/admin/login` | Separate auth flow |
| A2 | Dashboard Overview | `/admin/dashboard` | Analytics cards |
| A3 | Product Management | `/admin/products` | CRUD list |
| A4 | Add / Edit Product | `/admin/products/new`, `/admin/products/:id/edit` | Full product form |
| A5 | Category Management | `/admin/categories` | CRUD |
| A6 | Inventory Management | `/admin/inventory` | Stock levels |
| A7 | Order Management | `/admin/orders` | Order list + status update |
| A8 | Order Detail | `/admin/orders/:id` | Full order view |
| A9 | Customer Management | `/admin/customers` | Customer list |
| A10 | Customer Detail | `/admin/customers/:id` | Account view |

---

## UI State & Overlay Layers (not full pages — from Global Interaction States PDF)

| State | Description |
|-------|-------------|
| **Search Overlay** | Full-width search modal with live product suggestions |
| **Cart Drawer** | Slide-in cart panel (from right), persistent across pages |
| **Mega Menu — Shop** | 4-column dropdown with categories, bio-actives, product spotlight, quiz CTA |
| **Mega Menu — Skin Concerns** | 3-column dropdown with clinical concerns |
| **Mobile Navigation Drawer** | Full-height slide-in menu |
| **Quick View Modal** | Product quick-view from shop grid |
| **Toast Notifications** | Add-to-cart, wishlist, error confirmations |
| **Image Zoom/Loupe** | PDP image magnification |
| **Cookie/Consent Banner** | First-visit privacy banner |

The Global Interaction States PDF cited above is not present in the local
`references/approved-pdf-designs/` directory at audit time; it must be restored
before using it for detailed interaction-state implementation.

---

## Page Section Breakdown

### Homepage (`/`)
1. Announcement Bar ("Thoughtful Skincare. Science-Led Formulations.")
2. Fixed Navigation (Logo + Mega Menu + Icons)
3. Hero Section — Full-width editorial with headline + CTA
4. Trust Pillars Row (Clinical proof stats)
5. Featured Formulations Grid (3–4 products)
6. Brand Story / Science Narrative Section
7. Skin Concern Category Cards
8. Ingredient Transparency Section
9. Testimonials / Clinical Results Strip
10. Newsletter / Ritual Subscription Banner
11. Footer

### Product Detail Page (`/product/:slug`)
1. Breadcrumb
2. 7-col Image Gallery + 4-col Thumbnail Strip
3. Clinical Provenance Tags (floating)
4. 5-col Info Panel: Name, Volume, Price, Variant Selector, Add to Bag, Wishlist
5. Clinical Badge Strip (Non-Comedogenic, Phyto-Derived, Cruelty-Free)
6. Formulation Accordions (What It Does / Active Ingredients / Full INCI / How To Apply / Clinical Results)
7. Ingredient Deep-Dive Module
8. Cross-sell / "Complete the Ritual" Section
9. Reviews / Monograph Ratings
10. Recently Viewed

### Shop All (`/shop`)
1. Hero Header with filter summary
2. Filter Sidebar (Category, Concern, Ingredient, Price)
3. Product Grid (3-col desktop, 2-col tablet, 1-col mobile)
4. Pagination / Load More

### Cart (`/cart`)
1. Cart Item List with quantity control
2. Order Summary Panel
3. Coupon / Promo Code
4. Free Shipping Progress Bar
5. Recommended Additions
6. Checkout CTA

### Checkout (`/checkout`)
1. Progress Stepper (Contact & Address → Delivery → Final Review)
2. Validated Contact & Shipping Address Forms
3. Delivery Summary (rates and delivery estimates unconfigured)
4. Cart-Derived Order Summary and Subtotal
5. Explicit Demo-Only Confirmation and Submission

### Order Confirmation (`/order-confirmation/:id`)
1. Local Demo Submission Reference and Status
2. Submitted Contact and Address (current session memory only)
3. Reviewed Sample Lines and Subtotal
4. Shipping / Total Unavailable Notice (no rate or taxes configured)

### Customer Account (`/account`)
1. Authenticated Customer Welcome and Account Navigation
2. Profile Details (persisted name and email)
3. Saved Addresses (persisted, with default selection and empty state)
4. Order History (empty; no permanent orders)
5. Order Details (unavailable unless a real order system is introduced)
6. Demo Login / Registration Forms, Validation, and Logout

---

## Missing Pages / Information Required

> [!WARNING]
> The following items require client clarification before development:

1. **Ingredient Library (Monograph Index)** — No PDF approved. Stitch reference confirms the page exists in navigation. Using Stitch HTML as sole design source pending approval.
2. **Our Science** — No dedicated PDF. Using Stitch HTML as design source pending approval.
3. **About Us** — No dedicated PDF. Using Stitch HTML as design source pending approval.
4. **Search Results page** — Referenced in Global Interaction States PDF as a modal/overlay. Confirm if full page required.
5. **Skin Quiz (multi-step)** — Two Stitch references exist (`get_to_know_your_skin` + `diagnostic_routine_architecture`). Confirm which flow is primary.
6. **Payment Gateway** — Razorpay or Stripe? Client to confirm jurisdiction/preference.
7. **Product Images** — Stitch CDN images cannot be used in production. Client to supply owned product photography.
8. **Brand Logo file** — References show logo image from CDN. Client to supply SVG or PNG.
