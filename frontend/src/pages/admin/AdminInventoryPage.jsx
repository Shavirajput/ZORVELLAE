import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import {
  createAdminInventoryAdjustment,
  getAdminInventoryHistory,
  listAdminInventory,
} from '../../services/adminInventory'

const STOCK_FILTERS = [
  ['all', 'All stock levels'],
  ['in_stock', 'In stock'],
  ['low_stock', 'Low stock (1–5)'],
  ['out_of_stock', 'Out of stock'],
  ['untracked', 'Untracked'],
]

const STOCK_LABELS = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
  untracked: 'Untracked',
}

function formatDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

function StockBadge({ status }) {
  const styles = {
    in_stock: 'bg-green-50 text-green-800',
    low_stock: 'bg-amber-50 text-amber-900',
    out_of_stock: 'bg-error/10 text-error',
    untracked: 'bg-surface-container-high text-on-surface-variant',
  }
  return (
    <span className={`inline-flex rounded-full px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider ${styles[status] || styles.untracked}`}>
      {STOCK_LABELS[status] || 'Untracked'}
    </span>
  )
}

function History({ productId, variantId, refresh }) {
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    adjustments: [],
    pagination: null,
    error: null,
  })
  const key = `${productId}|${variantId}|${page}|${refresh}|${attempt}`
  const loading = result.key !== key

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getAdminInventoryHistory(productId, variantId, { page, limit: 10 }, controller.signal)
      .then((response) => {
        if (!active) return
        if (!Array.isArray(response.data)) {
          throw new Error('The inventory service returned an invalid history response.')
        }
        setResult({
          key,
          adjustments: response.data,
          pagination: response.pagination,
          error: null,
        })
      })
      .catch((error) => {
        if (!active) return
        if (error?.code === 'ERR_CANCELED') return
        setResult({ key, adjustments: [], pagination: null, error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [attempt, key, page, productId, variantId, refresh])

  const adjustments = loading ? [] : result.adjustments
  const error = loading ? null : result.error
  const pagination = loading ? null : result.pagination

  return (
    <section className="mt-md border-t border-primary/10 pt-md" aria-label="Stock adjustment history">
      <h3 className="font-headline text-headline-sm">Adjustment history</h3>
      {loading && <p className="mt-sm font-body-sm text-on-surface-variant" role="status">Loading adjustment history…</p>}
      {error && (
        <div className="mt-sm">
          <p role="alert" className="font-body-sm text-error">{error.message}</p>
          <button type="button" className="mt-xs font-label-sm text-[9px] uppercase text-secondary underline" onClick={() => setAttempt((value) => value + 1)}>
            Retry history
          </button>
        </div>
      )}
      {!loading && !error && adjustments.length === 0 && (
        <p className="mt-sm font-body-sm text-on-surface-variant">No stock adjustments have been recorded for this variant.</p>
      )}
      {!loading && !error && adjustments.length > 0 && (
        <>
          <ol className="mt-sm space-y-sm">
            {adjustments.map((entry) => (
              <li key={entry.id} className="rounded-md bg-surface-container-low p-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-xs">
                  <p className="font-body-sm font-medium">
                    {entry.action === 'set' ? 'Set count' : `${entry.action === 'increment' ? 'Added' : 'Removed'} units`}
                    {' · '}
                    {entry.action === 'set' ? entry.adjustmentAmount : entry.adjustmentAmount}
                  </p>
                  <time className="font-label-sm text-[8px] text-on-surface-variant" dateTime={entry.adjustedAt}>{formatDate(entry.adjustedAt)}</time>
                </div>
                <p className="mt-xs font-body-sm text-on-surface-variant">
                  {entry.previousQuantity === null ? 'Previously untracked' : `${entry.previousQuantity} before`}
                  {' → '}
                  {entry.newQuantity} now · Admin {entry.adminId}
                </p>
                <p className="mt-xs font-body-sm text-on-surface-variant">{entry.reason}</p>
              </li>
            ))}
          </ol>
          {pagination?.pages > 1 && (
            <nav aria-label="Adjustment history pages" className="mt-sm flex items-center justify-between gap-sm">
              <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="min-h-9 rounded-md border border-primary/15 px-sm font-label-sm text-[8px] uppercase disabled:opacity-40">Previous</button>
              <p className="font-body-sm text-on-surface-variant">Page {pagination.page} of {pagination.pages}</p>
              <button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)} className="min-h-9 rounded-md border border-primary/15 px-sm font-label-sm text-[8px] uppercase disabled:opacity-40">Next</button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}

function AdjustmentPanel({ item, onSaved }) {
  const isUntracked = item.quantity === null
  const [action, setAction] = useState('set')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [historyRefresh, setHistoryRefresh] = useState(0)

  const handleActionChange = (value) => {
    setAction(value)
    setQuantity('')
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const amount = Number(quantity)
    if (!Number.isSafeInteger(amount) || amount < (action === 'set' ? 0 : 1)) {
      setError(action === 'set'
        ? 'Enter a non-negative whole stock count.'
        : 'Enter a positive whole adjustment amount.')
      return
    }
    const label = action === 'set'
      ? `Set the on-hand count to ${amount}`
      : `${action === 'increment' ? 'Add' : 'Remove'} ${amount} unit${amount === 1 ? '' : 's'}`
    if (!window.confirm(`${label} for ${item.productName} — ${item.variantLabel}?`)) return

    setSubmitting(true)
    try {
      const response = await createAdminInventoryAdjustment(
        item.productId,
        item.variantId,
        { action, quantity: amount, reason },
      )
      setQuantity('')
      setReason('')
      setAction('set')
      setHistoryRefresh((value) => value + 1)
      onSaved(response.message || 'Stock adjustment recorded.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to record the stock adjustment.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-md grid gap-xl border-t border-primary/10 pt-md lg:grid-cols-[minmax(280px,0.8fr)_minmax(360px,1.2fr)]">
      <form onSubmit={handleSubmit} className="space-y-md" aria-label={`Adjust stock for ${item.productName}, ${item.variantLabel}`}>
        <h3 className="font-headline text-headline-sm">Adjust stock</h3>
        {isUntracked && (
          <p className="rounded-md bg-secondary-container/30 p-sm font-body-sm text-on-surface-variant">
            This variant is untracked. Enter a verified physical count to initialize inventory; no quantity has been assumed.
          </p>
        )}
        <label className="block">
          <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Adjustment type</span>
          <select value={action} onChange={(event) => handleActionChange(event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none">
            <option value="set">Set exact on-hand count</option>
            <option value="increment" disabled={isUntracked}>Increase stock</option>
            <option value="decrement" disabled={isUntracked}>Decrease stock</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">{action === 'set' ? 'Physical stock count' : 'Units to adjust'}</span>
          <input type="number" min={action === 'set' ? 0 : 1} step="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none" />
        </label>
        <label className="block">
          <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Reason (required)</span>
          <textarea required minLength={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="w-full rounded-md border border-primary/10 bg-white px-md py-sm font-body-sm focus:border-secondary focus:outline-none" />
        </label>
        {error && <p role="alert" className="font-body-sm text-error">{error}</p>}
        <button type="submit" disabled={submitting} className="min-h-11 rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white disabled:opacity-50">
          {submitting ? 'Saving adjustment…' : 'Confirm adjustment'}
        </button>
      </form>

      <History productId={item.productId} variantId={item.variantId} refresh={historyRefresh} />
    </div>
  )
}

export default function AdminInventoryPage() {
  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1 })
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    items: [],
    pagination: null,
    error: null,
  })
  const [selectedKey, setSelectedKey] = useState('')
  const [notice, setNotice] = useState('')
  const key = `${debouncedSearch}|${filters.status}|${filters.page}|${attempt}`
  const loading = result.key !== key

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 250)
    return () => clearTimeout(timer)
  }, [filters.search])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const params = { page: filters.page, limit: 20, status: filters.status }
    if (debouncedSearch) params.search = debouncedSearch

    listAdminInventory(params, controller.signal)
      .then((response) => {
        if (!active) return
        if (!Array.isArray(response.data)) {
          throw new Error('The inventory service returned an invalid list response.')
        }
        setResult({
          key,
          items: response.data,
          pagination: response.pagination,
          error: null,
        })
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED') return
        setResult({ key, items: [], pagination: null, error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [debouncedSearch, filters.page, filters.status, key])

  const updateFilter = (name, value) => {
    setNotice('')
    setFilters((current) => ({ ...current, [name]: value, page: 1 }))
  }

  const items = loading ? [] : result.items
  const error = loading ? null : result.error
  const pagination = loading ? null : result.pagination
  const hasFilters = Boolean(filters.search || filters.status !== 'all')

  return (
    <section aria-labelledby="admin-inventory-heading">
      <div>
        <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Stock management</p>
        <h1 id="admin-inventory-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Inventory</h1>
        <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
          Inventory is tracked per product variant. Low stock means 1–5 units; zero is out of stock. Existing variants remain untracked until an admin records a verified count. Checkout does not deduct stock.
        </p>
      </div>

      <div className="mt-xl rounded-lg border border-primary/10 bg-white p-md md:p-lg">
        <div className="grid gap-md sm:grid-cols-[minmax(220px,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">Search products or SKUs</span>
            <Search size={16} className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input type="search" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search product name or SKU" className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low pl-2xl pr-md font-body-sm focus:border-secondary focus:outline-none" />
          </label>
          <label>
            <span className="sr-only">Filter inventory</span>
            <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none">
              {STOCK_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {notice && <p className="mt-md rounded-md bg-green-50 p-md font-body-sm text-green-800" role="status">{notice}</p>}
      {loading && <p className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">Loading inventory…</p>}
      {error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <p role="alert" className="font-body-sm text-error">{error.message}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-sm font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Try again</button>
        </div>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="mt-lg rounded-lg border border-dashed border-primary/20 bg-white p-xl text-center">
          <h2 className="font-headline text-headline-sm">{hasFilters ? 'No matching variants' : 'No product variants'}</h2>
          <p className="mt-sm font-body-sm text-on-surface-variant">
            {hasFilters
              ? 'No product variants match the selected search and stock filter.'
              : 'Product variants will appear here when the catalog contains them.'}
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="mt-lg space-y-md">
            {items.map((item) => {
              const rowKey = `${item.productId}|${item.variantId}`
              const expanded = selectedKey === rowKey
              return (
                <article key={rowKey} className="rounded-lg border border-primary/10 bg-white p-md md:p-lg">
                  <div className="grid gap-md md:grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_minmax(120px,0.7fr)_minmax(120px,0.7fr)_auto] md:items-center">
                    <div className="flex min-w-0 items-center gap-md">
                      {item.image?.url
                        ? <img src={item.image.url} alt={item.image.alt || ''} className="h-14 w-14 shrink-0 rounded-md object-cover" />
                        : <span aria-hidden="true" className="h-14 w-14 shrink-0 rounded-md bg-surface-container-low" />}
                      <div className="min-w-0">
                        <h2 className="truncate font-headline text-headline-sm">{item.productName}</h2>
                        <p className="mt-xs truncate font-body-sm text-on-surface-variant">{item.categoryName}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-body-sm font-medium">{item.variantLabel}</p>
                      <p className="mt-xs font-body-sm text-on-surface-variant">SKU: {item.sku || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="font-label-sm text-[8px] uppercase tracking-wider text-on-surface-variant">Available quantity</p>
                      <p className="mt-xs font-body-md font-medium">{item.quantity === null ? 'Untracked' : item.quantity}</p>
                    </div>
                    <div><StockBadge status={item.stockStatus} /></div>
                    <button type="button" aria-expanded={expanded} onClick={() => setSelectedKey(expanded ? '' : rowKey)} className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider text-primary hover:bg-surface-container-low">
                      {expanded ? 'Close' : 'Manage'}
                    </button>
                  </div>
                  {expanded && <AdjustmentPanel key={rowKey} item={item} onSaved={(message) => { setNotice(message); setAttempt((value) => value + 1) }} />}
                </article>
              )
            })}
          </div>

          {pagination?.pages > 1 && (
            <nav aria-label="Inventory pages" className="mt-lg flex items-center justify-between gap-md">
              <button type="button" disabled={filters.page <= 1 || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40">Previous</button>
              <p className="font-body-sm text-on-surface-variant">Page {pagination.page} of {pagination.pages} · {pagination.total} variants</p>
              <button type="button" disabled={filters.page >= pagination.pages || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40">Next</button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
