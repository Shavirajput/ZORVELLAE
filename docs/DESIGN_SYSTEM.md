# ZORVELLAE — Design System

**Source:** `botanical_clinical_luxury/DESIGN.md` + All 23 Stitch HTML exports<br>
**Style:** Warm Editorial Minimalism<br>
**Aesthetic:** Pharmaceutical rigour × Luxury sensorial ritual

---

## Color Palette

### Brand Colors (Semantic Names)

| Token | Hex | Usage |
|-------|-----|-------|
| `espresso` / `primary` | `#120904` (deep) / `#2B1F17` (container) | Primary text, CTAs, borders, wordmarks |
| `rose-beige` / `secondary` | `#735949` | Secondary text, accent borders, links |
| `sage-green` / `tertiary` | `#000e04` (deep) / `#6B7F6E` (practical) | Ingredient badges, clinical tags, success states |
| `ivory` / `background` | `#fcf9f3` | Canvas, page background, modal backgrounds |
| `blush` / `secondary-container` | `#ffdcc6` | Promo chips, offer badges, hover highlights |

### Full Design Token Map (Tailwind-ready)

```js
colors: {
  // Surfaces
  "surface":                   "#fcf9f3",   // main canvas
  "surface-dim":               "#dcdad4",
  "surface-bright":            "#fcf9f3",
  "surface-container-lowest":  "#ffffff",   // product cards
  "surface-container-low":     "#f6f3ed",   // secondary modules
  "surface-container":         "#f0eee8",   // alternating rows
  "surface-container-high":    "#ebe8e2",
  "surface-container-highest": "#e5e2dc",
  "surface-variant":           "#e5e2dc",
  "background":                "#fcf9f3",

  // Text / On-surface
  "on-surface":                "#1c1c18",   // primary body text
  "on-surface-variant":        "#4e4540",   // secondary/muted text
  "inverse-surface":           "#31312d",
  "inverse-on-surface":        "#f3f0ea",

  // Primary (Espresso)
  "primary":                   "#120904",
  "on-primary":                "#ffffff",
  "primary-container":         "#2b1f17",   // ← USE THIS as espresso in practice
  "on-primary-container":      "#98857a",
  "primary-fixed":             "#f5ded1",
  "primary-fixed-dim":         "#d8c2b6",
  "on-primary-fixed":          "#251911",
  "on-primary-fixed-variant":  "#53443a",
  "inverse-primary":           "#d8c2b6",

  // Secondary (Rose Beige)
  "secondary":                 "#735949",
  "on-secondary":              "#ffffff",
  "secondary-container":       "#ffdcc6",
  "on-secondary-container":    "#795f4e",
  "secondary-fixed":           "#ffdcc6",
  "secondary-fixed-dim":       "#e1c0ac",
  "on-secondary-fixed":        "#29170b",
  "on-secondary-fixed-variant":"#594232",

  // Tertiary (Sage Green)
  "tertiary":                  "#000e04",
  "on-tertiary":               "#ffffff",
  "tertiary-container":        "#132518",
  "on-tertiary-container":     "#798e7c",   // ← USE THIS as sage-green in practice
  "tertiary-fixed":            "#d2e8d4",
  "tertiary-fixed-dim":        "#b7ccb8",
  "on-tertiary-fixed":         "#0d1f13",
  "on-tertiary-fixed-variant": "#384b3c",

  // Outline / Borders
  "outline":                   "#80756f",
  "outline-variant":           "#d1c4bd",
  "surface-tint":              "#6b5b51",

  // Error
  "error":                     "#ba1a1a",
  "on-error":                  "#ffffff",
  "error-container":           "#ffdad6",
  "on-error-container":        "#93000a",
}
```

### Color Usage Hierarchy
- **60% Ivory** `#fcf9f3` — Page backgrounds, negative space, modal backgrounds
- **15% Espresso** `#2B1F17` — Headings, primary CTAs, active borders, icons
- **10% Rose Beige** `#735949` / `#D9B8A4` — Secondary containers, table rows, outlines
- **10% Sage Green** `#6B7F6E` — Ingredient badges, eco tags, success states
- **5% Blush** `#ffdcc6` — Promotional chips, hover states, seasonal badges

---

## Typography

### Font Families

| Role | Family | Usage |
|------|---------|-------|
| Headlines | **Playfair Display** | All `h1`–`h4`, hero text, product names, section titles |
| Body / UI | **Inter** | Body copy, prices, labels, form inputs, micro-copy |

**Google Fonts import string:**
```
https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap
```

### Type Scale

| Token | Family | Size | Weight | Line-Height | Letter-Spacing | Usage |
|-------|---------|------|--------|-------------|----------------|-------|
| `headline-xl` | Playfair Display | 56px | 400 | 64px | -0.02em | Hero titles (desktop) |
| `headline-xl-mobile` | Playfair Display | 36px | 400 | 44px | -0.01em | Hero titles (mobile) |
| `headline-lg` | Playfair Display | 40px | 400 | 48px | -0.01em | Section titles (desktop) |
| `headline-lg-mobile` | Playfair Display | 28px | 400 | 36px | 0em | Section titles (mobile) |
| `headline-md` | Playfair Display | 28px | 500 | 36px | 0em | Sub-section titles |
| `headline-sm` | Playfair Display | 22px | 500 | 30px | 0.01em | Product names, card titles |
| `body-lg` | Inter | 18px | 400 | 28px | -0.01em | Hero body, intro paragraphs |
| `body-md` | Inter | 15px | 400 | 24px | 0em | Standard body text |
| `body-sm` | Inter | 13px | 400 | 20px | 0.01em | Captions, secondary copy |
| `label-lg` | Inter | 14px | 600 | 20px | 0.08em | Button labels, nav items (uppercase) |
| `label-md` | Inter | 12px | 600 | 16px | 0.12em | Tags, breadcrumbs (uppercase) |
| `label-sm` | Inter | 10px | 600 | 14px | 0.15em | Micro labels, batch numbers (uppercase) |

---

## Spacing System

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `space-xs` | 0.25rem | 4px | Icon gap, tiny padding |
| `space-sm` | 0.5rem | 8px | Small gaps |
| `space-md` | 1rem | 16px | Standard component padding |
| `space-lg` | 1.5rem | 24px | Card padding, section gaps |
| `space-xl` | 2.5rem | 40px | Large section padding |
| `space-2xl` | 4rem | 64px | Section vertical rhythm |
| `space-3xl` | 6rem | 96px | Major section breaks |
| `gutter` | 1.5rem | 24px | Column gutters (desktop) |
| `gutter-mobile` | 1rem | 16px | Column gutters (mobile) |
| `margin` | 2rem | 32px | Outer canvas margins (desktop) |
| `margin-mobile` | 1rem | 16px | Outer canvas margins (mobile) |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 0.125rem (2px) | Chips, pill tags |
| `rounded` | 0.25rem (4px) | Default — buttons, inputs, cards |
| `rounded-md` | 0.375rem (6px) | Intermediate containers |
| `rounded-lg` | 0.5rem (8px) | Product cards, modals, hero cards |
| `rounded-xl` | 0.75rem (12px) | Large featured cards |
| `rounded-full` | 9999px | Circular badges, botanical tag pills |

---

## Grid Layout

| Breakpoint | Columns | Gutter | Max Width |
|------------|---------|--------|-----------|
| Mobile (<768px) | 4 | 1rem | fluid |
| Tablet (768–1024px) | 8 | 1.5rem | fluid |
| Desktop (>1024px) | 12 | 1.5rem | 1360px |

**Key layout patterns from references:**
- Product hero (PDP): 7-col image / 5-col info
- Shop grid: 3-col (desktop) / 2-col (tablet) / 1-col (mobile)
- Editorial editorial layout: 8-col content / 4-col sidebar
- Mega menu: 4 × 3-col panels (Shop), 3 × 4-col panels (Skin Concerns)

---

## Elevation & Shadow

```css
/* Hairline borders — primary structural division */
border: 1px solid rgba(43, 31, 23, 0.10);    /* 10% espresso */
border: 1px solid rgba(43, 31, 23, 0.12);    /* 12% espresso */
border: 1px solid rgba(43, 31, 23, 0.15);    /* 15% espresso */

/* Ambient elevation — floating UI (modals, drawers, sticky bars) */
box-shadow: 0 12px 36px -4px rgba(43, 31, 23, 0.06),
            0 4px 12px -2px rgba(43, 31, 23, 0.03);

/* Product card shadow */
box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);

/* Mega menu / overlay shadow */
box-shadow: 0 20px 60px rgba(43, 31, 23, 0.12);
```

---

## Component Specifications

### Buttons

| Type | Background | Text | Border | Height | Radius | Hover |
|------|-----------|------|--------|--------|--------|-------|
| **Primary** (Add to Bag, Checkout) | `#2B1F17` Espresso | `#fcf9f3` Ivory | none | 48px | 4px | `#3F2E23` umber |
| **Secondary** (Discover, View) | transparent | `#2B1F17` | 1px `#2B1F17` 20%→100% | 48px | 4px | border opacity 100% |
| **Tertiary / Botanical** (Quick Refill) | transparent | `#6B7F6E` Sage | none | auto | — | animated underline |

**Button text:** `font-label-lg`, `uppercase`, `tracking-widest`

### Chips & Badges

| Type | Background | Text | Shape |
|------|-----------|------|-------|
| Clinical badge | `#6B7F6E` at 10% tint | `#6B7F6E` | Rounded capsule |
| Promo / seasonal | `#ffdcc6` Blush | `#2B1F17` | Rounded pill |
| Bestseller tag | `#132518` tertiary-container | `#d2e8d4` | Pill top-left of card |
| Step indicator | `surface-container-low` | `secondary` | Rounded |

### Product Cards

```
┌─────────────────────────────┐
│  [Bestseller // Step 02]    │  ← label-sm badge, top-left
│                             │
│      [Product Image]        │  ← aspect-square, object-contain
│      macro studio shot      │
│                             │
├─────────────────────────────┤  ← 1px outline-variant border
│  TARGETED SERUM · 30ML      │  ← label-sm, uppercase, secondary
│  Ceramide + Bio-Peptide     │  ← headline-sm, Playfair Display
│  Barrier Serum              │
│                             │
│  $68.00          [♡] [+]    │  ← body-md price | icon buttons
└─────────────────────────────┘
```

- Border: `1px solid #D9B8A4` (outline-variant)
- Background: `#ffffff` (surface-container-lowest)
- Hover: subtle scale `1.01`, border darkens
- Radius: `rounded-lg` (8px)

### Input Fields

```css
/* Default */
border: 1px solid rgba(43, 31, 23, 0.20);
background: #ffffff or transparent;
border-radius: 4px;
padding: 12px 16px;
font-family: Inter;

/* Focus */
border: 1px solid #2B1F17;
outline: none;  /* no fuzzy glow */
```

### Accordions (Formulation Dossier)

- Full-width rows
- Divider: `1px solid rgba(43, 31, 23, 0.12)`
- Header: `Playfair Display`, `headline-sm`
- Toggle icon: `+` / `−` in Inter
- Expand animation: smooth height transition
- Contents: ingredient percentages, clinical stats, application steps

### Navigation

**Announcement Bar:**
- Background: `secondary-container` at 60% tint
- Text: `label-sm`, uppercase, tracking-widest, `primary`
- Height: 36px

**Main Nav:**
- Background: `surface/95` with `backdrop-blur-xl`
- Height: 80px (desktop)
- Max-width: 1360px, centered
- Border-bottom: `1px solid rgba(43,31,23,0.10)`
- Logo: `h-8` (32px height)
- Nav links: `label-md`, uppercase, `tracking-wider`, `on-surface-variant` → `primary` on hover/active
- Icons: Search, Account, Bag (with count badge)

**Mega Menu:**
- Position: absolute, `top-full`, centered on trigger
- Width: 980px (Shop), 880px (Skin Concerns)
- Background: `#FCF9F3`
- Border: `1px solid rgba(43,31,23,0.10)`
- Shadow: `shadow-2xl`
- Radius: `rounded-sm`
- Animation: opacity + translate-y, 300ms

### Cart Drawer (Slide-in)

- Position: fixed right, full height
- Width: 420px (desktop), 100% (mobile)
- Background: `surface`
- Shadow: `0 0 60px rgba(43,31,23,0.12)`
- Animation: slide from right, 350ms ease-out
- Has: item list, subtotal, checkout CTA, close button

---

## Interaction Patterns

| Interaction | Behavior |
|-------------|----------|
| Scroll reveal | `opacity: 0 → 1`, `translateY(28px → 0)`, 0.85s `cubic-bezier(0.16, 1, 0.3, 1)` |
| Stagger delay | 0ms, 100ms, 150ms, 200ms, 300ms, 360ms |
| Button hover | Background tint shift, 200ms ease |
| Card hover | `scale(1.01)`, border color shift, 300ms |
| Mega menu open | opacity + translateY, 300ms |
| Cart drawer open | translateX slide, 350ms ease-out |
| Accordion expand | height auto transition, 400ms |
| Image zoom | Loupe cursor, `scale(1.5)` on hover |
| Form focus | Border colour shifts to full espresso, no glow |
| Reduced motion | All animations disabled via `prefers-reduced-motion` |

---

## Tailwind Configuration (Full)

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'playfair': ['Playfair Display', 'serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      // ... full color map (see above)
      // ... full fontSize scale (see above)
      // ... full spacing scale (see above)
      // ... full borderRadius scale (see above)
      maxWidth: {
        'canvas': '1360px',
      },
      boxShadow: {
        'ambient': '0 12px 36px -4px rgba(43, 31, 23, 0.06), 0 4px 12px -2px rgba(43, 31, 23, 0.03)',
        'nav': '0 1px 8px rgba(0, 0, 0, 0.04)',
        'mega': '0 20px 60px rgba(43, 31, 23, 0.12)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
```
