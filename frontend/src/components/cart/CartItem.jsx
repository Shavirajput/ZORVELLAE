import { Heart, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatPrice, getVariant } from '../../data/formulations'
import useShop from '../../context/useShop'
import ProductImagePlaceholder from '../product/ProductImagePlaceholder'
import QuantitySelector from '../product/QuantitySelector'

export default function CartItem({ product, item }) {
  const { updateQuantity, removeFromCart, toggleWishlist } = useShop()
  const variant = getVariant(product, item.variantId)

  const handleSaveForLater = async () => {
    const saved = await toggleWishlist(product.id)
    if (saved) await removeFromCart(product.id, item.variantId)
  }

  return (
    <article className="grid gap-md border-b border-outline-variant/50 py-lg sm:grid-cols-[112px_minmax(0,1fr)_auto]">
      <Link to={`/product/${product.slug}`} className="block">
        <ProductImagePlaceholder product={product} className="aspect-square" />
      </Link>
      <div className="min-w-0">
        <p className="font-label-sm text-[9px] uppercase text-secondary">{product.categoryLabel} · Development sample</p>
        <Link to={`/product/${product.slug}`} className="mt-xs block font-headline text-headline-sm hover:text-secondary">
          {product.name}
        </Link>
        <p className="mt-xs font-body-sm text-on-surface-variant">{variant.label}</p>
        <div className="mt-md flex flex-wrap items-center gap-md">
          <QuantitySelector
            value={item.quantity}
            onChange={(quantity) => updateQuantity(product.id, item.variantId, quantity)}
            label={`Quantity for ${product.name}`}
          />
          <button
            type="button"
            className="inline-flex items-center gap-xs font-label-sm text-[9px] uppercase text-secondary hover:text-primary"
            onClick={handleSaveForLater}
          >
            <Heart size={13} /> Save for later
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-xs font-label-sm text-[9px] uppercase text-secondary hover:text-error"
            onClick={() => removeFromCart(product.id, item.variantId)}
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      </div>
      <p className="font-body-md text-primary sm:text-right">{formatPrice(variant.price * item.quantity)}</p>
    </article>
  )
}
