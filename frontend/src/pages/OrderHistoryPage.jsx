import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../data/formulations'
import { getCustomerOrders } from '../services/orders'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function statusLabel(status) {
  return status.replaceAll('_', ' ')
}

export default function OrderHistoryPage() {
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState({
    page: null,
    attempt: null,
    orders: [],
    pagination: null,
    error: '',
  })
  const isLoading = state.page !== page || state.attempt !== attempt

  useEffect(() => {
    const controller = new AbortController()
    getCustomerOrders({ page, limit: 10 }, controller.signal)
      .then(({ data, pagination: resultPagination }) => {
        setState({
          page,
          attempt,
          orders: data,
          pagination: resultPagination,
          error: '',
        })
      })
      .catch((error) => {
        if (error?.code !== 'ERR_CANCELED') {
          setState({
            page,
            attempt,
            orders: [],
            pagination: null,
            error: error.message || 'Order history is temporarily unavailable.',
          })
        }
      })
    return () => controller.abort()
  }, [page, attempt])
  const orders = isLoading ? [] : state.orders
  const pagination = isLoading ? null : state.pagination

  return (
    <section aria-labelledby="order-history-heading">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Account records</p>
      <h2 id="order-history-heading" className="mt-xs font-headline text-headline-md">Order history</h2>
      <p className="mt-sm max-w-2xl font-body-sm text-on-surface-variant">
        Permanent order records appear here when explicitly submitted through the order service. Demo checkout references are not saved.
      </p>

      {isLoading && (
        <p className="mt-lg rounded-lg bg-surface-container-low p-lg font-body-sm" role="status">
          Loading your order history…
        </p>
      )}

      {!isLoading && state.error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <p role="alert" className="font-body-sm text-error">{state.error}</p>
          <button
            type="button"
            className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
            onClick={() => setAttempt((current) => current + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !state.error && orders.length === 0 && (
        <div className="mt-lg rounded-lg bg-surface-container-low p-lg md:p-xl">
          <h3 className="font-headline text-headline-sm">No permanent orders</h3>
          <p className="mt-sm max-w-2xl font-body-sm text-on-surface-variant">
            This account has no submitted order records. Temporary checkout confirmations are not saved to account history.
          </p>
          <Link to="/shop" className="mt-lg inline-flex rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase tracking-wider text-white">
            Browse development samples
          </Link>
        </div>
      )}

      {!isLoading && !state.error && orders.length > 0 && (
        <>
          <ul className="mt-lg space-y-md">
            {orders.map((order) => (
              <li key={order.id} className="rounded-lg border border-primary/10 bg-white p-lg">
                <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-start">
                  <div>
                    <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Order reference</p>
                    <h3 className="mt-xs font-headline text-headline-sm">{order.reference}</h3>
                    <p className="mt-xs font-body-sm text-on-surface-variant">
                      Placed {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  <div className="sm:text-right">
                    <p className="font-body-md text-primary">{formatPrice(order.subtotal, order.currency)}</p>
                    <p className="mt-xs font-label-sm text-[9px] uppercase tracking-wider text-secondary">
                      {statusLabel(order.status)}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/account/orders/${encodeURIComponent(order.id)}`}
                  className="mt-md inline-flex font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
                >
                  View order details
                </Link>
              </li>
            ))}
          </ul>

          {pagination?.pages > 1 && (
            <nav aria-label="Order history pages" className="mt-lg flex items-center justify-between gap-md">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-md border border-primary/20 px-md py-sm font-label-sm text-[9px] uppercase tracking-wider disabled:opacity-40"
              >
                Previous
              </button>
              <p className="font-body-sm text-on-surface-variant">
                Page {pagination.page} of {pagination.pages}
              </p>
              <button
                type="button"
                disabled={page >= pagination.pages || isLoading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-md border border-primary/20 px-md py-sm font-label-sm text-[9px] uppercase tracking-wider disabled:opacity-40"
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
