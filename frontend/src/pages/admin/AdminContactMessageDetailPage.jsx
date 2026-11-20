import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getAdminContactMessage,
  updateAdminContactMessageStatus,
} from '../../services/adminContent'

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
  return (
    <span className={`inline-flex rounded-full px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider ${styles[status] || styles.read}`}>
      {status}
    </span>
  )
}

function isValidMessage(message) {
  return Boolean(
    message &&
    typeof message.id === 'string' &&
    typeof message.name === 'string' &&
    typeof message.email === 'string' &&
    typeof message.subject === 'string' &&
    typeof message.message === 'string' &&
    ['unread', 'read', 'resolved'].includes(message.status),
  )
}

export default function AdminContactMessageDetailPage() {
  const { messageId } = useParams()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: '', message: null, error: null })
  const [updating, setUpdating] = useState(false)
  const [updateError, setUpdateError] = useState('')
  const [notice, setNotice] = useState('')
  const key = `${messageId}|${attempt}`
  const loading = result.key !== key
  const message = loading ? null : result.message
  const error = loading ? null : result.error

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getAdminContactMessage(messageId, controller.signal)
      .then((response) => {
        if (!active) return
        if (!isValidMessage(response.data)) {
          throw new Error('The contact service returned an invalid detail response.')
        }
        setResult({ key, message: response.data, error: null })
      })
      .catch((requestError) => {
        if (!active || requestError?.code === 'ERR_CANCELED') return
        setResult({ key, message: null, error: requestError })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [key, messageId])

  const handleStatusUpdate = async (status) => {
    if (!message) return
    if (
      status === 'resolved' &&
      !window.confirm('Mark this contact message as resolved?')
    ) return
    setUpdating(true)
    setUpdateError('')
    setNotice('')
    try {
      const response = await updateAdminContactMessageStatus(message.id, status)
      if (!isValidMessage(response.data)) {
        throw new Error('The contact service returned an invalid status update.')
      }
      setResult({ key, message: response.data, error: null })
      setNotice(`Message marked ${status}.`)
    } catch (requestError) {
      setUpdateError(requestError.message || 'Unable to update this message.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <section aria-labelledby="admin-contact-message-heading">
      <Link to="/admin/contact-messages" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
        Back to contact messages
      </Link>
      {loading && <p role="status" className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant">Loading contact message…</p>}
      {!loading && error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <h1 id="admin-contact-message-heading" className="font-headline text-headline-sm">Message unavailable</h1>
          <p role="alert" className="mt-sm font-body-sm text-error">{error.message}</p>
          <button type="button" className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline" onClick={() => setAttempt((value) => value + 1)}>Retry</button>
        </div>
      )}
      {!loading && !error && message && (
        <>
          <div className="mt-lg flex flex-col justify-between gap-md sm:flex-row sm:items-start">
            <div>
              <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Contact inquiry</p>
              <h1 id="admin-contact-message-heading" className="mt-xs break-words text-headline-lg-mobile md:text-headline-lg">{message.subject}</h1>
              <p className="mt-sm font-body-sm text-on-surface-variant">Received {formatDate(message.createdAt)}</p>
            </div>
            <StatusBadge status={message.status} />
          </div>
          {notice && <p role="status" className="mt-lg rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm text-on-surface">{notice}</p>}
          {updateError && <p role="alert" className="mt-lg rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{updateError}</p>}
          <div className="mt-lg grid items-start gap-lg xl:grid-cols-[minmax(0,1fr)_320px]">
            <article className="rounded-lg border border-primary/10 bg-white p-lg">
              <h2 className="font-headline text-headline-sm">Message</h2>
              <p className="mt-md whitespace-pre-wrap break-words font-body-md leading-relaxed text-primary">{message.message}</p>
            </article>
            <aside className="space-y-lg">
              <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="sender-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Sender details</p>
                <h2 id="sender-heading" className="mt-xs break-words font-headline text-headline-sm">{message.name}</h2>
                <a href={`mailto:${message.email}`} className="mt-sm inline-block break-all font-body-sm text-secondary underline">{message.email}</a>
              </section>
              <section className="rounded-lg border border-primary/10 bg-white p-lg" aria-labelledby="message-status-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Message status</p>
                <h2 id="message-status-heading" className="mt-xs font-headline text-headline-sm">Update status</h2>
                {message.status !== 'resolved' ? (
                  <div className="mt-md flex flex-col gap-sm">
                    {message.status === 'unread' && (
                      <button type="button" disabled={updating} onClick={() => handleStatusUpdate('read')} className="min-h-11 rounded-md border border-primary/20 px-md font-label-sm text-[9px] uppercase tracking-wider text-primary disabled:opacity-50">
                        {updating ? 'Updating…' : 'Mark as read'}
                      </button>
                    )}
                    <button type="button" disabled={updating} onClick={() => handleStatusUpdate('resolved')} className="min-h-11 rounded-md bg-primary px-md font-label-sm text-[9px] uppercase tracking-wider text-white disabled:opacity-50">
                      {updating ? 'Updating…' : 'Mark as resolved'}
                    </button>
                  </div>
                ) : (
                  <p className="mt-md font-body-sm text-on-surface-variant">
                    Resolved {message.resolvedAt ? formatDate(message.resolvedAt) : ''}
                  </p>
                )}
              </section>
            </aside>
          </div>
        </>
      )}
    </section>
  )
}
