import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2 } from 'lucide-react'
import {
  deleteAdminCategory,
  listAdminCategories,
} from '../../services/adminCatalog'

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

export default function AdminCategoriesPage() {
  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1 })
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: '', categories: [], pagination: null, error: null })
  const [deletingId, setDeletingId] = useState('')
  const [notice, setNotice] = useState('')
  const [actionError, setActionError] = useState('')
  const key = `${filters.search}|${filters.status}|${filters.page}|${attempt}`
  const loading = result.key !== key

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const requestKey = `${filters.search}|${filters.status}|${filters.page}|${attempt}`
    const params = { page: filters.page, limit: 20, status: filters.status }
    if (filters.search.trim()) params.search = filters.search.trim()

    const requestTimer = setTimeout(() => {
      listAdminCategories(params, controller.signal)
        .then((response) => {
          if (active) {
            if (!Array.isArray(response.data)) {
              throw new Error('The catalog service returned an invalid categories response.')
            }
            setResult({
              key: requestKey,
              categories: response.data,
              pagination: response.pagination,
              error: null,
            })
          }
        })
        .catch((error) => {
          if (!active) return
          const requestError = error?.code === 'ERR_CANCELED'
            ? new Error('The categories request was cancelled. Please retry.')
            : error
          setResult({ key: requestKey, categories: [], pagination: null, error: requestError })
        })
    }, 0)

    return () => {
      active = false
      clearTimeout(requestTimer)
      controller.abort()
    }
  }, [filters.search, filters.status, filters.page, attempt])

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete “${category.name}”? Categories with products cannot be deleted.`)) return
    setDeletingId(category.recordId)
    setNotice('')
    setActionError('')
    try {
      await deleteAdminCategory(category.recordId)
      setNotice(`${category.name} was deleted.`)
      setAttempt((value) => value + 1)
    } catch (error) {
      setActionError(error.message || 'Unable to delete this category.')
    } finally {
      setDeletingId('')
    }
  }

  const categories = loading ? [] : result.categories
  const error = loading ? null : result.error
  const pagination = loading ? null : result.pagination

  return (
    <section aria-labelledby="admin-categories-heading">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Catalog management</p>
          <h1 id="admin-categories-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Categories</h1>
          <p className="mt-sm font-body-sm text-on-surface-variant">Published categories are visible in the customer catalog.</p>
        </div>
        <Link to="/admin/categories/new" className="inline-flex min-h-11 items-center justify-center gap-sm rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white hover:bg-espresso">
          <Plus size={16} /> Add category
        </Link>
      </div>

      <div className="mt-xl grid gap-md rounded-lg border border-primary/10 bg-white p-md md:grid-cols-[minmax(220px,1fr)_220px] md:p-lg">
        <label className="relative block">
          <span className="sr-only">Search categories</span>
          <Search size={16} className="pointer-events-none absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="search"
            value={filters.search}
            onChange={(event) => {
              setFilters((current) => ({ ...current, search: event.target.value, page: 1 }))
              setNotice('')
            }}
            placeholder="Search name or slug"
            className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low pl-2xl pr-md font-body-sm focus:border-secondary focus:outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Filter categories by status</span>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}
            className="min-h-11 w-full rounded-md border border-primary/10 bg-surface-container-low px-md font-body-sm focus:border-secondary focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      {notice && <p role="status" className="mt-md rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm text-on-surface">{notice}</p>}
      {actionError && <p role="alert" className="mt-md rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{actionError}</p>}
      {loading && <p className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">Loading categories…</p>}
      {error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <p role="alert" className="font-body-sm text-error">{error.message}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)} className="mt-sm font-label-sm text-[9px] uppercase text-secondary underline">Try again</button>
        </div>
      )}
      {!loading && !error && categories.length === 0 && (
        <div className="mt-lg rounded-lg border border-dashed border-primary/20 bg-white p-xl text-center">
          <h2 className="font-headline text-headline-sm">{filters.search || filters.status !== 'all' ? 'No matching categories' : 'No categories yet'}</h2>
          <p className="mt-sm font-body-sm text-on-surface-variant">Add a category before assigning products.</p>
          <Link to="/admin/categories/new" className="mt-md inline-flex font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Add category</Link>
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <>
          <div className="mt-lg hidden overflow-hidden rounded-lg border border-primary/10 bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead className="bg-surface-container-low">
                  <tr className="font-label-sm text-[8px] uppercase tracking-wider text-secondary">
                    <th className="px-lg py-md font-medium">Category</th>
                    <th className="px-lg py-md font-medium">Products</th>
                    <th className="px-lg py-md font-medium">Sort order</th>
                    <th className="px-lg py-md font-medium">Status</th>
                    <th className="px-lg py-md text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {categories.map((category) => (
                    <tr key={category.recordId} className="font-body-sm">
                      <td className="px-lg py-md">
                        <Link to={`/admin/categories/${category.recordId}/edit`} className="font-medium text-primary hover:underline">{category.name}</Link>
                        <p className="mt-xs text-on-surface-variant">{category.slug}</p>
                      </td>
                      <td className="px-lg py-md text-on-surface-variant">{category.productCount}</td>
                      <td className="px-lg py-md text-on-surface-variant">{category.sortOrder}</td>
                      <td className="px-lg py-md"><StatusBadge status={category.status} /></td>
                      <td className="px-lg py-md">
                        <div className="flex justify-end gap-sm">
                          <Link to={`/admin/categories/${category.recordId}/edit`} className="rounded px-sm py-xs font-label-sm text-[9px] uppercase text-secondary underline">Edit</Link>
                          <button type="button" disabled={deletingId === category.recordId} onClick={() => handleDelete(category)} aria-label={`Delete ${category.name}`} className="rounded px-sm py-xs text-error hover:bg-error/5 disabled:opacity-50">
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
            {categories.map((category) => (
              <article key={category.recordId} className="rounded-lg border border-primary/10 bg-white p-md">
                <div className="flex items-start justify-between gap-md">
                  <div className="min-w-0">
                    <Link to={`/admin/categories/${category.recordId}/edit`} className="font-headline text-headline-sm text-primary">{category.name}</Link>
                    <p className="mt-xs break-all font-body-sm text-on-surface-variant">{category.slug}</p>
                  </div>
                  <StatusBadge status={category.status} />
                </div>
                <p className="mt-md font-body-sm text-on-surface-variant">{category.productCount} assigned products · Sort {category.sortOrder}</p>
                <div className="mt-md flex justify-end gap-md border-t border-primary/10 pt-sm">
                  <Link to={`/admin/categories/${category.recordId}/edit`} className="font-label-sm text-[9px] uppercase text-secondary underline">Edit</Link>
                  <button type="button" disabled={deletingId === category.recordId} onClick={() => handleDelete(category)} className="font-label-sm text-[9px] uppercase text-error underline disabled:opacity-50">Delete</button>
                </div>
              </article>
            ))}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="mt-lg flex items-center justify-between gap-md">
              <p className="font-body-sm text-on-surface-variant">Page {pagination.page} of {pagination.pages} · {pagination.total} categories</p>
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
