import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import FormField from '../../components/forms/FormField'
import {
  createAdminCategory,
  getAdminCategory,
  updateAdminCategory,
} from '../../services/adminCatalog'

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function FieldError({ error }) {
  return error
    ? <p className="mt-xs font-body-sm text-error">{error}</p>
    : null
}

export default function AdminCategoryFormPage() {
  const { categoryId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    name: '',
    slug: '',
    description: '',
    bannerImage: '',
    sortOrder: '0',
    status: 'draft',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [loadResult, setLoadResult] = useState({ key: '', error: '' })
  const [submitting, setSubmitting] = useState(false)
  const [slugEdited, setSlugEdited] = useState(Boolean(categoryId))
  const loading = Boolean(categoryId) && loadResult.key !== categoryId
  const loadError = categoryId && loadResult.key === categoryId
    ? loadResult.error
    : ''

  useEffect(() => {
    if (!categoryId) return undefined
    const controller = new AbortController()
    let active = true
    getAdminCategory(categoryId, controller.signal)
      .then(({ data }) => {
        if (!active) return
        setValues({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          bannerImage: data.bannerImage || '',
          sortOrder: String(data.sortOrder ?? 0),
          status: data.status,
        })
        setSlugEdited(true)
        setLoadResult({ key: categoryId, error: '' })
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED') return
        setLoadResult({
          key: categoryId,
          error: error.message || 'Unable to load this category.',
        })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [categoryId])

  const updateValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  const handleNameChange = (event) => {
    const name = event.target.value
    setValues((current) => ({
      ...current,
      name,
      ...(!slugEdited ? { slug: slugify(name) } : {}),
    }))
    setFieldErrors((current) => ({ ...current, name: undefined }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setFormError('')
    setNotice('')
    setFieldErrors({})
    try {
      const result = categoryId
        ? await updateAdminCategory(categoryId, values)
        : await createAdminCategory(values)
      if (!categoryId && result.data?.recordId) {
        setNotice(result.message || 'Category created.')
        navigate(`/admin/categories/${result.data.recordId}/edit`, {
          replace: true,
          state: { notice: result.message || 'Category created.' },
        })
      } else {
        setNotice(result.message || 'Category updated.')
      }
    } catch (error) {
      setFormError(error.message || 'Unable to save this category.')
      setFieldErrors(
        Object.fromEntries((error.fields || []).map(({ field, message }) => [field, message])),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">Loading category…</p>
  }
  if (loadError) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-lg">
        <p role="alert" className="font-body-sm text-error">{loadError}</p>
        <Link to="/admin/categories" className="mt-md inline-flex font-label-sm text-[9px] uppercase text-secondary underline">Back to categories</Link>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="category-form-heading">
      <Link to="/admin/categories" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Categories</Link>
      <div className="mt-sm">
        <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Catalog management</p>
        <h1 id="category-form-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">{categoryId ? 'Edit category' : 'Create category'}</h1>
      </div>

      {notice && <p role="status" className="mt-lg rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm">{notice}</p>}
      {formError && <p role="alert" className="mt-lg rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{formError}</p>}

      <form className="mt-lg rounded-lg border border-primary/10 bg-white p-md md:p-lg" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={submitting} className="space-y-md disabled:opacity-70">
          <div className="grid gap-md md:grid-cols-2">
            <FormField id="name" label="Category name" value={values.name} onChange={handleNameChange} error={fieldErrors.name} />
            <FormField
              id="slug"
              label="URL slug"
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true)
                updateValue('slug', event.target.value.toLowerCase())
              }}
              error={fieldErrors.slug}
            />
            <label className="md:col-span-2">
              <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Description</span>
              <textarea
                id="description"
                rows="4"
                value={values.description}
                onChange={(event) => updateValue('description', event.target.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                className="w-full rounded-lg border border-primary/10 bg-surface-container-low px-md py-sm font-body-md focus:border-secondary focus:outline-none"
              />
              <FieldError error={fieldErrors.description} />
            </label>
            <div className="md:col-span-2">
              <FormField id="bannerImage" label="Banner image HTTPS URL" required={false} type="url" value={values.bannerImage} onChange={(event) => updateValue('bannerImage', event.target.value)} error={fieldErrors.bannerImage} />
              <p className="mt-xs font-body-sm text-on-surface-variant">Use an HTTPS image URL from a host your team controls; uploading is not configured.</p>
            </div>
            <FormField id="sortOrder" label="Sort order" type="number" required={false} value={values.sortOrder} onChange={(event) => updateValue('sortOrder', event.target.value)} error={fieldErrors.sortOrder} />
            <label>
              <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Status *</span>
              <select value={values.status} onChange={(event) => updateValue('status', event.target.value)} className="min-h-11 w-full rounded-lg border border-primary/10 bg-surface-container-low px-md font-body-md focus:border-secondary focus:outline-none">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError error={fieldErrors.status} />
            </label>
          </div>
        </fieldset>

        <div className="mt-xl flex flex-col-reverse justify-end gap-sm sm:flex-row">
          <Link to="/admin/categories" className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary/15 px-lg font-label-sm text-[9px] uppercase tracking-wider">Cancel</Link>
          <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-xl font-label-sm text-[9px] uppercase tracking-wider text-white hover:bg-espresso disabled:opacity-50">
            {submitting ? 'Saving…' : categoryId ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </section>
  )
}
