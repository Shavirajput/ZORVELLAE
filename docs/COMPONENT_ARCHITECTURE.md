# ZORVELLAE — Component Architecture

> This file preserves the original intended component map and is not an
> inventory of all components currently implemented. For the live structure,
> routes, and feature status, see `ARCHITECTURE.md` and `FEATURES.md`.

**Framework:** React 19 + Vite 8<br>
**Routing:** React Router v7<br>
**State:** Context API<br>
**Icons:** Lucide React<br>
**Styling:** Tailwind CSS (custom design tokens)

---

## Complete Frontend Folder Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/                     # Static assets
│       ├── hero/
│       ├── products/
│       └── ingredients/
│
├── src/
│   ├── main.jsx                    # Vite entry point
│   ├── App.jsx                     # Router + Layout wrapper
│   │
│   ├── assets/                     # Bundled assets
│   │   ├── fonts/                  # Self-hosted font fallback
│   │   └── icons/                  # Custom SVG icons
│   │
│   ├── styles/
│   │   ├── index.css               # Tailwind directives + global resets
│   │   └── animations.css          # Scroll-reveal, transitions
│   │
│   ├── config/
│   │   └── constants.js            # API base URL, pagination limits
│   │
│   ├── context/                    # Global state via Context API
│   │   ├── AuthContext.jsx         # User auth state
│   │   ├── CartContext.jsx         # Cart items, count, totals
│   │   └── WishlistContext.jsx     # Wishlist items
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useScrollReveal.js      # Intersection Observer reveal
│   │   ├── useOutsideClick.js      # Close dropdowns on outside click
│   │   ├── useDebounce.js          # Search input debounce
│   │   └── useLocalStorage.js      # Persist to localStorage
│   │
│   ├── utils/                      # Helper functions
│   │   ├── api.js                  # Axios instance + interceptors
│   │   ├── formatCurrency.js       # Price formatting
│   │   ├── formatDate.js           # Date formatting
│   │   └── validators.js           # Client-side form validation
│   │
│   ├── layouts/                    # Page layout wrappers
│   │   ├── MainLayout.jsx          # Header + Footer + children
│   │   ├── AuthLayout.jsx          # Minimal layout for login/register
│   │   └── AdminLayout.jsx         # Admin sidebar + header + children
│   │
│   ├── components/                 # Reusable UI components
│   │   │
│   │   ├── common/                 # Truly generic UI atoms
│   │   │   ├── Button.jsx          # Primary / Secondary / Tertiary variants
│   │   │   ├── Badge.jsx           # Clinical / Promo / Bestseller chips
│   │   │   ├── Chip.jsx            # Botanical tag pills
│   │   │   ├── Input.jsx           # Text input with label + error
│   │   │   ├── Textarea.jsx        # Multi-line input
│   │   │   ├── Select.jsx          # Dropdown selector
│   │   │   ├── Checkbox.jsx        # Styled checkbox
│   │   │   ├── RadioCard.jsx       # Variant / shipping selector card
│   │   │   ├── Modal.jsx           # Generic modal wrapper
│   │   │   ├── Drawer.jsx          # Slide-in panel (Cart, Mobile nav)
│   │   │   ├── Accordion.jsx       # Formulation accordion item
│   │   │   ├── Toast.jsx           # Notification toast
│   │   │   ├── Spinner.jsx         # Loading spinner
│   │   │   ├── Breadcrumb.jsx      # Breadcrumb trail
│   │   │   ├── Divider.jsx         # Hairline 1px divider
│   │   │   ├── ProgressBar.jsx     # Shipping threshold bar
│   │   │   ├── StarRating.jsx      # 5-star rating display
│   │   │   └── Pagination.jsx      # Page navigation
│   │   │
│   │   ├── navigation/             # Navigation components
│   │   │   ├── Navbar.jsx          # Main fixed navigation bar
│   │   │   ├── AnnouncementBar.jsx # Top announcement strip
│   │   │   ├── MegaMenuShop.jsx    # 4-col shop dropdown
│   │   │   ├── MegaMenuConcerns.jsx# 3-col skin concerns dropdown
│   │   │   ├── MobileMenu.jsx      # Full-height mobile drawer
│   │   │   └── NavIcons.jsx        # Search, Account, Cart icon group
│   │   │
│   │   ├── product/                # Product display components
│   │   │   ├── ProductCard.jsx     # Grid card (image, name, price, CTA)
│   │   │   ├── ProductGrid.jsx     # Responsive product grid
│   │   │   ├── ProductImageGallery.jsx  # Main stage + thumbnail strip
│   │   │   ├── ProductInfo.jsx     # Name, volume, price, variant panel
│   │   │   ├── ProductBadgeStrip.jsx   # Cruelty-free, phyto etc.
│   │   │   ├── ProductAccordion.jsx    # Ingredient/usage accordion
│   │   │   ├── ProductQuickView.jsx    # Quick-view modal
│   │   │   ├── VariantSelector.jsx     # Size/format radio cards
│   │   │   ├── QuantitySelector.jsx    # +/- quantity input
│   │   │   └── WishlistButton.jsx      # Heart toggle button
│   │   │
│   │   ├── cart/                   # Cart-related components
│   │   │   ├── CartDrawer.jsx      # Slide-in cart panel
│   │   │   ├── CartItem.jsx        # Single cart row
│   │   │   ├── CartSummary.jsx     # Totals + CTA
│   │   │   └── CartEmpty.jsx       # Empty cart state
│   │   │
│   │   ├── checkout/              # Checkout step components
│   │   │   ├── CheckoutStepper.jsx # Progress indicator
│   │   │   ├── ContactForm.jsx     # Email + phone
│   │   │   ├── AddressForm.jsx     # Shipping address
│   │   │   ├── ShippingMethod.jsx  # Shipping option radio cards
│   │   │   ├── PaymentForm.jsx     # Card / payment input
│   │   │   └── OrderSidebarSummary.jsx # Persistent order summary
│   │   │
│   │   ├── filters/               # Shop filtering components
│   │   │   ├── FilterSidebar.jsx   # Desktop filter panel
│   │   │   ├── FilterDrawer.jsx    # Mobile filter drawer
│   │   │   ├── FilterGroup.jsx     # Collapsible filter category
│   │   │   ├── SortSelect.jsx      # Sort-by dropdown
│   │   │   └── ActiveFilters.jsx   # Active filter chips / clear all
│   │   │
│   │   ├── homepage/              # Homepage-specific sections
│   │   │   ├── HeroSection.jsx     # Full-width editorial hero
│   │   │   ├── TrustPillarsRow.jsx # 3-stat clinical proof row
│   │   │   ├── FeaturedProducts.jsx# 3–4 product showcase
│   │   │   ├── ScienceNarrative.jsx# Brand story / science copy
│   │   │   ├── SkinConcernCards.jsx# Category entry cards
│   │   │   ├── IngredientHighlight.jsx # Transparency section
│   │   │   ├── Testimonials.jsx    # Reviews strip
│   │   │   └── NewsletterBanner.jsx# Email capture / ritual CTA |
│   │   │
│   │   ├── search/                # Search overlay
│   │   │   ├── SearchOverlay.jsx   # Full-width search modal
│   │   │   └── SearchResult.jsx    # Individual result item
│   │   │
│   │   └── layout/                # Structural layout components
│   │       ├── Footer.jsx          # Full-width site footer
│   │       └── SectionHeader.jsx   # Reusable section title block
│   │
│   ├── pages/                      # Route-level page components
│   │   │
│   │   ├── HomePage.jsx            # /
│   │   ├── ShopPage.jsx            # /shop
│   │   ├── CategoryPage.jsx        # /shop/category/:slug
│   │   ├── ProductPage.jsx         # /product/:slug
│   │   ├── CartPage.jsx            # /cart
│   │   ├── CheckoutPage.jsx        # /checkout
│   │   ├── OrderConfirmationPage.jsx # /order-confirmation/:id
│   │   │
│   │   ├── SkinConcernsPage.jsx    # /skin-concerns
│   │   ├── RoutinesPage.jsx        # /routines
│   │   ├── RoutineBuilderPage.jsx  # /routines/builder
│   │   ├── IngredientsPage.jsx     # /ingredients
│   │   ├── OurSciencePage.jsx      # /our-science
│   │   ├── AboutPage.jsx           # /about
│   │   │
│   │   ├── ContactPage.jsx         # /contact
│   │   ├── ContactThankYouPage.jsx # /contact/thank-you
│   │   │
│   │   ├── WishlistPage.jsx        # /wishlist
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx       # /login
│   │   │   └── RegisterPage.jsx    # /register
│   │   │
│   │   ├── account/
│   │   │   ├── AccountPage.jsx     # /account
│   │   │   └── OrderDetailPage.jsx # /account/orders/:id
│   │   │
│   │   ├── admin/
│   │   │   ├── AdminLoginPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── AdminProductsPage.jsx
│   │   │   ├── AdminProductFormPage.jsx
│   │   │   ├── AdminCategoriesPage.jsx
│   │   │   ├── AdminInventoryPage.jsx
│   │   │   ├── AdminOrdersPage.jsx
│   │   │   ├── AdminOrderDetailPage.jsx
│   │   │   ├── AdminCustomersPage.jsx
│   │   │   └── AdminCustomerDetailPage.jsx
│   │   │
│   │   └── NotFoundPage.jsx        # 404
│   │
│   └── services/                   # API call functions
│       ├── authService.js          # login, register, logout, getProfile
│       ├── productService.js       # getProducts, getProduct, search
│       ├── categoryService.js      # getCategories, getCategory
│       ├── cartService.js          # getCart, addItem, removeItem, clear
│       ├── wishlistService.js      # getWishlist, toggle
│       ├── orderService.js         # createOrder, getOrders, getOrder
│       ├── paymentService.js       # createPaymentIntent, verify
│       └── contactService.js       # sendMessage
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Context API Architecture

### `ShopContext` (implemented)
```jsx
{
  customer: null | { id, name, email },
  authStatus: 'loading' | 'authenticated' | 'unauthenticated' | 'error',
  cart: [{ productId, variantId, quantity }],
  wishlist: [productId],
  savedAddresses: [{ id, firstName, lastName, ..., isDefault }],
  login(credentials): Promise,
  register(details): Promise,
  logout(): Promise,
  updateProfile(profile): Promise,
  addToCart(productId, variantId, quantity): Promise<boolean>,
  updateQuantity(productId, variantId, quantity): Promise<boolean>,
  removeFromCart(productId, variantId): Promise<boolean>,
  toggleWishlist(productId): Promise<boolean>,
  addSavedAddress(address): Promise<boolean>,
  setDefaultAddress(addressId): Promise<boolean>,
}
```

Authenticated cart, wishlist, and address state is loaded from the customer API
and scoped to the HTTP-only session. Guest cart and wishlist state stays in
browser storage under separate keys; signing in never writes customer selections
to guest storage, and signing out clears customer data from memory.

---

## Routing Structure (React Router v6)

```jsx
<Routes>
  {/* Customer Routes — MainLayout */}
  <Route path="/" element={<MainLayout />}>
    <Route index element={<HomePage />} />
    <Route path="shop" element={<ShopPage />} />
    <Route path="shop/category/:slug" element={<CategoryPage />} />
    <Route path="product/:slug" element={<ProductPage />} />
    <Route path="cart" element={<CartPage />} />
    <Route path="skin-concerns" element={<SkinConcernsPage />} />
    <Route path="routines" element={<RoutinesPage />} />
    <Route path="routines/builder" element={<RoutineBuilderPage />} />
    <Route path="ingredients" element={<IngredientsPage />} />
    <Route path="our-science" element={<OurSciencePage />} />
    <Route path="about" element={<AboutPage />} />
    <Route path="contact" element={<ContactPage />} />
    <Route path="contact/thank-you" element={<ContactThankYouPage />} />
    <Route path="wishlist" element={<WishlistPage />} />

    {/* Protected: requires auth */}
    <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
    <Route path="order-confirmation/:id" element={<ProtectedRoute><OrderConfirmationPage /></ProtectedRoute>} />
    <Route path="account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
    <Route path="account/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
  </Route>

  {/* Auth Routes — AuthLayout */}
  <Route path="/" element={<AuthLayout />}>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
  </Route>

  {/* Admin Routes — AdminLayout + Admin protection */}
  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    <Route path="login" element={<AdminLoginPage />} />
    <Route index element={<AdminDashboardPage />} />
    <Route path="products" element={<AdminProductsPage />} />
    <Route path="products/new" element={<AdminProductFormPage />} />
    <Route path="products/:id/edit" element={<AdminProductFormPage />} />
    <Route path="categories" element={<AdminCategoriesPage />} />
    <Route path="inventory" element={<AdminInventoryPage />} />
    <Route path="orders" element={<AdminOrdersPage />} />
    <Route path="orders/:id" element={<AdminOrderDetailPage />} />
    <Route path="customers" element={<AdminCustomersPage />} />
    <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
  </Route>

  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## Shared Component Props Contracts

### `Button`
```jsx
<Button
  variant="primary" | "secondary" | "tertiary"
  size="sm" | "md" | "lg"
  fullWidth={boolean}
  loading={boolean}
  disabled={boolean}
  onClick={fn}
  type="button" | "submit"
>
  Label
</Button>
```

### `ProductCard`
```jsx
<ProductCard
  product={{ _id, name, slug, price, images, category, badges, clinicalClaim }}
  showWishlist={boolean}
  showQuickView={boolean}
/>
```

### `Accordion`
```jsx
<Accordion title="Active Ingredients" defaultOpen={false}>
  {/* children: ingredient list, stats etc. */}
</Accordion>
```

### `Drawer`
```jsx
<Drawer
  isOpen={boolean}
  onClose={fn}
  position="right" | "left"
  title="Your Formulation Dossier"
>
  {/* children */}
</Drawer>
```

---

## Required npm Packages (Frontend)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "axios": "^1.7.0",
    "lucide-react": "^0.447.0",
    "@tailwindcss/forms": "^0.5.9"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.11.1",
    "eslint-plugin-react": "^7.37.1",
    "prettier": "^3.3.3"
  }
}
```
