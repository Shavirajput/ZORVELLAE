import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2 } from 'lucide-react'
import {
  deleteAdminProduct,
  listAllAdminCategories,
  listAdminProducts,
} from '../../services/adminCatalog'

function formatPrice(price, currency) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(price)
  } catch {
    return 'Price unavailable'
  }
}

function StatusBadge({ status }) {
  const styles = {
    published: 'bg-secondary-container/40 text-secondary',
    draft: 'bg-surface-container-high text-on-surface-variant',
    inactive: 'bg-error/10 text-error',
  }
  return (
    <span className={`inline-flex rounded-full px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}

export default function AdminProductsPage() {
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    status: 'all',
    page: 1,
  })
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: '', products: [], pagination: null, error: null })
  const [categories, setCategories] = useState([])
  const [categoriesError, setCategoriesError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const key = `${debouncedSearch}|${filters.categoryId}|${filters.status}|${filters.page}|${attempt}`
  const loading = result.key !== key

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search.trim()), 250)
    return () => clearTimeout(timer)
  }, [filters.search])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    listAllAdminCategories(controller.signal)
      .then((categoryList) => {
        if (active) {
          setCategories(categoryList)
          setCategoriesError('')
        }
      })
      .catch((error) => {
        if (active && error?.code !== 'ERR_CANCELED') {
          setCategoriesError(error.message || 'Unable to load categories.')
        }
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const params = {
      page: filters.page,
      limit: 20,
      status: filters.status,
    }
    if (debouncedSearch) params.search = debouncedSearch
    if (filters.categoryId) params.categoryId = filters.categoryId

    listAdminProducts(params, controller.signal)
      .then((productsResult) => {
        if (!active) return
        setResult({
          key,
          products: productsResult.data,
          pagination: productsResult.pagination,
          error: null,
        })
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED') return
        setResult({ key, products: [], pagination: null, error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [debouncedSearch, filters.categoryId, filters.page, filters.status, key])

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value, page: 1 }))
    setNotice('')
    setActionError('')
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return
    setDeletingId(product.recordId)
    setNotice('')
    setActionError('')
    try {
      await deleteAdminProduct(product.recordId)
      setNotice(`${product.name} was deleted.`)
      setAttempt((value) => value + 1)
    } catch (error) {
      setActionError(error.message || 'Unable to delete this product.')
    } finally {
      setDeletingId('')
    }
  }

  const products = loading ? [] : result.products
  const error = loading ? null : result.error
  const pagination = loading ? null : result.pagination

  return (
    <section aria-labelledby="admin-products-heading">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Catalog management</p>
          <h1 id="admin-products-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Products</h1>
          <p className="mt-sm font-body-sm text-on-surface-variant">Manage catalog details and publication status. Purchase availability is not changed here.</p>
        </div>
        <Link to="/admin/products/new" className="inline-flex min-h-11 items-center justify-center gap-sm rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white hover:bg-espresso">
          <Plus size={16} /> Add product
        </Link>
      </div>

      <div className="mt-xl rounded-lg border border-primary/10 bg-white p-md md:p-lg">
        <div className="grid gap-md md:grid-cols-[minmax(220px,1fr)_minmax(160px,220px)_minmax(140px,180px)]">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search size={16} className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Search name or slug"
              className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low pl-2xl pr-md font-body-sm focus:border-secondary focus:outline-none"
            />
          </label>
          <label>
            <span className="sr-only">Filter products by category</span>
            <select
              value={filters.categoryId}
              onChange={(event) => updateFilter('categoryId', event.target.value)}
              className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.recordId} value={category.recordId}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter products by status</span>
            <select
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
              className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
        {categoriesError && <p role="alert" className="mt-sm font-body-sm text-error">{categoriesError}</p>}
      </div>

      {notice && <p role="status" className="mt-md rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm text-on-surface">{notice}</p>}
      {actionError && <p role="alert" className="mt-md rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{actionError}</p>}
      {loading && <p className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">Loading products…</p>}
      {error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <p role="alert" className="font-body-sm text-error">{error.message}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-sm font-label-sm text-[9px] uppercase text-secondary underline">Try again</button>
        </div>
      )}
      {!loading && !error && products.length === 0 && (
        <div className="mt-lg rounded-lg border border-dashed border-primary/20 bg-white p-xl text-center">
          <h2 className="font-headline text-headline-sm">{filters.search || filters.categoryId || filters.status !== 'all' ? 'No matching products' : 'No products yet'}</h2>
          <p className="mt-sm font-body-sm text-on-surface-variant">Create a product record to begin building the catalog.</p>
          <Link to="/admin/products/new" className="mt-md inline-flex font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Add product</Link>
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="mt-lg hidden overflow-hidden rounded-lg border border-primary/10 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="bg-surface-container-low">
                  <tr className="font-label-sm text-[8px] uppercase tracking-wider text-secondary">
                    <th className="px-lg py-md font-medium">Product</th>
                    <th className="px-lg py-md font-medium">Category</th>
                    <th className="px-lg py-md font-medium">Price</th>
                    <th className="px-lg py-md font-medium">Variants</th>
                    <th className="px-lg py-md font-medium">Status</th>
                    <th className="px-lg py-md text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {products.map((product) => (
                    <tr key={product.recordId} className="font-body-sm">
                      <td className="px-lg py-md">
                        <Link to={`/admin/products/${product.recordId}/edit`} className="font-medium text-primary hover:underline">{product.name}</Link>
                        <p className="mt-xs text-on-surface-variant">{product.slug}</p>
                      </td>
                      <td className="px-lg py-md text-on-surface-variant">{product.categoryName || 'Unassigned'}</td>
                      <td className="px-lg py-md text-on-surface">{formatPrice(product.price, product.currency)}</td>
                      <td className="px-lg py-md text-on-surface-variant">{product.variants.length}</td>
                      <td className="px-lg py-md"><StatusBadge status={product.status} /></td>
                      <td className="px-lg py-md">
                        <div className="flex justify-end gap-sm">
                          <Link to={`/admin/products/${product.recordId}/edit`} className="rounded px-sm py-xs font-label-sm text-[9px] uppercase text-secondary underline">Edit</Link>
                          <button type="button" disabled={deletingId === product.recordId} onClick={() => handleDelete(product)} aria-label={`Delete ${product.name}`} className="rounded px-sm py-xs text-error hover:bg-error/5 disabled:opacity-50">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-lg space-y-md md:hidden">
            {products.map((product) => (
              <article key={product.recordId} className="rounded-lg border border-primary/10 bg-white p-md">
                <div className="flex items-start justify-between gap-md">
                  <div className="min-w-0">
                    <Link to={`/admin/products/${product.recordId}/edit`} className="font-headline text-headline-sm text-primary">{product.name}</Link>
                    <p className="mt-xs break-all font-body-sm text-on-surface-variant">{product.slug}</p>
                  </div>
                  <StatusBadge status={product.status} />
                </div>
                <dl className="mt-md grid grid-cols-2 gap-sm font-body-sm">
                  <div><dt className="text-on-surface-variant">Category</dt><dd>{product.categoryName || 'Unassigned'}</dd></div>
                  <div><dt className="text-on-surface-variant">Price</dt><dd>{formatPrice(product.price, product.currency)}</dd></div>
                  <div><dt className="text-on-surface-variant">Variants</dt><dd>{product.variants.length}</dd></div>
                </dl>
                <div className="mt-md flex justify-end gap-md border-t border-primary/10 pt-sm">
                  <Link to={`/admin/products/${product.recordId}/edit`} className="font-label-sm text-[9px] uppercase text-secondary underline">Edit</Link>
                  <button type="button" disabled={deletingId === product.recordId} onClick={() => handleDelete(product)} className="font-label-sm text-[9px] uppercase text-error underline disabled:opacity-50">Delete</button>
                </div>
              </article>
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="mt-lg flex items-center justify-between gap-md">
              <p className="font-body-sm text-on-surface-variant">Page {pagination.page} of {pagination.pages} · {pagination.total} products</p>
              <div className="flex gap-sm">
                <button type="button" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))} className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40">Previous</button>
                <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))} className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
