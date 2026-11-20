import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAdminCustomer } from '../../services/adminCustomers'

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

export default function AdminCustomerDetailPage() {
  const { customerId } = useParams()
  const [ordersPage, setOrdersPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    data: null,
    error: null,
  })
  const key = `${customerId}|${ordersPage}|${attempt}`
  const loading = result.key !== key
  const data = loading ? null : result.data
  const error = loading ? null : result.error

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const requestTimer = setTimeout(() => {
      getAdminCustomer(
        customerId,
        { ordersPage, ordersLimit: 10 },
        controller.signal,
      )
        .then((response) => {
          if (!active) return
          const customerData = response.data
          if (
            !customerData?.customer ||
            !Array.isArray(customerData.addresses) ||
            !Array.isArray(customerData.orders) ||
            !customerData.orderHistoryPagination
          ) {
            throw new Error('The customer service returned an invalid detail response.')
          }
          setResult({ key, data: customerData, error: null })
        })
        .catch((requestError) => {
          if (!active) return
          const visibleError = requestError?.code === 'ERR_CANCELED'
            ? new Error('The customer request was cancelled. Please retry.')
            : requestError
          setResult({ key, data: null, error: visibleError })
        })
    }, 0)

    return () => {
      active = false
      clearTimeout(requestTimer)
      controller.abort()
    }
  }, [customerId, key, ordersPage])

  return (
    <section aria-labelledby="admin-customer-detail-heading">
      <Link to="/admin/customers" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
        Back to customers
      </Link>

      {loading && (
        <p className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">
          Loading customer…
        </p>
      )}

      {!loading && error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <h1 id="admin-customer-detail-heading" className="font-headline text-headline-sm">Customer profile unavailable</h1>
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

      {!loading && !error && data && (
        <>
          <div className="mt-lg">
            <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Read-only customer profile</p>
            <h1 id="admin-customer-detail-heading" className="mt-xs break-words text-headline-lg-mobile md:text-headline-lg">
              {data.customer.name || 'Name unavailable'}
            </h1>
            <p className="mt-sm break-all font-body-md text-on-surface-variant">{data.customer.email || 'Email unavailable'}</p>
          </div>

          <div className="mt-lg grid gap-md sm:grid-cols-2">
            <article className="rounded-lg border border-primary/10 bg-white p-lg">
              <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Registered</p>
              <p className="mt-sm font-body-md text-primary">{formatDate(data.customer.registeredAt)}</p>
            </article>
            <article className="rounded-lg border border-primary/10 bg-white p-lg">
              <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Order count</p>
              <p className="mt-sm font-headline text-headline-sm text-primary">{data.customer.orderCount}</p>
            </article>
          </div>

          <section className="mt-lg rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="admin-customer-addresses-heading">
            <div className="flex flex-wrap items-end justify-between gap-sm">
              <div>
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Saved customer data</p>
                <h2 id="admin-customer-addresses-heading" className="mt-xs font-headline text-headline-sm">Saved addresses</h2>
              </div>
              <span className="font-body-sm text-on-surface-variant">{data.addresses.length} {data.addresses.length === 1 ? 'address' : 'addresses'}</span>
            </div>
            {data.addresses.length === 0 ? (
              <p className="mt-lg rounded-md bg-surface-container-low p-md font-body-sm text-on-surface-variant">
                No saved addresses are associated with this customer.
              </p>
            ) : (
              <ul className="mt-md grid gap-md md:grid-cols-2">
                {data.addresses.map((address) => (
                  <li key={address.id} className="rounded-md border border-primary/10 bg-surface-container-low p-md">
                    <div className="flex flex-wrap items-center justify-between gap-sm">
                      <p className="font-body-md text-primary">{address.firstName} {address.lastName}</p>
                      {address.isDefault && (
                        <span className="rounded-full bg-secondary-container/40 px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider text-secondary">
                          Default
                        </span>
                      )}
                    </div>
                    <address className="mt-sm not-italic font-body-sm leading-relaxed text-on-surface-variant">
                      <span className="block">{address.addressLine1}</span>
                      {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
                      <span className="block">
                        {address.city}, {address.region} {address.postalCode}
                      </span>
                      <span className="block">{address.country}</span>
                    </address>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-lg rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="admin-customer-orders-heading">
            <div className="flex flex-wrap items-end justify-between gap-sm">
              <div>
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Existing order records</p>
                <h2 id="admin-customer-orders-heading" className="mt-xs font-headline text-headline-sm">Order history</h2>
              </div>
              <span className="font-body-sm text-on-surface-variant">
                {data.customer.orderCount} {data.customer.orderCount === 1 ? 'order' : 'orders'}
              </span>
            </div>
            {data.orders.length === 0 ? (
              <p className="mt-lg rounded-md bg-surface-container-low p-md font-body-sm text-on-surface-variant">
                No submitted orders are associated with this customer.
              </p>
            ) : (
              <ul className="mt-md divide-y divide-primary/10">
                {data.orders.map((order) => (
                  <li key={order.id} className="flex flex-col justify-between gap-md py-md sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <Link to={`/admin/orders/${encodeURIComponent(order.id)}`} className="break-all font-body-md font-medium text-primary underline">
                        {order.reference}
                      </Link>
                      <p className="mt-xs font-body-sm text-on-surface-variant">
                        {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-md sm:justify-end">
                      <span className="font-body-sm text-primary">{formatPrice(order.subtotal, order.currency)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {data.orderHistoryPagination.pages > 1 && (
              <nav aria-label="Customer order history pages" className="mt-lg flex items-center justify-between gap-md border-t border-primary/10 pt-md">
                <button
                  type="button"
                  disabled={ordersPage <= 1 || loading}
                  onClick={() => setOrdersPage((current) => current - 1)}
                  className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40"
                >
                  Previous
                </button>
                <p className="font-body-sm text-on-surface-variant">
                  Page {data.orderHistoryPagination.page} of {data.orderHistoryPagination.pages}
                </p>
                <button
                  type="button"
                  disabled={ordersPage >= data.orderHistoryPagination.pages || loading}
                  onClick={() => setOrdersPage((current) => current + 1)}
                  className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </section>
        </>
      )}
    </section>
  )
}
