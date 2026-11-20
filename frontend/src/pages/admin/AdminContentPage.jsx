import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAdminContentPage, saveAdminContentPage } from '../../services/adminContent'

const EMPTY_PAGE = {
  title: '',
  introduction: '',
  sections: [],
  status: 'draft',
}

const PAGE_LABELS = {
  'about-us': 'About Us',
  'our-science': 'Our Science',
}

function isValidPageResponse(page) {
  return Boolean(
    page &&
    typeof page.title === 'string' &&
    typeof page.introduction === 'string' &&
    Array.isArray(page.sections) &&
    ['draft', 'published'].includes(page.status),
  )
}

export default function AdminContentPage() {
  const { pageKey } = useParams()
  const pageTitle = PAGE_LABELS[pageKey] || 'Content Page'
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: '', page: null, error: null })
  const [values, setValues] = useState(EMPTY_PAGE)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [notice, setNotice] = useState('')
  const key = `${pageKey}|${attempt}`
  const loading = result.key !== key
  const savedPage = !loading && result.page ? result.page : null
  const error = loading ? null : result.error

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getAdminContentPage(pageKey, controller.signal)
      .then((response) => {
        if (!active) return
        if (!isValidPageResponse(response.data)) {
          throw new Error('The content service returned an invalid page response.')
        }
        setResult({ key, page: response.data, error: null })
        setValues({
          title: response.data.title,
          introduction: response.data.introduction,
          sections: response.data.sections,
          status: response.data.status,
        })
        setSaveError('')
        setNotice('')
      })
      .catch((requestError) => {
        if (!active || requestError?.code === 'ERR_CANCELED') return
        setResult({ key, page: null, error: requestError })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [key, pageKey])

  const updateField = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setSaveError('')
    setNotice('')
  }

  const updateSection = (index, field, value) => {
    setValues((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section,
      ),
    }))
    setSaveError('')
    setNotice('')
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSaveError('')
    setNotice('')
    try {
      const response = await saveAdminContentPage(pageKey, values)
      if (!isValidPageResponse(response.data)) {
        throw new Error('The content service returned an invalid saved page.')
      }
      setResult({ key, page: response.data, error: null })
      setValues({
        title: response.data.title,
        introduction: response.data.introduction,
        sections: response.data.sections,
        status: response.data.status,
      })
      setNotice(`${pageTitle} content saved as ${response.data.status}.`)
    } catch (requestError) {
      setSaveError(requestError.message || 'Unable to save this content page.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!savedPage) return
    setValues({
      title: savedPage.title,
      introduction: savedPage.introduction,
      sections: savedPage.sections,
      status: savedPage.status,
    })
    setSaveError('')
    setNotice('')
  }

  return (
    <section aria-labelledby="admin-content-heading">
      <div className="flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Content management</p>
          <h1 id="admin-content-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">{pageTitle}</h1>
          <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
            Enter only approved brand copy. Content is stored as plain text; no scientific or clinical claims are supplied by this editor.
          </p>
        </div>
        {!loading && !error && savedPage && (
          <span className="inline-flex w-fit rounded-full bg-surface-container-high px-md py-xs font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
            {savedPage.status}
          </span>
        )}
      </div>

      {loading && (
        <p role="status" className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant">
          Loading {pageTitle.toLowerCase()} content…
        </p>
      )}

      {!loading && error && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <h2 className="font-headline text-headline-sm">Content unavailable</h2>
          <p role="alert" className="mt-sm font-body-sm text-error">{error.message}</p>
          <button type="button" className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline" onClick={() => setAttempt((value) => value + 1)}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {notice && <p role="status" className="mt-lg rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm text-on-surface">{notice}</p>}
          {saveError && <p role="alert" className="mt-lg rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{saveError}</p>}

          <form onSubmit={handleSave} className="mt-lg space-y-lg">
            <section className="rounded-lg border border-primary/10 bg-white p-lg">
              <h2 className="font-headline text-headline-sm">Page details</h2>
              <label className="mt-md block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                Page title
                <input
                  required
                  maxLength={120}
                  value={values.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  className="mt-xs min-h-11 w-full rounded-md border border-primary/15 px-md font-body-md normal-case tracking-normal text-primary"
                />
              </label>
              <label className="mt-md block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                Introduction
                <textarea
                  maxLength={10000}
                  rows={5}
                  value={values.introduction}
                  onChange={(event) => updateField('introduction', event.target.value)}
                  className="mt-xs w-full rounded-md border border-primary/15 p-md font-body-md normal-case tracking-normal text-primary"
                />
              </label>
              <label className="mt-md block max-w-xs font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                Publication status
                <select
                  value={values.status}
                  onChange={(event) => updateField('status', event.target.value)}
                  className="mt-xs min-h-11 w-full rounded-md border border-primary/15 bg-white px-md font-body-md normal-case tracking-normal text-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
            </section>

            <section className="rounded-lg border border-primary/10 bg-white p-lg">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div>
                  <h2 className="font-headline text-headline-sm">Page sections</h2>
                  <p className="mt-xs font-body-sm text-on-surface-variant">Sections are displayed in the order shown here.</p>
                </div>
                <button
                  type="button"
                  disabled={values.sections.length >= 30}
                  onClick={() => updateField('sections', [...values.sections, { heading: '', body: '' }])}
                  className="min-h-10 rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider text-primary disabled:opacity-50"
                >
                  Add section
                </button>
              </div>
              {values.sections.length === 0 && (
                <p className="mt-md rounded-md bg-surface-container-low p-md font-body-sm text-on-surface-variant">
                  No sections added. Add approved copy or leave this page as a draft.
                </p>
              )}
              <div className="mt-md space-y-md">
                {values.sections.map((section, index) => (
                  <fieldset key={index} className="rounded-md border border-primary/10 p-md">
                    <legend className="px-xs font-label-sm text-[9px] uppercase tracking-wider text-secondary">Section {index + 1}</legend>
                    <div className="flex flex-col gap-md sm:flex-row sm:items-start">
                      <div className="min-w-0 flex-1">
                        <label className="block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                          Heading
                          <input
                            required
                            maxLength={120}
                            value={section.heading}
                            onChange={(event) => updateSection(index, 'heading', event.target.value)}
                            className="mt-xs min-h-11 w-full rounded-md border border-primary/15 px-md font-body-md normal-case tracking-normal text-primary"
                          />
                        </label>
                        <label className="mt-md block font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                          Copy
                          <textarea
                            required
                            maxLength={6000}
                            rows={5}
                            value={section.body}
                            onChange={(event) => updateSection(index, 'body', event.target.value)}
                            className="mt-xs w-full rounded-md border border-primary/15 p-md font-body-md normal-case tracking-normal text-primary"
                          />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateField('sections', values.sections.filter((_, sectionIndex) => sectionIndex !== index))}
                        className="min-h-10 shrink-0 rounded-md px-sm font-label-sm text-[9px] uppercase tracking-wider text-error underline"
                      >
                        Remove section
                      </button>
                    </div>
                  </fieldset>
                ))}
              </div>
            </section>

            <div className="flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
              <button type="button" disabled={saving} onClick={handleCancel} className="min-h-11 rounded-md border border-primary/20 px-lg font-label-sm text-[9px] uppercase tracking-wider text-primary disabled:opacity-50">
                Cancel changes
              </button>
              <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Save content'}
              </button>
            </div>
          </form>
        </>
      )}
    </section>
  )
}
