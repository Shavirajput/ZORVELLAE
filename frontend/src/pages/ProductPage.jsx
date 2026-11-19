import { useEffect, useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import ProductImageGallery from '../components/product/ProductImageGallery'
import QuantitySelector from '../components/product/QuantitySelector'
import VariantSelector from '../components/product/VariantSelector'
import { formatPrice, getDefaultVariant, getVariant } from '../data/formulations'
import useShop from '../context/useShop'
import {
  fetchProductBySlug,
  fetchProducts,
  isCatalogRequestCancelled,
} from '../services/catalog'

export default function ProductPage() {
  const { slug } = useParams()
  const { addToCart, wishlist, toggleWishlist } = useShop()
  const [retryToken, setRetryToken] = useState(0)
  const requestKey = `${slug || ''}:${retryToken}`
  const [productResult, setProductResult] = useState({
    key: '',
    product: null,
    error: null,
  })
  const [relatedResult, setRelatedResult] = useState({
    key: '',
    products: [],
    error: null,
  })
  const productLoading = productResult.key !== requestKey
  const product = productLoading ? null : productResult.product
  const productError = productLoading ? null : productResult.error
  const relatedLoading = relatedResult.key !== requestKey
  const relatedProducts = relatedLoading ? [] : relatedResult.products
  const relatedError = relatedLoading ? null : relatedResult.error
  const [variantChoices, setVariantChoices] = useState({})
  const [quantities, setQuantities] = useState({})
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchProductBySlug(slug, { signal: controller.signal })
      .then((result) => {
        if (!active) return
        setProductResult({ key: requestKey, product: result, error: null })

        fetchProducts({ limit: 12 }, { signal: controller.signal })
          .then(({ products }) => {
            if (!active) return
            setRelatedResult({
              key: requestKey,
              products: products.filter((item) => item.id !== result.id).slice(0, 3),
              error: null,
            })
          })
          .catch((error) => {
            if (!active || isCatalogRequestCancelled(error)) return
            setRelatedResult({
              key: requestKey,
              products: [],
              error,
            })
          })
      })
      .catch((error) => {
        if (!active || isCatalogRequestCancelled(error)) return
        setProductResult({ key: requestKey, product: null, error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [requestKey, retryToken, slug])

  if (productLoading) {
    return (
      <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl md:px-gutter" role="status">
        Loading product…
      </section>
    )
  }

  if (productError || !product) {
    const notFound = productError?.status === 404
    return (
      <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl md:px-gutter">
        <p className="font-label-md text-label-md uppercase text-secondary">
          {notFound ? 'Formulation unavailable' : 'Catalog unavailable'}
        </p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">
          {notFound ? 'No sample found' : 'Unable to load this product'}
        </h1>
        {!notFound && (
          <>
            <p className="mt-md font-body-md text-on-surface-variant">
              {productError?.message || 'Catalog data is temporarily unavailable.'}
            </p>
            <button
              type="button"
              className="mt-lg underline"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              Try again
            </button>
          </>
        )}
        <Link to="/shop" className="mt-lg inline-flex underline">
          Browse all development samples
        </Link>
      </section>
    )
  }

  const variant = getVariant(
    product,
    variantChoices[product.id] || getDefaultVariant(product).id,
  )
  const quantity = quantities[product.id] || 1
  const setVariantId = (id) =>
    setVariantChoices((choices) => ({ ...choices, [product.id]: id }))
  const setQuantity = (value) =>
    setQuantities((values) => ({ ...values, [product.id]: value }))
  const isSaved = wishlist.includes(product.id)
  const canAddToDemoDossier = product.isDemo && !product.purchaseAvailable

  const handleAdd = async () => {
    if (!canAddToDemoDossier) return
    const addedToCart = await addToCart(product.id, variant.id, quantity)
    if (!addedToCart) return
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1800)
  }

  return (
    <>
      <div className="border-b border-primary/10 bg-surface-container-low px-gutter-mobile py-sm md:px-gutter">
        <div className="mx-auto max-w-canvas font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
          <Link to="/" className="hover:text-primary">Home</Link><span className="mx-sm">/</span>
          <Link to="/shop" className="hover:text-primary">Shop</Link><span className="mx-sm">/</span>
          <span className="text-primary">{product.name}</span>
        </div>
      </div>

      <section className="mx-auto max-w-canvas px-gutter-mobile py-xl md:px-gutter md:py-2xl">
        <div className="grid items-start gap-xl lg:grid-cols-[1.08fr_0.92fr]">
          <ProductImageGallery product={product} />
          <section>
            <p className="font-label-md text-label-md uppercase text-secondary">
              {product.categoryLabel} / Development sample
            </p>
            <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">{product.name}</h1>
            <p className="mt-md font-body-md text-on-surface-variant">{product.description}</p>
            <div className="mt-lg flex items-center justify-between border-y border-outline-variant/50 py-md">
              <span className="font-headline text-headline-sm">
                {formatPrice(variant.price, product.currency)}
              </span>
              <span className="font-label-sm text-[9px] uppercase text-secondary">Sample display price</span>
            </div>

            <div className="mt-lg space-y-lg">
              <VariantSelector
                variants={product.variants}
                value={variant.id}
                onChange={setVariantId}
                currency={product.currency}
              />
              <div className="flex flex-wrap items-end gap-md">
                <div>
                  <p className="mb-sm font-label-sm text-[9px] uppercase text-secondary">Quantity</p>
                  <QuantitySelector value={quantity} onChange={setQuantity} />
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-sm bg-primary px-lg font-label-sm text-[10px] uppercase text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleAdd}
                  disabled={!canAddToDemoDossier}
                >
                  <ShoppingBag size={15} /> {added ? 'Added to demo dossier' : canAddToDemoDossier ? 'Add sample to dossier' : 'Unavailable'}
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center border border-outline-variant/70"
                  onClick={() => toggleWishlist(product.id)}
                  aria-label={isSaved ? 'Remove sample from wishlist' : 'Save sample to wishlist'}
                  aria-pressed={isSaved}
                >
                  <Heart size={17} fill={isSaved ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            <p className="mt-lg border-l-2 border-secondary pl-md font-body-sm leading-relaxed text-on-surface-variant">
              Development sample only. Product specifications are pending approval; this page does not offer a product for purchase.
            </p>

            <div className="mt-xl divide-y divide-outline-variant/60 border-y border-outline-variant/60">
              <details className="group py-md">
                <summary className="cursor-pointer list-none font-headline text-headline-sm">Description</summary>
                <p className="mt-md font-body-sm leading-relaxed text-on-surface-variant">{product.description}</p>
              </details>
              <details className="group py-md">
                <summary className="cursor-pointer list-none font-headline text-headline-sm">Ingredients</summary>
                <p className="mt-md font-body-sm leading-relaxed text-on-surface-variant">{product.ingredients}</p>
              </details>
              <details className="group py-md">
                <summary className="cursor-pointer list-none font-headline text-headline-sm">How to use</summary>
                <p className="mt-md font-body-sm leading-relaxed text-on-surface-variant">{product.usage}</p>
              </details>
              <details className="group py-md">
                <summary className="cursor-pointer list-none font-headline text-headline-sm">Development information</summary>
                <p className="mt-md font-body-sm leading-relaxed text-on-surface-variant">
                  Placeholder listing for layout and interaction testing. No ingredients, clinical claims, or purchasing availability are implied.
                </p>
              </details>
            </div>
          </section>
        </div>
      </section>

      <section className="bg-surface-container-low py-2xl">
        <div className="mx-auto max-w-canvas px-gutter-mobile md:px-gutter">
          <p className="font-label-md text-label-md uppercase text-secondary">Explore the collection</p>
          <h2 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Related development samples</h2>
          <div className="mt-xl">
            {relatedLoading ? (
              <p role="status">Loading related samples…</p>
            ) : relatedError ? (
              <p className="font-body-sm text-on-surface-variant" role="alert">
                Related samples are temporarily unavailable.
              </p>
            ) : (
              <ProductGrid products={relatedProducts} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}
