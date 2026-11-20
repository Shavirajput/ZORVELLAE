import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { listAdminOrders } from '../../services/adminOrders'

const ORDER_STATUSES = [
  'placed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

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

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    from: '',
    to: '',
    page: 1,
  })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    orders: [],
    pagination: null,
    error: null,
  })
  const key = `${debouncedSearch}|${filters.status}|${filters.from}|${filters.to}|${filters.page}|${attempt}`
  const loading = result.key !== key

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 250)
    return () => clearTimeout(timer)
  }, [filters.search])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const params = {
      page: filters.page,
      limit: 20,
      status: filters.status,
    }
    if (debouncedSearch) params.search = debouncedSearch
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to

    const requestTimer = setTimeout(() => {
      listAdminOrders(params, controller.signal)
        .then((response) => {
          if (!active) return
          if (!Array.isArray(response.data)) {
            throw new Error('The order service returned an invalid list response.')
          }
          setResult({
            key,
            orders: response.data,
            pagination: response.pagination,
            error: null,
          })
        })
        .catch((error) => {
          if (!active) return
          const requestError = error?.code === 'ERR_CANCELED'
            ? new Error('The orders request was cancelled. Please retry.')
            : error
          setResult({ key, orders: [], pagination: null, error: requestError })
        })
    }, 0)

    return () => {
      active = false
      clearTimeout(requestTimer)
      controller.abort()
    }
  }, [
    debouncedSearch,
    filters.from,
    filters.page,
    filters.status,
    filters.to,
    key,
  ])

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }))
  }

  const orders = loading ? [] : result.orders
  const error = loading ? null : result.error
  const pagination = loading ? null : result.pagination
  const hasFilters = Boolean(
    filters.search || filters.status !== 'all' || filters.from || filters.to,
  )

  return (
    <section aria-labelledby="admin-orders-heading">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Order management</p>
          <h1 id="admin-orders-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Orders</h1>
          <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
            View submitted order records. Values show merchandise subtotal only; payment, shipping, and tax are not processed or calculated here.
          </p>
        </div>
      </div>

      <div className="mt-xl rounded-lg border border-primary/10 bg-white p-md md:p-lg">
        <div className="grid gap-md sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_170px_170px]">
          <label className="relative block">
            <span className="sr-only">Search orders</span>
            <Search size={16} className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Search reference, customer or email"
              className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low pl-2xl pr-md font-body-sm focus:border-secondary focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Filter orders by status</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
              className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none"
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>{statusLabel(status)}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Orders from date</span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter('from', event.target.value)}
              aria-label="Orders from date"
              className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Orders to date</span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter('to', event.target.value)}
              aria-label="Orders to date"
              className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none"
            />
          </label>
        </div>
      </div>

      {loading && (
        <p className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">
          Loading orders…
        </p>
      )}

      {error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <p role="alert" className="font-body-sm text-error">{error.message}</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-sm font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="mt-lg rounded-lg border border-dashed border-primary/20 bg-white p-xl text-center">
          <h2 className="font-headline text-headline-sm">{hasFilters ? 'No matching orders' : 'No orders yet'}</h2>
          <p className="mt-sm font-body-sm text-on-surface-variant">
            {hasFilters
              ? 'No submitted orders match the selected search and filters.'
              : 'Submitted order records will appear here. Demo checkout references are not permanent orders.'}
          </p>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <>
          <div className="mt-lg hidden overflow-hidden rounded-lg border border-primary/10 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead className="bg-surface-container-low">
                  <tr className="font-label-sm text-[8px] uppercase tracking-wider text-secondary">
                    <th className="px-lg py-md font-medium">Order</th>
                    <th className="px-lg py-md font-medium">Customer</th>
                    <th className="px-lg py-md font-medium">Date</th>
                    <th className="px-lg py-md font-medium">Subtotal</th>
                    <th className="px-lg py-md font-medium">Payment</th>
                    <th className="px-lg py-md font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {orders.map((order) => (
                    <tr key={order.id} className="font-body-sm">
                      <td className="px-lg py-md">
                        <Link to={`/admin/orders/${encodeURIComponent(order.id)}`} className="font-medium text-primary hover:underline">
                          {order.reference}
                        </Link>
                        <p className="mt-xs text-on-surface-variant">{order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</p>
                      </td>
                      <td className="px-lg py-md">
                        <p className="text-primary">{order.customer?.name || 'Name unavailable'}</p>
                        <p className="mt-xs break-all text-on-surface-variant">{order.customer?.email || 'Email unavailable'}</p>
                      </td>
                      <td className="px-lg py-md text-on-surface-variant">{formatDate(order.createdAt)}</td>
                      <td className="px-lg py-md text-primary">{formatPrice(order.subtotal, order.currency)}</td>
                      <td className="px-lg py-md text-on-surface-variant">Not processed</td>
                      <td className="px-lg py-md"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-lg space-y-md md:hidden">
            {orders.map((order) => (
              <article key={order.id} className="rounded-lg border border-primary/10 bg-white p-md">
                <div className="flex items-start justify-between gap-md">
                  <div className="min-w-0">
                    <Link to={`/admin/orders/${encodeURIComponent(order.id)}`} className="font-headline text-headline-sm text-primary">
                      {order.reference}
                    </Link>
                    <p className="mt-xs break-all font-body-sm text-on-surface-variant">{order.customer?.email || 'Email unavailable'}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
                <dl className="mt-md grid grid-cols-2 gap-sm font-body-sm">
                  <div><dt className="text-on-surface-variant">Customer</dt><dd>{order.customer?.name || 'Name unavailable'}</dd></div>
                  <div><dt className="text-on-surface-variant">Date</dt><dd>{formatDate(order.createdAt)}</dd></div>
                  <div><dt className="text-on-surface-variant">Subtotal</dt><dd>{formatPrice(order.subtotal, order.currency)}</dd></div>
                  <div><dt className="text-on-surface-variant">Payment</dt><dd>Not processed</dd></div>
                </dl>
                <Link
                  to={`/admin/orders/${encodeURIComponent(order.id)}`}
                  className="mt-md inline-flex border-t border-primary/10 pt-sm font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
                >
                  View order details
                </Link>
              </article>
            ))}
          </div>

          {pagination?.pages > 1 && (
            <nav aria-label="Order pages" className="mt-lg flex items-center justify-between gap-md">
              <button
                type="button"
                disabled={filters.page <= 1 || loading}
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40"
              >
                Previous
              </button>
              <p className="font-body-sm text-on-surface-variant">
                Page {pagination.page} of {pagination.pages} · {pagination.total} orders
              </p>
              <button
                type="button"
                disabled={filters.page >= pagination.pages || loading}
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
