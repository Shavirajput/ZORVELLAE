import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { deleteAdminIngredient, listAdminIngredients } from '../../services/adminContent'

const STATUS_FILTERS = [
  ['all', 'All statuses'],
  ['draft', 'Draft'],
  ['published', 'Published'],
]

function StatusBadge({ status }) {
  const styles = status === 'published'
    ? 'bg-green-50 text-green-800'
    : 'bg-surface-container-high text-on-surface-variant'
  return (
    <span className={`inline-flex rounded-full px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  )
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null
  return (
    <nav aria-label="Ingredient pages" className="mt-lg flex flex-wrap items-center justify-between gap-sm">
      <p className="font-body-sm text-on-surface-variant">
        Page {pagination.page} of {pagination.pages} · {pagination.total} records
      </p>
      <div className="flex gap-sm">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => onPageChange(pagination.page - 1)}
          className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={pagination.page >= pagination.pages}
          onClick={() => onPageChange(pagination.page + 1)}
          className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  )
}

export default function AdminIngredientsPage() {
  const location = useLocation()
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    ingredients: [],
    pagination: null,
    error: null,
  })
  const [deletingId, setDeletingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const key = `${appliedSearch}|${status}|${page}|${attempt}`
  const loading = result.key !== key
  const ingredients = loading ? [] : result.ingredients
  const pagination = loading ? null : result.pagination
  const error = loading ? null : result.error

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    listAdminIngredients(
      { search: appliedSearch, status, page, limit: 20 },
      controller.signal,
    )
      .then((response) => {
        if (!active) return
        if (!Array.isArray(response.data)) {
          throw new Error('The ingredient service returned an invalid list response.')
        }
        setResult({
          key,
          ingredients: response.data,
          pagination: response.pagination,
          error: null,
        })
      })
      .catch((requestError) => {
        if (!active || requestError?.code === 'ERR_CANCELED') return
        setResult({ key, ingredients: [], pagination: null, error: requestError })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [appliedSearch, attempt, key, page, status])

  const handleSearch = (event) => {
    event.preventDefault()
    setPage(1)
    setAppliedSearch(search.trim())
    setNotice('')
    setActionError('')
  }

  const handleDelete = async (ingredient) => {
    if (!window.confirm(`Delete "${ingredient.name}" from the ingredient library?`)) return
    setDeletingId(ingredient.id)
    setActionError('')
    setNotice('')
    try {
      await deleteAdminIngredient(ingredient.id)
      setNotice('Ingredient record deleted.')
      setAttempt((value) => value + 1)
    } catch (requestError) {
      setActionError(requestError.message || 'Unable to delete this ingredient.')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <section aria-labelledby="admin-ingredients-heading">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Content management</p>
          <h1 id="admin-ingredients-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Ingredient Library</h1>
          <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
            Manage approved ingredient reference copy. No ingredient records are seeded, and no scientific or clinical claims are generated.
          </p>
        </div>
        <Link to="/admin/ingredients/new" className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white">
          Add ingredient
        </Link>
      </div>

      {notice && <p role="status" className="mt-lg rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm text-on-surface">{notice}</p>}
      {actionError && <p role="alert" className="mt-lg rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{actionError}</p>}

      <div className="mt-lg rounded-lg border border-primary/10 bg-white p-md md:p-lg">
        <form onSubmit={handleSearch} className="grid gap-md md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
          <label className="block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
            Search ingredients
            <span className="mt-xs flex min-h-11 items-center gap-sm rounded-md border border-primary/15 px-md">
              <Search size={16} aria-hidden="true" />
              <input
                value={search}
                maxLength={100}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, INCI or slug"
                className="min-w-0 flex-1 border-0 bg-transparent font-body-md normal-case tracking-normal text-primary outline-none"
              />
            </span>
          </label>
          <label className="block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(1)
              }}
              className="mt-xs min-h-11 w-full rounded-md border border-primary/15 bg-white px-md font-body-md normal-case tracking-normal text-primary"
            >
              {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-md border border-primary/20 px-lg font-label-sm text-[9px] uppercase tracking-wider text-primary">
            Search
          </button>
        </form>

        {loading && <p role="status" className="mt-lg font-body-sm text-on-surface-variant">Loading ingredient records…</p>}
        {!loading && error && (
          <div className="mt-lg rounded-md border border-error/30 bg-error/5 p-md">
            <p role="alert" className="font-body-sm text-error">{error.message}</p>
            <button type="button" className="mt-sm font-label-sm text-[9px] uppercase tracking-wider text-secondary underline" onClick={() => setAttempt((value) => value + 1)}>
              Retry
            </button>
          </div>
        )}
        {!loading && !error && ingredients.length === 0 && (
          <div className="mt-lg rounded-md bg-surface-container-low p-lg text-center">
            <h2 className="font-headline text-headline-sm">No ingredient records found</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">Add approved ingredient content or adjust your search.</p>
          </div>
        )}
        {!loading && !error && ingredients.length > 0 && (
          <>
            <div className="mt-lg hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-primary/10 font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                    <th scope="col" className="px-sm py-md">Ingredient</th>
                    <th scope="col" className="px-sm py-md">INCI / slug</th>
                    <th scope="col" className="px-sm py-md">Status</th>
                    <th scope="col" className="px-sm py-md">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {ingredients.map((ingredient) => (
                    <tr key={ingredient.id}>
                      <td className="px-sm py-md">
                        <p className="font-body-md text-primary">{ingredient.name}</p>
                        <p className="mt-xs line-clamp-2 max-w-lg font-body-sm text-on-surface-variant">{ingredient.summary || 'No approved summary entered'}</p>
                      </td>
                      <td className="px-sm py-md font-body-sm text-on-surface-variant">
                        <span className="block">{ingredient.inci || '—'}</span>
                        <span className="mt-xs block">{ingredient.slug}</span>
                      </td>
                      <td className="px-sm py-md"><StatusBadge status={ingredient.status} /></td>
                      <td className="px-sm py-md">
                        <div className="flex items-center gap-md">
                          <Link to={`/admin/ingredients/${ingredient.id}/edit`} className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Edit</Link>
                          <button type="button" disabled={deletingId === ingredient.id} onClick={() => handleDelete(ingredient)} className="font-label-sm text-[9px] uppercase tracking-wider text-error underline disabled:opacity-50">
                            {deletingId === ingredient.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-lg space-y-sm md:hidden">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id} className="rounded-md border border-primary/10 p-md">
                  <div className="flex flex-wrap items-start justify-between gap-sm">
                    <div className="min-w-0">
                      <h2 className="font-body-md text-primary">{ingredient.name}</h2>
                      <p className="mt-xs break-all font-body-sm text-on-surface-variant">{ingredient.inci || ingredient.slug}</p>
                    </div>
                    <StatusBadge status={ingredient.status} />
                  </div>
                  <p className="mt-sm font-body-sm text-on-surface-variant">{ingredient.summary || 'No approved summary entered'}</p>
                  <div className="mt-md flex gap-md">
                    <Link to={`/admin/ingredients/${ingredient.id}/edit`} className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Edit</Link>
                    <button type="button" disabled={deletingId === ingredient.id} onClick={() => handleDelete(ingredient)} className="font-label-sm text-[9px] uppercase tracking-wider text-error underline disabled:opacity-50">
                      {deletingId === ingredient.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </section>
  )
}
