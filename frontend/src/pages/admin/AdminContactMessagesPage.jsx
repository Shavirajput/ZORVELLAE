import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { listAdminContactMessages } from '../../services/adminContent'

const STATUS_FILTERS = [
  ['all', 'All messages'],
  ['unread', 'Unread'],
  ['read', 'Read'],
  ['resolved', 'Resolved'],
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

function StatusBadge({ status }) {
  const styles = {
    unread: 'bg-amber-50 text-amber-900',
    read: 'bg-surface-container-high text-on-surface-variant',
    resolved: 'bg-green-50 text-green-800',
  }
  const label = status === 'unread' ? 'Unread' : status
  return (
    <span className={`inline-flex rounded-full px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider ${styles[status] || styles.read}`}>
      {label}
    </span>
  )
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.pages <= 1) return null
  return (
    <nav aria-label="Contact message pages" className="mt-lg flex flex-wrap items-center justify-between gap-sm">
      <p className="font-body-sm text-on-surface-variant">
        Page {pagination.page} of {pagination.pages} · {pagination.total} messages
      </p>
      <div className="flex gap-sm">
        <button type="button" disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)} className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider disabled:opacity-40">Previous</button>
        <button type="button" disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)} className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider disabled:opacity-40">Next</button>
      </div>
    </nav>
  )
}

export default function AdminContactMessagesPage() {
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({
    key: '',
    messages: [],
    pagination: null,
    error: null,
  })
  const key = `${appliedSearch}|${status}|${page}|${attempt}`
  const loading = result.key !== key
  const messages = loading ? [] : result.messages
  const pagination = loading ? null : result.pagination
  const error = loading ? null : result.error

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    listAdminContactMessages(
      { search: appliedSearch, status, page, limit: 20 },
      controller.signal,
    )
      .then((response) => {
        if (!active) return
        if (!Array.isArray(response.data)) {
          throw new Error('The contact service returned an invalid list response.')
        }
        setResult({
          key,
          messages: response.data,
          pagination: response.pagination,
          error: null,
        })
      })
      .catch((requestError) => {
        if (!active || requestError?.code === 'ERR_CANCELED') return
        setResult({ key, messages: [], pagination: null, error: requestError })
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
  }

  return (
    <section aria-labelledby="admin-contact-messages-heading">
      <div>
        <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Content management</p>
        <h1 id="admin-contact-messages-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Contact Messages</h1>
        <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
          Review and resolve stored inquiries. No sample messages are created; this inbox stays empty until messages are entered through an approved intake workflow.
        </p>
      </div>

      <div className="mt-lg rounded-lg border border-primary/10 bg-white p-md md:p-lg">
        <form onSubmit={handleSearch} className="grid gap-md md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
          <label className="block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
            Search messages
            <span className="mt-xs flex min-h-11 items-center gap-sm rounded-md border border-primary/15 px-md">
              <Search size={16} aria-hidden="true" />
              <input value={search} maxLength={100} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or subject" className="min-w-0 flex-1 border-0 bg-transparent font-body-md normal-case tracking-normal text-primary outline-none" />
            </span>
          </label>
          <label className="block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
            Status
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="mt-xs min-h-11 w-full rounded-md border border-primary/15 bg-white px-md font-body-md normal-case tracking-normal text-primary">
              {STATUS_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit" className="min-h-11 rounded-md border border-primary/20 px-lg font-label-sm text-[9px] uppercase tracking-wider text-primary">Search</button>
        </form>

        {loading && <p role="status" className="mt-lg font-body-sm text-on-surface-variant">Loading contact messages…</p>}
        {!loading && error && (
          <div className="mt-lg rounded-md border border-error/30 bg-error/5 p-md">
            <p role="alert" className="font-body-sm text-error">{error.message}</p>
            <button type="button" className="mt-sm font-label-sm text-[9px] uppercase tracking-wider text-secondary underline" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="mt-lg rounded-md bg-surface-container-low p-lg text-center">
            <h2 className="font-headline text-headline-sm">No contact messages found</h2>
            <p className="mt-xs font-body-sm text-on-surface-variant">Messages will appear here when an approved intake workflow stores them.</p>
          </div>
        )}
        {!loading && !error && messages.length > 0 && (
          <>
            <div className="mt-lg hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-primary/10 font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                    <th scope="col" className="px-sm py-md">Sender</th>
                    <th scope="col" className="px-sm py-md">Subject</th>
                    <th scope="col" className="px-sm py-md">Received</th>
                    <th scope="col" className="px-sm py-md">Status</th>
                    <th scope="col" className="px-sm py-md">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {messages.map((message) => (
                    <tr key={message.id}>
                      <td className="px-sm py-md">
                        <p className="font-body-md text-primary">{message.name}</p>
                        <p className="mt-xs break-all font-body-sm text-on-surface-variant">{message.email}</p>
                      </td>
                      <td className="px-sm py-md font-body-sm text-primary">{message.subject}</td>
                      <td className="px-sm py-md font-body-sm text-on-surface-variant">{formatDate(message.createdAt)}</td>
                      <td className="px-sm py-md"><StatusBadge status={message.status} /></td>
                      <td className="px-sm py-md"><Link to={`/admin/contact-messages/${message.id}`} className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-lg space-y-sm md:hidden">
              {messages.map((message) => (
                <li key={message.id} className="rounded-md border border-primary/10 p-md">
                  <div className="flex flex-wrap items-start justify-between gap-sm">
                    <div className="min-w-0">
                      <h2 className="font-body-md text-primary">{message.subject}</h2>
                      <p className="mt-xs font-body-sm text-on-surface-variant">{message.name}</p>
                    </div>
                    <StatusBadge status={message.status} />
                  </div>
                  <p className="mt-xs break-all font-body-sm text-on-surface-variant">{message.email}</p>
                  <p className="mt-sm font-body-sm text-on-surface-variant">{formatDate(message.createdAt)}</p>
                  <Link to={`/admin/contact-messages/${message.id}`} className="mt-md inline-block font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">View message</Link>
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
