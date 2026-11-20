import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { listAdminCustomers } from '../../services/adminCustomers'

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    customers: [],
    pagination: null,
    error: null,
  })
  const key = `${debouncedSearch}|${page}|${attempt}`
  const loading = result.key !== key

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const params = { page, limit: 20 }
    if (debouncedSearch) params.search = debouncedSearch

    const requestTimer = setTimeout(() => {
      listAdminCustomers(params, controller.signal)
        .then((response) => {
          if (!active) return
          if (!Array.isArray(response.data)) {
            throw new Error('The customer service returned an invalid list response.')
          }
          setResult({
            key,
            customers: response.data,
            pagination: response.pagination,
            error: null,
          })
        })
        .catch((error) => {
          if (!active) return
          const requestError = error?.code === 'ERR_CANCELED'
            ? new Error('The customer request was cancelled. Please retry.')
            : error
          setResult({ key, customers: [], pagination: null, error: requestError })
        })
    }, 0)

    return () => {
      active = false
      clearTimeout(requestTimer)
      controller.abort()
    }
  }, [debouncedSearch, key, page])

  const customers = loading ? [] : result.customers
  const error = loading ? null : result.error
  const pagination = loading ? null : result.pagination

  return (
    <section aria-labelledby="admin-customers-heading">
      <div>
        <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Customer management</p>
        <h1 id="admin-customers-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Customers</h1>
        <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
          Read-only customer profiles and order records. Authentication credentials and secrets are never displayed.
        </p>
      </div>

      <div className="mt-xl rounded-lg border border-primary/10 bg-white p-md md:p-lg">
        <label className="relative block max-w-2xl">
          <span className="sr-only">Search customers</span>
          <Search size={16} className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search customer name or email"
            className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low pl-2xl pr-md font-body-sm focus:border-secondary focus:outline-none"
          />
        </label>
      </div>

      {loading && (
        <p className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">
          Loading customers…
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

      {!loading && !error && customers.length === 0 && (
        <div className="mt-lg rounded-lg border border-dashed border-primary/20 bg-white p-xl text-center">
          <h2 className="font-headline text-headline-sm">{debouncedSearch ? 'No matching customers' : 'No customers yet'}</h2>
          <p className="mt-sm font-body-sm text-on-surface-variant">
            {debouncedSearch
              ? 'No customer records match this name or email search.'
              : 'Registered customer accounts will appear here.'}
          </p>
        </div>
      )}

      {!loading && !error && customers.length > 0 && (
        <>
          <div className="mt-lg hidden overflow-hidden rounded-lg border border-primary/10 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-surface-container-low">
                  <tr className="font-label-sm text-[8px] uppercase tracking-wider text-secondary">
                    <th className="px-lg py-md font-medium">Customer</th>
                    <th className="px-lg py-md font-medium">Email</th>
                    <th className="px-lg py-md font-medium">Registered</th>
                    <th className="px-lg py-md font-medium">Orders</th>
                    <th className="px-lg py-md text-right font-medium">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="font-body-sm">
                      <td className="px-lg py-md font-medium text-primary">{customer.name || 'Name unavailable'}</td>
                      <td className="px-lg py-md break-all text-on-surface-variant">{customer.email || 'Email unavailable'}</td>
                      <td className="px-lg py-md text-on-surface-variant">{formatDate(customer.registeredAt)}</td>
                      <td className="px-lg py-md text-on-surface-variant">{customer.orderCount}</td>
                      <td className="px-lg py-md text-right">
                        <Link to={`/admin/customers/${encodeURIComponent(customer.id)}`} className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
                          View profile
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-lg space-y-md md:hidden">
            {customers.map((customer) => (
              <article key={customer.id} className="rounded-lg border border-primary/10 bg-white p-md">
                <div className="flex flex-col gap-xs">
                  <h2 className="font-headline text-headline-sm text-primary">{customer.name || 'Name unavailable'}</h2>
                  <p className="break-all font-body-sm text-on-surface-variant">{customer.email || 'Email unavailable'}</p>
                </div>
                <dl className="mt-md grid grid-cols-2 gap-sm font-body-sm">
                  <div><dt className="text-on-surface-variant">Registered</dt><dd>{formatDate(customer.registeredAt)}</dd></div>
                  <div><dt className="text-on-surface-variant">Orders</dt><dd>{customer.orderCount}</dd></div>
                </dl>
                <Link
                  to={`/admin/customers/${encodeURIComponent(customer.id)}`}
                  className="mt-md inline-flex border-t border-primary/10 pt-sm font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
                >
                  View profile
                </Link>
              </article>
            ))}
          </div>

          {pagination?.pages > 1 && (
            <nav aria-label="Customer pages" className="mt-lg flex items-center justify-between gap-md">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
                className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40"
              >
                Previous
              </button>
              <p className="font-body-sm text-on-surface-variant">
                Page {pagination.page} of {pagination.pages} · {pagination.total} customers
              </p>
              <button
                type="button"
                disabled={page >= pagination.pages || loading}
                onClick={() => setPage((current) => current + 1)}
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
