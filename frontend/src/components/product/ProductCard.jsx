import { useState } from 'react'
import { Heart, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatPrice, getDefaultVariant, getStartingPrice } from '../../data/formulations'
import useShop from '../../context/useShop'
import ProductImagePlaceholder from './ProductImagePlaceholder'

export default function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist } = useShop()
  const [added, setAdded] = useState(false)
  const isSaved = wishlist.includes(product.id)
  const canAddToDemoDossier = product.isDemo !== false && !product.purchaseAvailable

  const handleAdd = async () => {
    if (!canAddToDemoDossier) return
    const addedToCart = await addToCart(product.id, getDefaultVariant(product).id)
    if (!addedToCart) return
    setAdded(true)
    window.setTimeout(() => setAdded(false), 1600)
  }

  return (
    <article className="group min-w-0">
      <div className="relative">
        <Link to={`/product/${product.slug}`} aria-label={`View ${product.name}`}>
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.images[0].alt || product.name}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <ProductImagePlaceholder product={product} />
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
      <div className="pt-md">
        <p className="font-label-sm text-[9px] uppercase text-secondary">{product.categoryLabel}</p>
        <Link to={`/product/${product.slug}`} className="mt-xs block font-headline text-headline-sm text-primary hover:text-secondary">
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
