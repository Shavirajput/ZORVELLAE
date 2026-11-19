import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import FormField from '../../components/forms/FormField'
import {
  createAdminProduct,
  getAdminProduct,
  listAllAdminCategories,
  updateAdminProduct,
} from '../../services/adminCatalog'

const blankVariant = () => ({ id: '', label: '', sku: '', price: '' })
const blankImage = () => ({ url: '', alt: '' })

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toFormValues(product) {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
    categoryId: product.categoryId,
    currency: product.currency || 'USD',
    compareAtPrice: product.compareAtPrice ?? '',
    status: product.status,
    variants: product.variants.map((variant) => ({
      id: variant.id || '',
      label: variant.label || '',
      sku: variant.sku || '',
      price: String(variant.price ?? ''),
    })),
    images: product.images.length
      ? product.images.map((image) => ({ url: image.url || '', alt: image.alt || '' }))
      : [blankImage()],
  }
}

function FieldError({ error }) {
  return error
    ? <p className="mt-xs font-body-sm text-error">{error}</p>
    : null
}

export default function AdminProductFormPage() {
  const { productId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [values, setValues] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    currency: 'USD',
    compareAtPrice: '',
    status: 'draft',
    variants: [blankVariant()],
    images: [blankImage()],
  })
  const [categories, setCategories] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [loadResult, setLoadResult] = useState({ key: '', error: '' })
  const [submitting, setSubmitting] = useState(false)
  const [slugEdited, setSlugEdited] = useState(Boolean(productId))
  const loadKey = productId || 'new'
  const loading = loadResult.key !== loadKey
  const loadError = loading ? '' : loadResult.error

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const loadProduct = productId
      ? getAdminProduct(productId, controller.signal)
      : Promise.resolve({ data: null })
    Promise.all([
      loadProduct,
      listAllAdminCategories(controller.signal),
    ])
      .then(([productResult, categoryResult]) => {
        if (!active) return
        setCategories(categoryResult)
        if (productResult.data) {
          setValues(toFormValues(productResult.data))
          setSlugEdited(true)
        }
        setLoadResult({ key: loadKey, error: '' })
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED') return
        setLoadResult({
          key: loadKey,
          error: error.message || 'Unable to load catalog data.',
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [productId, loadKey])

  const updateValue = (name, value) => {
    setValues((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  const updateVariant = (index, name, value) => {
    setValues((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [name]: value } : variant,
      ),
    }))
    setFieldErrors((current) => ({ ...current, [`variants.${index}.${name}`]: undefined }))
    setFormError('')
  }

  const updateImage = (index, name, value) => {
    setValues((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? { ...image, [name]: value } : image,
      ),
    }))
    setFieldErrors((current) => ({ ...current, [`images.${index}.${name}`]: undefined }))
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

    const payload = {
      ...values,
      images: values.images.filter((image) => image.url.trim() || image.alt.trim()),
    }
    try {
      const result = productId
        ? await updateAdminProduct(productId, payload)
        : await createAdminProduct(payload)
      if (!productId && result.data?.recordId) {
        setNotice(result.message || 'Product created.')
        navigate(`/admin/products/${result.data.recordId}/edit`, {
          replace: true,
          state: { notice: result.message || 'Product created.' },
        })
      } else {
        setNotice(result.message || 'Product updated.')
      }
    } catch (error) {
      setFormError(error.message || 'Unable to save this product.')
      setFieldErrors(
        Object.fromEntries((error.fields || []).map(({ field, message }) => [field, message])),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">Loading product form…</p>
  }
  if (loadError) {
    return (
      <div className="rounded-lg border border-error/30 bg-error/5 p-lg">
        <p role="alert" className="font-body-sm text-error">{loadError}</p>
        <Link to="/admin/products" className="mt-md inline-flex font-label-sm text-[9px] uppercase text-secondary underline">Back to products</Link>
      </div>
    )
  }
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-primary/10 bg-white p-xl">
        <h1 className="font-headline text-headline-md">Create a category first</h1>
        <p className="mt-sm font-body-sm text-on-surface-variant">Every product must belong to a category.</p>
        <Link to="/admin/categories/new" className="mt-lg inline-flex min-h-11 items-center rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white">Add category</Link>
      </div>
    )
  }

  return (
    <section className="mx-auto max-w-4xl" aria-labelledby="product-form-heading">
      <Link to="/admin/products" className="font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Products</Link>
      <div className="mt-sm flex flex-col justify-between gap-md sm:flex-row sm:items-end">
        <div>
          <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Catalog management</p>
          <h1 id="product-form-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">{productId ? 'Edit product' : 'Create product'}</h1>
          <p className="mt-sm font-body-sm text-on-surface-variant">Publication status does not enable purchases. Product prices are set per variant.</p>
        </div>
      </div>

      {notice && <p role="status" className="mt-lg rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm">{notice}</p>}
      {formError && <p role="alert" className="mt-lg rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">{formError}</p>}

      <form className="mt-lg space-y-lg" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={submitting} className="space-y-lg disabled:opacity-70">
          <div className="rounded-lg border border-primary/10 bg-white p-md md:p-lg">
            <h2 className="font-headline text-headline-sm">Product details</h2>
            <div className="mt-lg grid gap-md md:grid-cols-2">
              <FormField id="name" label="Product name" value={values.name} onChange={handleNameChange} error={fieldErrors.name} />
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
                <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Description *</span>
                <textarea
                  id="description"
                  required
                  rows="4"
                  value={values.description}
                  onChange={(event) => updateValue('description', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.description)}
                  className="w-full rounded-lg border border-primary/10 bg-surface-container-low px-md py-sm font-body-md focus:border-secondary focus:outline-none"
                />
                <FieldError error={fieldErrors.description} />
              </label>
              <label>
                <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Category *</span>
                <select
                  required
                  value={values.categoryId}
                  onChange={(event) => updateValue('categoryId', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.categoryId)}
                  className="min-h-11 w-full rounded-lg border border-primary/10 bg-surface-container-low px-md font-body-md focus:border-secondary focus:outline-none"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => <option key={category.recordId} value={category.recordId}>{category.name} · {category.status}</option>)}
                </select>
                <FieldError error={fieldErrors.categoryId} />
              </label>
              <label>
                <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Status *</span>
                <select
                  value={values.status}
                  onChange={(event) => updateValue('status', event.target.value)}
                  className="min-h-11 w-full rounded-lg border border-primary/10 bg-surface-container-low px-md font-body-md focus:border-secondary focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="inactive">Inactive</option>
                </select>
                <FieldError error={fieldErrors.status} />
              </label>
            </div>
          </div>

          <div className="rounded-lg border border-primary/10 bg-white p-md md:p-lg">
            <div className="flex flex-col justify-between gap-sm sm:flex-row sm:items-center">
              <div>
                <h2 className="font-headline text-headline-sm">Variants and pricing</h2>
                <p className="mt-xs font-body-sm text-on-surface-variant">The catalog price is derived from the lowest variant price.</p>
              </div>
              <button type="button" onClick={() => setValues((current) => ({ ...current, variants: [...current.variants, blankVariant()] }))} className="inline-flex min-h-10 items-center justify-center gap-xs rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider">
                <Plus size={15} /> Add variant
              </button>
            </div>
            <div className="mt-lg space-y-md">
              {values.variants.map((variant, index) => (
                <div key={variant.id || `new-${index}`} className="grid gap-md rounded-md bg-surface-container-low p-md sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]">
                  {variant.id && <p className="font-body-sm text-on-surface-variant sm:col-span-2 lg:col-span-5">Variant ID: {variant.id}</p>}
                  <div>
                    <label htmlFor={`variant-${index}-label`} className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Variant label *</label>
                    <input id={`variant-${index}-label`} value={variant.label} onChange={(event) => updateVariant(index, 'label', event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none" />
                    <FieldError error={fieldErrors[`variants.${index}.label`]} />
                  </div>
                  <div>
                    <label htmlFor={`variant-${index}-sku`} className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">SKU</label>
                    <input id={`variant-${index}-sku`} value={variant.sku} onChange={(event) => updateVariant(index, 'sku', event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none" />
                    <FieldError error={fieldErrors[`variants.${index}.sku`]} />
                  </div>
                  <div>
                    <label htmlFor={`variant-${index}-price`} className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Price *</label>
                    <input id={`variant-${index}-price`} type="number" min="0" step="0.01" value={variant.price} onChange={(event) => updateVariant(index, 'price', event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none" />
                    <FieldError error={fieldErrors[`variants.${index}.price`]} />
                  </div>
                  <div>
                    {index === 0 && (
                      <>
                        <label htmlFor="currency" className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Currency *</label>
                        <input id="currency" maxLength="3" value={values.currency} onChange={(event) => updateValue('currency', event.target.value.toUpperCase())} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm uppercase focus:border-secondary focus:outline-none" />
                        <FieldError error={fieldErrors.currency} />
                      </>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-sm">
                    {index === 0 ? (
                      <div className="min-w-0 flex-1">
                        <label htmlFor="compareAtPrice" className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Compare-at</label>
                        <input id="compareAtPrice" type="number" min="0" step="0.01" value={values.compareAtPrice} onChange={(event) => updateValue('compareAtPrice', event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none" />
                        <FieldError error={fieldErrors.compareAtPrice} />
                      </div>
                    ) : <span className="flex-1" />}
                    <button type="button" disabled={values.variants.length <= 1} onClick={() => setValues((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }))} aria-label={`Remove variant ${index + 1}`} className="mb-xs inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-error hover:bg-error/5 disabled:opacity-30">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {(fieldErrors.variants || fieldErrors.price) && <FieldError error={fieldErrors.variants || fieldErrors.price} />}
          </div>

          <div className="rounded-lg border border-primary/10 bg-white p-md md:p-lg">
            <div className="flex flex-col justify-between gap-sm sm:flex-row sm:items-center">
              <div>
                <h2 className="font-headline text-headline-sm">Product images</h2>
                <p className="mt-xs font-body-sm text-on-surface-variant">Use HTTPS image URLs from a host your team controls. Uploads are not configured.</p>
              </div>
              <button type="button" disabled={values.images.length >= 10} onClick={() => setValues((current) => ({ ...current, images: [...current.images, blankImage()] }))} className="inline-flex min-h-10 items-center justify-center gap-xs rounded-md border border-primary/15 px-md font-label-sm text-[9px] uppercase tracking-wider disabled:opacity-40">
                <Plus size={15} /> Add image
              </button>
            </div>
            <div className="mt-lg space-y-md">
              {values.images.map((image, index) => (
                <div key={`image-${index}`} className="grid gap-md rounded-md bg-surface-container-low p-md sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]">
                  <div>
                    <label htmlFor={`image-${index}-url`} className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">HTTPS image URL</label>
                    <input id={`image-${index}-url`} type="url" value={image.url} onChange={(event) => updateImage(index, 'url', event.target.value)} placeholder="https://…" className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none" />
                    <FieldError error={fieldErrors[`images.${index}.url`]} />
                  </div>
                  <div>
                    <label htmlFor={`image-${index}-alt`} className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider">Alt text</label>
                    <input id={`image-${index}-alt`} value={image.alt} onChange={(event) => updateImage(index, 'alt', event.target.value)} className="min-h-11 w-full rounded-md border border-primary/10 bg-white px-md font-body-sm focus:border-secondary focus:outline-none" />
                    <FieldError error={fieldErrors[`images.${index}.alt`]} />
                  </div>
                  <button type="button" disabled={values.images.length <= 1} onClick={() => setValues((current) => ({ ...current, images: current.images.filter((_, imageIndex) => imageIndex !== index) }))} aria-label={`Remove image ${index + 1}`} className="inline-flex h-10 w-10 items-center justify-center self-end rounded-md text-error hover:bg-error/5 disabled:opacity-30">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            <FieldError error={fieldErrors.images} />
          </div>
        </fieldset>

        <div className="flex flex-col-reverse justify-end gap-sm sm:flex-row">
          <Link to="/admin/products" className="inline-flex min-h-11 items-center justify-center rounded-md border border-primary/15 px-lg font-label-sm text-[9px] uppercase tracking-wider">Cancel</Link>
          <button type="submit" disabled={submitting || categories.length === 0} className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-xl font-label-sm text-[9px] uppercase tracking-wider text-white hover:bg-espresso disabled:opacity-50">
            {submitting ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </section>
  )
}
