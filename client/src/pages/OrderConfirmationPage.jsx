import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPrice } from '../data/formulations'
import useShop from '../context/useShop'
import { getCartLines } from '../utils/cart'

export default function OrderConfirmationPage() {
  const { id } = useParams()
  const { lastDemoOrder, clearCart } = useShop()
  const order = lastDemoOrder?.id === id ? lastDemoOrder : null
  const lines = order ? getCartLines(order.items) : []

  useEffect(() => {
    if (order) clearCart()
  }, [order, clearCart])

  if (!order) {
    return (
      <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl text-center md:px-gutter">
        <p className="font-label-md text-label-md uppercase text-secondary">Demo confirmation unavailable</p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">This session has no demo record</h1>
        <p className="mx-auto mt-md max-w-xl font-body-md text-on-surface-variant">
          Confirmation details are held only in memory and are not saved or sent anywhere.
        </p>
        <Link to="/shop" className="mt-lg inline-flex rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase text-white">
          Browse development samples
        </Link>
      </section>
    )
  }

  const { shippingAddress: address, contact } = order

  return (
    <section className="mx-auto max-w-canvas px-gutter-mobile py-xl md:px-gutter md:py-2xl">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-xl border border-primary/10 bg-white p-lg shadow-card md:p-xl">
          <p className="font-label-md text-label-md uppercase text-secondary">Demo submission complete</p>
          <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Your demo review is confirmed</h1>
          <p className="mt-md font-body-md text-on-surface-variant">
            Reference <span className="font-medium text-primary">{order.id}</span>
          </p>
          <p role="status" className="mt-lg rounded-lg border border-secondary/20 bg-secondary-container/25 p-md font-body-sm text-on-surface-variant">
            This is a local demonstration only. No real order was created, no payment was taken, and no shipment was arranged.
          </p>

          <div className="mt-xl grid gap-lg md:grid-cols-2">
            <section aria-labelledby="confirmation-contact-heading">
              <h2 id="confirmation-contact-heading" className="font-headline text-headline-sm">Contact</h2>
              <p className="mt-sm break-words font-body-sm text-on-surface-variant">{contact.email}</p>
              <p className="mt-xs font-body-sm text-on-surface-variant">{contact.phone}</p>
            </section>
            <section aria-labelledby="confirmation-address-heading">
              <h2 id="confirmation-address-heading" className="font-headline text-headline-sm">Shipping address</h2>
              <address className="mt-sm not-italic font-body-sm leading-relaxed text-on-surface-variant">
                {address.firstName} {address.lastName}<br />
                {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                {address.city}, {address.region} {address.postalCode}<br />
                {address.country}
              </address>
            </section>
          </div>

          <section className="mt-xl border-t border-primary/10 pt-lg" aria-labelledby="confirmation-items-heading">
            <h2 id="confirmation-items-heading" className="font-headline text-headline-sm">Reviewed samples</h2>
            <ul className="mt-sm divide-y divide-primary/10">
              {lines.map(({ item, product, variant }) => (
                <li key={`${item.productId}-${item.variantId}`} className="flex justify-between gap-md py-md font-body-sm">
                  <span className="text-on-surface-variant">{product.name} · {variant.label} × {item.quantity}</span>
                  <span className="shrink-0 text-primary">{formatPrice(variant.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-sm border-t border-primary/10 pt-md font-body-sm">
              <div className="flex justify-between gap-md">
                <dt className="text-on-surface-variant">Subtotal</dt>
                <dd className="font-medium text-primary">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-md">
                <dt className="text-on-surface-variant">Shipping</dt>
                <dd className="text-secondary">Not configured</dd>
              </div>
              <div className="flex justify-between gap-md border-t border-primary/10 pt-md">
                <dt className="font-medium text-primary">Total</dt>
                <dd className="font-medium text-primary">Unavailable</dd>
              </div>
            </dl>
          </section>
          <p className="mt-lg font-body-sm text-on-surface-variant">
            Submitted {new Date(order.submittedAt).toLocaleString()}
          </p>
        </section>

        <div className="mt-lg flex flex-wrap gap-md">
          <Link to="/shop" className="inline-flex rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase text-white">
            Continue browsing
          </Link>
          <Link to="/cart" className="inline-flex rounded-md border border-primary/20 px-lg py-md font-label-sm text-[10px] uppercase text-primary">
            View empty cart
          </Link>
        </div>
      </div>
    </section>
  )
}
