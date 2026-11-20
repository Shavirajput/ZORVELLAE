import { useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatPrice, getDefaultVariant, getStartingPrice } from '../../data/formulations'
import useShop from '../../context/useShop'
import ProductImagePlaceholder from './ProductImagePlaceholder'

export default function ProductCard({ product, variant = 'default' }) {
  const { addToCart, wishlist, toggleWishlist } = useShop()
  const [added, setAdded] = useState(false)
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const isSaved = wishlist.includes(product.id)
  const canAddToDemoDossier = product.isDemo !== false && !product.purchaseAvailable
  const isFeatured = variant === 'featured'
  const productImageUrl = product.images?.[0]?.url
  const productImageFailed = productImageUrl === failedImageUrl

  const handleAdd = async () => {
    if (!canAddToDemoDossier) return
    const addedToCart = await addToCart(product.id, getDefaultVariant(product).id)
    if (!addedToCart) return
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className={`group min-w-0 ${isFeatured ? 'rounded-lg bg-surface-container-lowest shadow-card transition-shadow hover:shadow-ambient' : ''}`}>
      <div className={`relative ${isFeatured ? 'overflow-hidden rounded-t-lg' : ''}`}>
        <Link to={`/product/${product.slug}`} aria-label={`View ${product.name}`} className={isFeatured ? 'block overflow-hidden' : ''}>
          {productImageUrl && !productImageFailed ? (
            <img
              src={productImageUrl}
              alt={product.images[0].alt || product.name}
              className={`aspect-[4/5] w-full object-cover object-center ${isFeatured ? 'transition-transform duration-500 ease-luxury group-hover:scale-[1.03]' : ''}`}
              onError={() => setFailedImageUrl(productImageUrl)}
            />
          ) : (
            <ProductImagePlaceholder
              product={product}
              variant={isFeatured ? 'editorial' : 'default'}
              className={isFeatured ? 'transition-transform duration-500 ease-luxury group-hover:scale-[1.03]' : ''}
            />
          )}
        </Link>
        <button
          type="button"
          className="absolute right-sm top-sm z-20 inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-primary shadow-card transition-colors hover:bg-white"
          aria-label={isSaved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={isSaved}
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
        </button>
        <span className="pointer-events-none absolute bottom-sm left-sm bg-surface/90 px-sm py-xs font-label-sm text-[8px] uppercase text-secondary">
          {product.badge}
        </span>
      </div>
      <div className={isFeatured ? 'p-md sm:p-lg' : 'pt-md'}>
        <p className="font-label-sm text-[9px] uppercase text-secondary">{product.categoryLabel}</p>
        <Link to={`/product/${product.slug}`} className="mt-xs block font-headline text-headline-sm text-primary transition-colors hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary">
          {product.name}
        </Link>
        <p className="mt-xs line-clamp-2 min-h-10 font-body-sm text-on-surface-variant">
          {product.description}
        </p>
        <div className="mt-md flex items-center justify-between gap-sm">
          <span className="font-body-md text-primary">
            {formatPrice(getStartingPrice(product), product.currency)}
          </span>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-xs border border-primary/25 px-sm font-label-sm text-[9px] uppercase text-primary transition-colors hover:bg-primary hover:text-on-primary"
            onClick={handleAdd}
            aria-label={`Add ${product.name} development sample to demo dossier`}
            disabled={!canAddToDemoDossier}
          >
            <ShoppingBag size={13} />
            {!canAddToDemoDossier ? 'Unavailable' : added ? 'Added' : 'Add sample'}
          </button>
        </div>
      </div>
    </article>
  )
}
