import { useEffect, useState } from 'react'
import { fetchAdminDashboard } from '../../services/adminDashboard'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function formatPrice(amount, currency) {
  if (typeof amount !== 'number' || !currency) return 'Unavailable'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return 'Unavailable'
  }
}

function MetricCard({ label, value, note }) {
  return (
    <article className="rounded-lg border border-primary/10 bg-white p-lg shadow-card">
      <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">{label}</p>
      <p className="mt-md font-headline text-headline-md text-primary">{value}</p>
      {note && <p className="mt-xs font-body-sm text-on-surface-variant">{note}</p>}
    </article>
  )
}

export default function AdminDashboardPage() {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: '', data: null, error: null })
  const key = String(attempt)
  const loading = result.key !== key

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    fetchAdminDashboard(controller.signal)
      .then((data) => {
        if (active) setResult({ key, data, error: null })
      })
      .catch((error) => {
        if (active && error?.code !== 'ERR_CANCELED') {
          setResult({ key, data: null, error })
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [key])

  const data = loading ? null : result.data
  const error = loading ? null : result.error

  return (
    <section aria-labelledby="admin-dashboard-heading">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Store operations</p>
          <h1 id="admin-dashboard-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Dashboard overview</h1>
          <p className="mt-sm font-body-sm text-on-surface-variant">Metrics are loaded from application records. Unconfigured payment and inventory values remain unavailable.</p>
        </div>
        <p className="w-fit rounded-full border border-secondary/20 bg-secondary-container/30 px-md py-sm font-label-sm text-[8px] uppercase tracking-wider text-secondary">Admin foundation</p>
      </div>

      {loading && (
        <p className="mt-xl rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">
          Loading dashboard data…
        </p>
      )}

      {error && (
        <div className="mt-xl rounded-lg border border-error/30 bg-error/5 p-lg">
          <p role="alert" className="font-body-sm text-error">{error.message}</p>
          <button type="button" className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline" onClick={() => setAttempt((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}

      {data && (
        <>
          <div className="mt-xl grid gap-md sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Products" value={data.metrics.products} note="Catalog records" />
            <MetricCard label="Categories" value={data.metrics.categories} note="Catalog records" />
            <MetricCard label="Customers" value={data.metrics.customers} note="Customer accounts" />
            <MetricCard label="Orders" value={data.metrics.orders} note="Persisted order records" />
            <MetricCard label="Verified revenue" value="Unavailable" note={data.metrics.revenue.message} />
          </div>

          <div className="mt-xl grid items-start gap-lg xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <section className="min-w-0 rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="recent-orders-heading">
              <div className="flex flex-wrap items-end justify-between gap-sm">
                <div>
                  <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Latest records</p>
                  <h2 id="recent-orders-heading" className="mt-xs font-headline text-headline-sm">Recent orders</h2>
                </div>
                <span className="font-label-sm text-[8px] uppercase tracking-wider text-on-surface-variant">Up to 8</span>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="mt-lg rounded-md bg-surface-container-low p-md font-body-sm text-on-surface-variant">
                  No persisted order records are available.
                </p>
              ) : (
                <div className="mt-lg overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-primary/10 font-label-sm text-[8px] uppercase tracking-wider text-secondary">
                        <th className="pb-sm pr-md font-medium">Reference</th>
                        <th className="pb-sm pr-md font-medium">Date</th>
                        <th className="pb-sm pr-md font-medium">Items</th>
                        <th className="pb-sm pr-md font-medium">Status</th>
                        <th className="pb-sm text-right font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {data.recentOrders.map((order) => (
                        <tr key={order.id} className="font-body-sm">
                          <td className="py-md pr-md font-medium text-primary">{order.reference}</td>
                          <td className="py-md pr-md text-on-surface-variant">{formatDate(order.createdAt)}</td>
                          <td className="py-md pr-md text-on-surface-variant">{order.itemCount}</td>
                          <td className="py-md pr-md capitalize text-on-surface-variant">{order.status}</td>
                          <td className="py-md text-right text-primary">{formatPrice(order.subtotal, order.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-md border-t border-primary/10 pt-md font-body-sm text-on-surface-variant">
                Order records do not imply payment or shipment. Payment is not configured.
              </p>
            </section>

            <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="inventory-heading">
              <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Stock control</p>
              <h2 id="inventory-heading" className="mt-xs font-headline text-headline-sm">Inventory summary</h2>
              {data.inventory.status === 'not_configured' ? (
                <p className="mt-lg rounded-md border border-secondary/15 bg-surface-container-low p-md font-body-sm text-on-surface-variant">
                  {data.inventory.message}
                </p>
              ) : (
                <>
                  <p className="mt-lg font-body-sm text-on-surface-variant">
                    {data.inventory.trackedProducts} tracked products
                  </p>
                  {data.inventory.lowStockProducts.length === 0 ? (
                    <p className="mt-md rounded-md bg-surface-container-low p-md font-body-sm text-on-surface-variant">
                      No low-stock products.
                    </p>
                  ) : (
                    <ul className="mt-md space-y-sm">
                      {data.inventory.lowStockProducts.map((product) => (
                        <li key={product.id} className="flex justify-between gap-md rounded-md bg-surface-container-low p-md font-body-sm">
                          <span>{product.name}</span><span>{product.quantity} left</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  )
}
