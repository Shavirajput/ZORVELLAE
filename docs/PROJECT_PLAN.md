# ZORVELLAE — Project Plan

**Project Name:** ZORVELLAE<br>
**Type:** Full-Stack E-Commerce Website<br>
**Stack:** MERN (MongoDB, Express.js, React.js, Node.js)<br>
**Status:** 🟡 Implementation in progress — see `FEATURES.md` and `PROJECT_AUDIT.md`

---

## Executive Summary

ZORVELLAE is a premium botanical clinical skincare brand requiring a bespoke e-commerce platform. The site must express a "Warm Editorial Minimalism" design language — fusing pharmaceutical rigour with luxury aesthetic sensibility. It is built from scratch using the MERN stack, Vite, Tailwind CSS, and React Router, with a full admin dashboard and RESTful backend.

---

## Reference Sources Analysed

### Approved PDF References (13 local files; one listed item is unavailable)

| # | PDF File | Page Mapped To |
|---|----------|----------------|
| 1 | `ZORVELLAE — Homepage.pdf` | Homepage |
| 2 | `ZORVELLAE — Shop All Formulations.pdf` | Shop All Formulations |
| 3 | `ZORVELLAE — Category Collection_ Targeted Serums & Elixirs.pdf` | Category Page |
| 4 | `ZORVELLAE — Ceramide + Bio-Peptide Barrier Serum.pdf` | Product Detail Page |
| 5 | `ZORVELLAE — Formulation Dossier & Cart.pdf` | Cart / Dossier Page |
| 6 | `ZORVELLAE — Clinical Checkout & Formulation Dispatch.pdf` | Checkout Page |
| 7 | `ZORVELLAE — Monograph Dispatch Confirmation & Telemetry.pdf` | Order Confirmation |
| 8 | `ZORVELLAE — Build Your Custom Routine.pdf` | Skincare Routine Builder |
| 9 | `ZORVELLAE — Skincare Routines & Circadian Protocols.pdf` | Skincare Routines Page |
| 10 | `ZORVELLAE — Skin Concerns & Clinical Indications.pdf` | Skin Concerns Page |
| 11 | `ZORVELLAE — Client Account & Monograph History.pdf` | Customer Account Page |
| 12 | `ZORVELLAE — Contact Us.pdf` | Contact Us Page |
| 13 | `ZORVELLAE — Message Received.pdf` | Contact Confirmation Page |
| 14 | `ZORVELLAE — Global Interaction States Suite.pdf` | UI State Reference (Design QA; not present in the local PDF directory) |

### Stitch HTML Exports (23 concepts across 22 folders)

| Stitch Folder | Purpose |
|---------------|---------|
| `main_homepage` | Homepage concept A |
| `zorvellae_science_led_skincare_home_1` | Homepage variant B |
| `zorvellae_science_led_skincare_home_2` | Homepage variant C |
| `zorvellae_science_led_skincare_home_hero_motion` | Hero section animation |
| `zorvellae_science_led_skincare_home_interactive_mega_menus` | Mega menu interaction |
| `zorvellae_home_with_interactive_cart_drawer` | Cart drawer interaction |
| `zorvellae_ceramide_bio_peptide_barrier_serum_pdp_1` | PDP layout v1 |
| `zorvellae_ceramide_bio_peptide_barrier_serum_pdp_2` | PDP layout v2 |
| `zorvellae_ceramide_barrier_serum_pdp_with_interactive_cart_drawer` | PDP + cart drawer |
| `zorvellae_shop_all_formulations_1` | Shop page v1 |
| `zorvellae_shop_all_formulations_2` | Shop page v2 |
| `zorvellae_targeted_serums_cellular_elixirs_category_collection` | Category page |
| `zorvellae_your_skin_ritual_cart` | Cart page |
| `zorvellae_your_skin_ritual_cart_formulation_dispensation` | Cart + dispatch state |
| `zorvellae_clinical_checkout_dispensation_payment` | Checkout page |
| `zorvellae_diagnostic_routine_architecture_skin_quiz` | Routine builder (quiz flow) |
| `zorvellae_get_to_know_your_skin_skincare_quiz` | Skin quiz entry |
| `zorvellae_your_skin._your_ritual._skincare_routines` | Skincare routines page |
| `zorvellae_understand_your_skin_better_skin_concerns` | Skin concerns page |
| `zorvellae_know_what_goes_into_your_skincare_ingredient_library` | Ingredient library |
| `zorvellae_science_is_at_the_heart_of_better_skincare_our_science` | Our Science page |
| `zorvellae_where_botanical_purity_meets_clinical_efficacy_about_us` | About Us page |
| `botanical_clinical_luxury` | DESIGN.md / design system |

---

## Implementation Phases

| Phase | Description | Priority |
|-------|-------------|----------|
| **Phase 0** | Planning & Documentation | ✅ Complete |
| **Phase 1** | Project scaffolding (Vite + Express + MongoDB) | 🔴 High |
| **Phase 2** | Design system (Tailwind config, tokens, fonts) | 🔴 High |
| **Phase 3** | Backend models + Auth API | 🔴 High |
| **Phase 4** | Shared frontend components | 🔴 High |
| **Phase 5** | Core commerce pages (Homepage, Shop, PDP, Cart, Checkout) | 🔴 High |
| **Phase 6** | Backend commerce APIs | 🔴 High |
| **Phase 7** | Editorial/content pages (Routines, Concerns, Ingredients, Science, About) | 🟡 Medium |
| **Phase 8** | Auth & Account pages | 🟡 Medium |
| **Phase 9** | Contact + utility pages | 🟢 Low |
| **Phase 10** | Admin Dashboard | 🟡 Medium |
| **Phase 11** | QA, responsive testing, polish | 🟡 Medium |

---

## Technology Stack

### Frontend
- **React 18** + Vite 5
- **React Router v6**
- **Tailwind CSS v3** (custom design tokens from DESIGN.md)
- **Context API** (Cart, Auth, Wishlist)
- **Lucide React** (icons)
- **Google Fonts** (Playfair Display + Inter)
- **Axios** (API client)

### Backend
- **Node.js 20** + Express.js 4
- **MongoDB** (local dev) / MongoDB Atlas (free tier)
- **Mongoose 8**
- **jsonwebtoken** (JWT)
- **bcryptjs** (password hashing, saltRounds: 12)
- **express-validator** (input validation)
- **multer** (image uploads)
- **helmet** + **express-rate-limit** (security)
- **nodemailer** (contact emails)
- **dotenv**

### Payment (Free / Test Mode)
- **Razorpay** (India — free test mode) OR
- **Stripe** (international — free test mode)
- Signature verification done **backend-only**

### Dev Tools
- Git + GitHub
- Postman (API testing)
- concurrently (run frontend + backend together in dev)
- ESLint + Prettier
- nodemon

---

## Strict Requirements Confirmed

- ✅ No Shopify
- ✅ No WordPress / Liquid
- ✅ No paid templates or paid UI libraries
- ✅ Tailwind CSS (free, open-source)
- ✅ Lucide React (free, open-source)
- ✅ All components custom-coded from scratch
- ✅ Design follows approved PDFs (not invented)
- ✅ Code is modular — one component per file, reusable architecture

---

## Brand Language Notes

The brand uses specific terminology that must be reflected in UI copy:

| Standard Term | Zorvellae Brand Term |
|---------------|----------------------|
| Product | Formulation |
| Product Detail | Monograph / Formulation Dossier |
| Cart | Your Formulation Dossier |
| Order / Shipping | Dispatch / Monograph Dispatch |
| Order Confirmation | Dispatch Telemetry |
| Customer | Client |
| Ingredients | Bio-Actives / Monograph Index |
