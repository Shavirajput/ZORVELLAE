import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createAdminIngredient,
  getAdminIngredient,
  updateAdminIngredient,
} from '../../services/adminContent'

const EMPTY_INGREDIENT = {
  name: '',
  inci: '',
  slug: '',
  summary: '',
  monograph: '',
  sortOrder: '0',
  status: 'draft',
}

function isValidIngredient(ingredient) {
  return Boolean(
    ingredient &&
    typeof ingredient.id === 'string' &&
    typeof ingredient.name === 'string' &&
    typeof ingredient.slug === 'string' &&
    ['draft', 'published'].includes(ingredient.status),
  )
}

export default function AdminIngredientFormPage() {
  const { ingredientId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: '', ingredient: null, error: null })
  const [formState, setFormState] = useState({
    key: 'new|0',
    values: EMPTY_INGREDIENT,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const key = `${ingredientId || 'new'}|${attempt}`
  const loading = Boolean(ingredientId) && result.key !== key
  const loadError = ingredientId && !loading && result.error
  const values = formState.key === key ? formState.values : EMPTY_INGREDIENT

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    if (!ingredientId) {
      return () => {
        active = false
        controller.abort()
      }
    }

    getAdminIngredient(ingredientId, controller.signal)
      .then((response) => {
        if (!active) return
        if (!isValidIngredient(response.data)) {
          throw new Error('The ingredient service returned an invalid detail response.')
        }
        setResult({ key, ingredient: response.data, error: null })
        setFormState({
          key,
          values: {
            name: response.data.name,
            inci: response.data.inci || '',
            slug: response.data.slug,
            summary: response.data.summary || '',
            monograph: response.data.monograph || '',
            sortOrder: String(response.data.sortOrder || 0),
            status: response.data.status,
          },
        })
        setError('')
      })
      .catch((requestError) => {
        if (!active || requestError?.code === 'ERR_CANCELED') return
        setResult({ key, ingredient: null, error: requestError })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [attempt, ingredientId, key])

  const updateField = (field, value) => {
    setFormState((current) => ({
      key,
      values: {
        ...(current.key === key ? current.values : EMPTY_INGREDIENT),
        [field]: value,
      },
    }))
    setError('')
    setNotice('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const sortOrder = Number(values.sortOrder)
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
      setError('Sort order must be a whole number from 0 to 10000.')
      return
    }
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = { ...values, sortOrder }
      const response = ingredientId
        ? await updateAdminIngredient(ingredientId, payload)
        : await createAdminIngredient(payload)
      if (!isValidIngredient(response.data)) {
        throw new Error('The ingredient service returned an invalid saved record.')
      }
      navigate('/admin/ingredients', {
        replace: true,
        state: { notice: `Ingredient "${response.data.name}" saved as ${response.data.status}.` },
      })
    } catch (requestError) {
      setError(requestError.message || 'Unable to save this ingredient record.')
    } finally {
      setSaving(false)
    }
  }

  const pageTitle = ingredientId ? 'Edit ingredient' : 'Add ingredient'

  return (
    <section aria-labelledby="admin-ingredient-form-heading">
      <Link to="/admin/ingredients" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
        Back to ingredient library
      </Link>
      <div className="mt-md">
        <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Content management</p>
        <h1 id="admin-ingredient-form-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">{pageTitle}</h1>
        <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
          Enter only approved reference material. This form does not create claims, evidence ratings, or ingredient benefits.
        </p>
      </div>

      {loading && <p role="status" className="mt-lg rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant">Loading ingredient record…</p>}
      {loadError && (
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <h2 className="font-headline text-headline-sm">Ingredient unavailable</h2>
          <p role="alert" className="mt-sm font-body-sm text-error">{loadError.message}</p>
          <button type="button" className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline" onClick={() => setAttempt((value) => value + 1)}>
            Retry
          </button>
        </div>
      )}
      {!loading && !loadError && (
        <form onSubmit={handleSubmit} className="mt-lg space-y-lg">
          {error && <p role="alert" className="rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{error}</p>}
          {notice && <p role="status" className="rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm text-on-surface">{notice}</p>}
          <section className="rounded-lg border border-primary/10 bg-white p-lg">
            <h2 className="font-headline text-headline-sm">Ingredient record</h2>
            <div className="mt-md grid gap-md md:grid-cols-2">
              <label className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                Display name
                <input required minLength={2} maxLength={120} value={values.name} onChange={(event) => updateField('name', event.target.value)} className="mt-xs min-h-11 w-full rounded-md border border-primary/15 px-md font-body-md normal-case tracking-normal text-primary" />
              </label>
              <label className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                INCI name
                <input maxLength={160} value={values.inci} onChange={(event) => updateField('inci', event.target.value)} className="mt-xs min-h-11 w-full rounded-md border border-primary/15 px-md font-body-md normal-case tracking-normal text-primary" />
              </label>
              <label className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                URL slug
                <input required maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={values.slug} onChange={(event) => updateField('slug', event.target.value)} className="mt-xs min-h-11 w-full rounded-md border border-primary/15 px-md font-body-md normal-case tracking-normal text-primary" />
              </label>
              <label className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                Publication status
                <select value={values.status} onChange={(event) => updateField('status', event.target.value)} className="mt-xs min-h-11 w-full rounded-md border border-primary/15 bg-white px-md font-body-md normal-case tracking-normal text-primary">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant md:col-span-2">
                Approved summary
                <textarea maxLength={500} rows={3} value={values.summary} onChange={(event) => updateField('summary', event.target.value)} className="mt-xs w-full rounded-md border border-primary/15 p-md font-body-md normal-case tracking-normal text-primary" />
              </label>
              <label className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant md:col-span-2">
                Approved monograph copy
                <textarea maxLength={10000} rows={8} value={values.monograph} onChange={(event) => updateField('monograph', event.target.value)} className="mt-xs w-full rounded-md border border-primary/15 p-md font-body-md normal-case tracking-normal text-primary" />
              </label>
              <label className="max-w-xs font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
                Sort order
                <input type="number" min="0" max="10000" step="1" value={values.sortOrder} onChange={(event) => updateField('sortOrder', event.target.value)} className="mt-xs min-h-11 w-full rounded-md border border-primary/15 px-md font-body-md normal-case tracking-normal text-primary" />
              </label>
            </div>
          </section>
          <div className="flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
            <Link to="/admin/ingredients" className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary/20 px-lg font-label-sm text-[9px] uppercase tracking-wider text-primary">Cancel</Link>
            <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Save ingredient'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
