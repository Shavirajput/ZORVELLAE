export const categories = [
  { slug: 'cleansers', name: 'Cleansers', description: 'Development sample category for cleansing formulations.' },
  { slug: 'serums', name: 'Serums & Actives', description: 'Development sample category for concentrated formulations.' },
  { slug: 'moisturisers', name: 'Barrier Hydrators', description: 'Development sample category for moisturising formulations.' },
  { slug: 'eye-care', name: 'Eye & Lip', description: 'Development sample category for targeted care.' },
]

export const formulations = [
  {
    id: 'demo-cleanser',
    slug: 'development-cleanser',
    name: 'Gentle Cream Cleanser',
    category: 'cleansers',
    categoryLabel: 'Cleanser',
    description: 'Development sample. Approved product description and formulation information are pending.',
    ingredients: 'Approved ingredient list pending.',
    usage: 'Approved usage instructions pending.',
    variants: [{ id: '150ml', label: '150 ml', price: 42 }],
    badge: 'Development sample',
    sortOrder: 1,
  },
  {
    id: 'demo-barrier-serum',
    slug: 'development-barrier-serum',
    name: 'Barrier Support Serum',
    category: 'serums',
    categoryLabel: 'Serum',
    description: 'Development sample. Approved product description and formulation information are pending.',
    ingredients: 'Approved ingredient list pending.',
    usage: 'Approved usage instructions pending.',
    variants: [
      { id: '30ml', label: '30 ml', price: 68 },
      { id: '50ml', label: '50 ml', price: 92 },
    ],
    badge: 'Development sample',
    sortOrder: 2,
  },
  {
    id: 'demo-hydration',
    slug: 'development-hydration-concentrate',
    name: 'Hydration Concentrate',
    category: 'serums',
    categoryLabel: 'Serum',
    description: 'Development sample. Approved product description and formulation information are pending.',
    ingredients: 'Approved ingredient list pending.',
    usage: 'Approved usage instructions pending.',
    variants: [{ id: '30ml', label: '30 ml', price: 54 }],
    badge: 'Development sample',
    sortOrder: 3,
  },
  {
    id: 'demo-moisturiser',
    slug: 'development-barrier-cream',
    name: 'Daily Barrier Cream',
    category: 'moisturisers',
    categoryLabel: 'Moisturiser',
    description: 'Development sample. Approved product description and formulation information are pending.',
    ingredients: 'Approved ingredient list pending.',
    usage: 'Approved usage instructions pending.',
    variants: [{ id: '50ml', label: '50 ml', price: 52 }],
    badge: 'Development sample',
    sortOrder: 4,
  },
  {
    id: 'demo-eye-care',
    slug: 'development-eye-contour',
    name: 'Eye Contour Cream',
    category: 'eye-care',
    categoryLabel: 'Eye care',
    description: 'Development sample. Approved product description and formulation information are pending.',
    ingredients: 'Approved ingredient list pending.',
    usage: 'Approved usage instructions pending.',
    variants: [{ id: '15ml', label: '15 ml', price: 38 }],
    badge: 'Development sample',
    sortOrder: 5,
  },
]

export const getDefaultVariant = (product) => product?.variants[0]

export const getVariant = (product, variantId) =>
  product?.variants.find((variant) => variant.id === variantId) || getDefaultVariant(product)

export const getStartingPrice = (product) =>
  Math.min(...product.variants.map((variant) => variant.price))

export const formatPrice = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
