import { formulations, getVariant } from '../data/formulations'

export function getCartLines(cart) {
  return cart
    .map((item) => {
      const product = formulations.find((entry) => entry.id === item.productId)
      if (!product) return null
      return { item, product, variant: getVariant(product, item.variantId) }
    })
    .filter(Boolean)
}

export function getCartSubtotal(lines) {
  return lines.reduce(
    (total, { item, variant }) => total + variant.price * item.quantity,
    0,
  )
}

export function getDemoCheckoutTotals(lines) {
  return {
    subtotal: getCartSubtotal(lines),
    shipping: null,
    total: null,
  }
}
