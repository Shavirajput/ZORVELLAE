import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatPrice } from '../data/formulations'
import { getCustomerOrder } from '../services/orders'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

function statusLabel(status) {
  return status.replaceAll('_', ' ')
}

export default function OrderDetailsPage() {
  const { orderId } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    orderId: null,
    attempt: null,
    order: null,
    error: '',
  })
  const isDemoReference = orderId.startsWith('DEMO-')
  const isLoading = !isDemoReference &&
    (state.orderId !== orderId || state.attempt !== attempt)

  useEffect(() => {
    if (isDemoReference) return undefined

    const controller = new AbortController()
    getCustomerOrder(orderId, controller.signal)
      .then(({ data }) => {
        setState({ orderId, attempt, order: data, error: '' })
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          setState({
            orderId,
            attempt,
            order: null,
            error: error.message || 'Order details are temporarily unavailable.',
          })
        }
      })
    return () => controller.abort()
  }, [orderId, attempt, isDemoReference])
  const order = isDemoReference || isLoading ? null : state.order
  const error = isDemoReference || isLoading ? '' : state.error

  return (
    <section aria-labelledby="order-details-heading">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Account records</p>
      <h2 id="order-details-heading" className="mt-xs font-headline text-headline-md">
        {order ? `Order ${order.reference}` : 'Order details'}
      </h2>

      {isLoading && (
        <p className="mt-lg rounded-lg bg-surface-container-low p-lg font-body-sm" role="status">
          Loading order details…
        </p>
      )}

      {!isLoading && (isDemoReference || error) && (
        <div className="mt-lg rounded-lg bg-surface-container-low p-lg md:p-xl">
          <h3 className="font-headline text-headline-sm">
            {isDemoReference ? 'Temporary demo reference' : 'Order details unavailable'}
          </h3>
          <p className="mt-sm font-body-sm text-on-surface-variant" role={error ? 'alert' : undefined}>
            {isDemoReference
              ? 'Demo checkout references are temporary and do not become account orders.'
              : error}
          </p>
          {error && (
            <button
              type="button"
              className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
              onClick={() => setAttempt((current) => current + 1)}
            >
              Try again
            </button>
          )}
        </div>
      )}

      {!isLoading && order && (
        <div className="mt-lg space-y-lg">
          <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="order-summary-heading">
            <div className="flex flex-col justify-between gap-sm sm:flex-row">
              <div>
                <h3 id="order-summary-heading" className="font-headline text-headline-sm">{order.reference}</h3>
                <p className="mt-xs font-body-sm text-on-surface-variant">
                  Submitted {formatDate(order.createdAt)}
                </p>
              </div>
              <p className="h-fit rounded-full bg-surface-container-low px-md py-xs font-label-sm text-[9px] uppercase tracking-wider text-secondary">
                {statusLabel(order.status)}
              </p>
            </div>
            <ol className="mt-lg space-y-sm border-t border-primary/10 pt-md">
              {order.statusHistory.map((entry) => (
                <li key={`${entry.status}-${entry.changedAt}`} className="flex flex-wrap justify-between gap-sm font-body-sm">
                  <span className="capitalize text-primary">{statusLabel(entry.status)}</span>
                  <time className="text-on-surface-variant" dateTime={entry.changedAt}>
                    {formatDate(entry.changedAt)}
                  </time>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="items-heading">
            <h3 id="items-heading" className="font-headline text-headline-sm">Order items</h3>
            <ul className="mt-md divide-y divide-primary/10">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.variantId}`} className="flex justify-between gap-md py-md">
                  <div className="min-w-0">
                    <p className="font-body-md text-primary">{item.productName}</p>
                    <p className="mt-xs font-body-sm text-on-surface-variant">
                      {item.variantLabel} · Quantity {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-body-md text-primary">
                    {formatPrice(item.lineTotal, order.currency)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-sm flex justify-between gap-md border-t border-primary/10 pt-md font-label-sm text-[10px] uppercase tracking-wider">
              <span>Merchandise subtotal</span>
              <span>{formatPrice(order.subtotal, order.currency)}</span>
            </div>
            <p className="mt-md font-body-sm text-on-surface-variant">
              Shipping and tax have not been calculated. Payment processing is disabled.
            </p>
          </section>

          <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="shipping-address-heading">
            <h3 id="shipping-address-heading" className="font-headline text-headline-sm">Shipping address snapshot</h3>
            <address className="mt-md not-italic font-body-sm leading-relaxed text-on-surface-variant">
              <span className="block text-primary">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</span>
              <span className="block">{order.shippingAddress.addressLine1}</span>
              {order.shippingAddress.addressLine2 && <span className="block">{order.shippingAddress.addressLine2}</span>}
              <span className="block">
                {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
              </span>
              <span className="block">{order.shippingAddress.country}</span>
              <span className="mt-sm block">{order.contactEmail}</span>
            </address>
          </section>
        </div>
      )}

      <Link to="/account/orders" className="mt-lg inline-flex font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
        Return to order history
      </Link>
    </section>
  )
}
