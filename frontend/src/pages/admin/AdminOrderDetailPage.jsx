import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAdminOrder, updateAdminOrderStatus } from '../../services/adminOrders'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

function formatPrice(amount, currency) {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || !currency) {
    return 'Unavailable'
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount)
  } catch {
    return 'Unavailable'
  }
}

function statusLabel(status) {
  return status.replaceAll('_', ' ')
}

function StatusBadge({ status }) {
  const styles = {
    placed: 'bg-surface-container-high text-on-surface-variant',
    processing: 'bg-secondary-container/40 text-secondary',
    shipped: 'bg-blue-50 text-blue-800',
    delivered: 'bg-green-50 text-green-800',
    cancelled: 'bg-error/10 text-error',
  }
  return (
    <span className={`inline-flex rounded-full px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider ${styles[status] || styles.placed}`}>
      {statusLabel(status)}
    </span>
  )
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    order: null,
    error: null,
  })
  const [nextStatus, setNextStatus] = useState('')
  const [updating, setUpdating] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [notice, setNotice] = useState('')
  const key = `${orderId}|${attempt}`
  const loading = result.key !== key
  const order = loading ? null : result.order
  const error = loading ? null : result.error

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const requestTimer = setTimeout(() => {
      getAdminOrder(orderId, controller.signal)
        .then((response) => {
          if (!active) return
          if (!response.data || !Array.isArray(response.data.items) ||
              !Array.isArray(response.data.statusHistory)) {
            throw new Error('The order service returned an invalid detail response.')
          }
          setResult({ key, order: response.data, error: null })
        })
        .catch((requestError) => {
          if (!active) return
          const visibleError = requestError?.code === 'ERR_CANCELED'
            ? new Error('The order request was cancelled. Please retry.')
            : requestError
          setResult({ key, order: null, error: visibleError })
        })
    }, 0)

    return () => {
      active = false
      clearTimeout(requestTimer)
      controller.abort()
    }
  }, [key, orderId])

  const handleStatusUpdate = async () => {
    if (!order || !nextStatus) return
    const label = statusLabel(nextStatus)
    if (!window.confirm(`Change order ${order.reference} to ${label}?`)) return

    setUpdating(true)
    setStatusError('')
    setNotice('')
    try {
      const response = await updateAdminOrderStatus(order.id, nextStatus)
      if (!response.data || !Array.isArray(response.data.statusHistory)) {
        throw new Error('The order service returned an invalid status update response.')
      }
      setResult({ key, order: response.data, error: null })
      setNextStatus('')
      setNotice(`Order status updated to ${label}.`)
    } catch (requestError) {
      setStatusError(requestError.message || 'Unable to update the order status.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <section aria-labelledby="admin-order-detail-heading">
      <Link to="/admin/orders" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
        Back to orders
      </Link>

      {loading && (
        <p className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">
          Loading order…
        </p>
      )}

      {!loading && error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <h1 id="admin-order-detail-heading" className="font-headline text-headline-sm">Order details unavailable</h1>
          <p role="alert" className="mt-sm font-body-sm text-error">{error.message}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && order && (
        <>
          <div className="mt-lg flex flex-col justify-between gap-md sm:flex-row sm:items-start">
            <div>
              <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Order record</p>
              <h1 id="admin-order-detail-heading" className="mt-xs break-all text-headline-lg-mobile md:text-headline-lg">
                {order.reference}
              </h1>
              <p className="mt-sm font-body-sm text-on-surface-variant">Submitted {formatDate(order.createdAt)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {notice && (
            <p role="status" className="mt-lg rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm text-on-surface">
              {notice}
            </p>
          )}
          {statusError && (
            <p role="alert" className="mt-lg rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">
              {statusError}
            </p>
          )}

          <div className="mt-lg grid items-start gap-lg xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
            <div className="space-y-lg">
              <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="admin-order-items-heading">
                <div className="flex flex-wrap items-end justify-between gap-sm">
                  <div>
                    <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Immutable order snapshot</p>
                    <h2 id="admin-order-items-heading" className="mt-xs font-headline text-headline-sm">Items</h2>
                  </div>
                  <span className="font-body-sm text-on-surface-variant">
                    {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <ul className="mt-md divide-y divide-primary/10">
                  {order.items.map((item, index) => (
                    <li key={`${item.productId}-${item.variantId}-${index}`} className="flex flex-col justify-between gap-sm py-md sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <p className="font-body-md text-primary">{item.productName}</p>
                        <p className="mt-xs font-body-sm text-on-surface-variant">
                          {item.variantLabel} · Quantity {item.quantity}
                        </p>
                        <p className="mt-xs font-body-sm text-on-surface-variant">
                          {formatPrice(item.unitPrice, order.currency)} each
                        </p>
                      </div>
                      <p className="shrink-0 font-body-md text-primary">{formatPrice(item.lineTotal, order.currency)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-sm flex justify-between gap-md border-t border-primary/10 pt-md font-label-sm text-[10px] uppercase tracking-wider">
                  <span>Merchandise subtotal</span>
                  <span>{formatPrice(order.subtotal, order.currency)}</span>
                </div>
                <p className="mt-md font-body-sm text-on-surface-variant">
                  Shipping and tax have not been calculated. The displayed amount is not a payment total.
                </p>
              </section>

              <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="admin-order-history-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Auditable changes</p>
                <h2 id="admin-order-history-heading" className="mt-xs font-headline text-headline-sm">Status history</h2>
                <ol className="mt-lg space-y-md border-l border-primary/10 pl-md">
                  {order.statusHistory.map((entry, index) => (
                    <li key={`${entry.status}-${entry.changedAt}-${index}`} className="relative">
                      <span className="absolute -left-[calc(theme(spacing.md)+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-secondary" aria-hidden="true" />
                      <p className="font-body-md capitalize text-primary">{statusLabel(entry.status)}</p>
                      <time className="mt-xs block font-body-sm text-on-surface-variant" dateTime={entry.changedAt}>
                        {formatDate(entry.changedAt)}
                      </time>
                      <p className="mt-xs font-body-sm text-on-surface-variant">
                        {entry.changedBy
                          ? `Updated by ${entry.changedBy.name || 'admin'} (admin reference ${entry.changedBy.id})`
                          : 'Recorded when the order was submitted'}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <aside className="space-y-lg">
              <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="admin-order-customer-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Customer snapshot</p>
                <h2 id="admin-order-customer-heading" className="mt-xs font-headline text-headline-sm">
                  {order.customer?.name || 'Name unavailable'}
                </h2>
                <p className="mt-sm break-all font-body-sm text-on-surface-variant">
                  {order.customer?.email || 'Email unavailable'}
                </p>
                <div className="mt-lg border-t border-primary/10 pt-md">
                  <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Shipping address snapshot</p>
                  <address className="mt-sm not-italic font-body-sm leading-relaxed text-on-surface-variant">
                    <span className="block text-primary">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</span>
                    <span className="block">{order.shippingAddress.addressLine1}</span>
                    {order.shippingAddress.addressLine2 && <span className="block">{order.shippingAddress.addressLine2}</span>}
                    <span className="block">
                      {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
                    </span>
                    <span className="block">{order.shippingAddress.country}</span>
                  </address>
                </div>
              </section>

              <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="admin-order-payment-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Payment status</p>
                <h2 id="admin-order-payment-heading" className="mt-xs font-headline text-headline-sm">Not processed</h2>
                <p className="mt-sm font-body-sm text-on-surface-variant">
                  Payment processing is not configured. No payment state or collection is recorded.
                </p>
              </section>

              <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="admin-order-status-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Order workflow</p>
                <h2 id="admin-order-status-heading" className="mt-xs font-headline text-headline-sm">Update status</h2>
                {order.allowedTransitions.length > 0 ? (
                  <>
                    <label className="mt-md block">
                      <span className="sr-only">New order status</span>
                      <select
                        value={nextStatus}
                        onChange={(event) => setNextStatus(event.target.value)}
                        disabled={updating}
                        className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Choose next status</option>
                        {order.allowedTransitions.map((status) => (
                          <option key={status} value={status}>{statusLabel(status)}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      disabled={!nextStatus || updating}
                      onClick={handleStatusUpdate}
                      className="mt-md min-h-11 w-full rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updating ? 'Updating…' : 'Confirm status change'}
                    </button>
                    <p className="mt-sm font-body-sm text-on-surface-variant">
                      Status changes are recorded with the acting admin and timestamp.
                    </p>
                  </>
                ) : (
                  <p className="mt-md rounded-md bg-surface-container-low p-md font-body-sm text-on-surface-variant">
                    This order is in a final status and cannot be changed.
                  </p>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
