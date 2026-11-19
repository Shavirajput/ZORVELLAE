// tailwind.config.js — ZORVELLAE Design System Tokens
// All values are sourced from DESIGN.md / DESIGN_SYSTEM.md

import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── Color Palette ───────────────────────────────────────────
      colors: {
        // Surfaces
        'surface':                   '#fcf9f3',
        'surface-dim':               '#dcdad4',
        'surface-bright':            '#fcf9f3',
        'surface-container-lowest':  '#ffffff',
        'surface-container-low':     '#f6f3ed',
        'surface-container':         '#f0eee8',
        'surface-container-high':    '#ebe8e2',
        'surface-container-highest': '#e5e2dc',
        'surface-variant':           '#e5e2dc',
        'background':                '#fcf9f3',

        // On-Surface text
        'on-surface':                '#1c1c18',
        'on-surface-variant':        '#4e4540',
        'inverse-surface':           '#31312d',
        'inverse-on-surface':        '#f3f0ea',

        // Primary — Espresso / Botanical Ink
        'primary':                   '#120904',
        'on-primary':                '#ffffff',
        'primary-container':         '#2b1f17',
        'on-primary-container':      '#98857a',
        'primary-fixed':             '#f5ded1',
        'primary-fixed-dim':         '#d8c2b6',
        'on-primary-fixed':          '#251911',
        'on-primary-fixed-variant':  '#53443a',
        'inverse-primary':           '#d8c2b6',

        // Secondary — Taupe / Rose Beige
        'secondary':                 '#735949',
        'on-secondary':              '#ffffff',
        'secondary-container':       '#ffdcc6',
        'on-secondary-container':    '#795f4e',
        'secondary-fixed':           '#ffdcc6',
        'secondary-fixed-dim':       '#e1c0ac',
        'on-secondary-fixed':        '#29170b',
        'on-secondary-fixed-variant':'#594232',

        // Tertiary — Sage Green
        'tertiary':                  '#000e04',
        'on-tertiary':               '#ffffff',
        'tertiary-container':        '#132518',
        'on-tertiary-container':     '#798e7c',
        'tertiary-fixed':            '#d2e8d4',
        'tertiary-fixed-dim':        '#b7ccb8',
        'on-tertiary-fixed':         '#0d1f13',
        'on-tertiary-fixed-variant': '#384b3c',

        // Outlines / Borders
        'outline':                   '#80756f',
        'outline-variant':           '#d1c4bd',
        'surface-tint':              '#6b5b51',

        // Error
        'error':                     '#ba1a1a',
        'on-error':                  '#ffffff',
        'error-container':           '#ffdad6',
        'on-error-container':        '#93000a',

        // ─── Brand shorthand aliases (for readability in JSX) ───
        'espresso':  '#2b1f17',
        'ivory':     '#fcf9f3',
        'sage':      '#6b7f6e',
        'blush':     '#ffdcc6',
        'taupe':     '#735949',
        'ink':       '#120904',
        'charcoal':  '#4e4540',
        'peach':     '#ffdcc6',
      },

      // ─── Typography ──────────────────────────────────────────────
      fontFamily: {
        'playfair': ['"Playfair Display"', 'Georgia', 'serif'],
        'inter':    ['Inter', 'system-ui', 'sans-serif'],
        // Semantic aliases used in JSX
        'headline': ['"Playfair Display"', 'Georgia', 'serif'],
        'body':     ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'headline-xl':        ['56px', { lineHeight: '64px', letterSpacing: '-0.02em', fontWeight: '400' }],
        'headline-xl-mobile': ['36px', { lineHeight: '44px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'headline-lg':        ['40px', { lineHeight: '48px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'headline-lg-mobile': ['28px', { lineHeight: '36px', letterSpacing: '0em',     fontWeight: '400' }],
        'headline-md':        ['28px', { lineHeight: '36px', letterSpacing: '0em',     fontWeight: '500' }],
        'headline-sm':        ['22px', { lineHeight: '30px', letterSpacing: '0.01em',  fontWeight: '500' }],
        'body-lg':            ['18px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body-md':            ['15px', { lineHeight: '24px', letterSpacing: '0em',     fontWeight: '400' }],
        'body-sm':            ['13px', { lineHeight: '20px', letterSpacing: '0.01em',  fontWeight: '400' }],
        'label-lg':           ['14px', { lineHeight: '20px', letterSpacing: '0.08em',  fontWeight: '600' }],
        'label-md':           ['12px', { lineHeight: '16px', letterSpacing: '0.12em',  fontWeight: '600' }],
        'label-sm':           ['10px', { lineHeight: '14px', letterSpacing: '0.15em',  fontWeight: '600' }],
      },

      // ─── Spacing ─────────────────────────────────────────────────
      spacing: {
        xs:               '0.25rem',
        sm:               '0.5rem',
        md:               '1rem',
        lg:               '1.5rem',
        xl:               '2.5rem',
        '2xl':            '4rem',
        '3xl':            '6rem',
        'space-xs':       '0.25rem',  // 4px
        'space-sm':       '0.5rem',   // 8px
        'space-md':       '1rem',     // 16px
        'space-lg':       '1.5rem',   // 24px
        'space-xl':       '2.5rem',   // 40px
        'space-2xl':      '4rem',     // 64px
        'space-3xl':      '6rem',     // 96px
        'gutter':         '1.5rem',   // 24px - column gutter desktop
        'gutter-mobile':  '1rem',     // 16px - column gutter mobile
        'margin':         '2rem',     // 32px - outer canvas margin
        'margin-mobile':  '1rem',     // 16px - outer canvas margin mobile
      },

      // ─── Border Radius ───────────────────────────────────────────
      borderRadius: {
        'DEFAULT': '0.25rem',  // 4px - buttons, inputs, cards
        'sm':      '0.125rem', // 2px - chips, pill tags
        'md':      '0.375rem', // 6px
        'lg':      '0.5rem',   // 8px - product cards, modals
        'xl':      '0.75rem',  // 12px - large cards
        'full':    '9999px',   // circular badges, pill tags
      },

      // ─── Max Width ───────────────────────────────────────────────
      maxWidth: {
        'canvas': '1360px',
      },

      // ─── Box Shadow ──────────────────────────────────────────────
      boxShadow: {
        // Ultra-diffuse warm-tinted ambient elevation
        'ambient':  '0 12px 36px -4px rgba(43, 31, 23, 0.06), 0 4px 12px -2px rgba(43, 31, 23, 0.03)',
        // Nav / sticky header
        'nav':      '0 1px 8px rgba(0, 0, 0, 0.04)',
        // Mega menus and overlays
        'mega':     '0 20px 60px rgba(43, 31, 23, 0.12)',
        // Product card subtle lift
        'card':     '0 2px 12px rgba(43, 31, 23, 0.06)',
        // Cart drawer / modal
        'drawer':   '0 0 60px rgba(43, 31, 23, 0.10)',
      },

      // ─── Transitions ─────────────────────────────────────────────
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.16, 1, 0.3, 1)', // Scroll-reveal easing
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
        '850': '850ms',
      },
    },
  },
  plugins: [forms],
}
