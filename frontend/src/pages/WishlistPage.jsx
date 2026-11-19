import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import { fetchProducts, isCatalogRequestCancelled } from '../services/catalog'
import useShop from '../context/useShop'

export default function WishlistPage() {
  const { customer, wishlist } = useShop()
  const [attempt, setAttempt] = useState(0)
  const [catalogResult, setCatalogResult] = useState({
    key: '',
    products: [],
    error: null,
  })
  const hasWishlist = wishlist.length > 0
  const requestKey = `${attempt}:${wishlist.length}`
  const isLoading = hasWishlist && catalogResult.key !== requestKey

  useEffect(() => {
    if (!hasWishlist) return undefined

    const controller = new AbortController()
    let active = true

    fetchProducts({ limit: 100 }, { signal: controller.signal })
      .then(({ products }) => {
        if (active) setCatalogResult({ key: requestKey, products, error: null })
      })
      .catch((error) => {
        if (!active || isCatalogRequestCancelled(error)) return
        setCatalogResult({ key: requestKey, products: [], error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [hasWishlist, requestKey])

  const catalogError =
    isLoading || catalogResult.key !== requestKey ? null : catalogResult.error
  const savedProducts = isLoading || catalogError
    ? []
    : catalogResult.products.filter((product) => wishlist.includes(product.id))

  return (
    <section className="mx-auto max-w-canvas px-gutter-mobile py-2xl md:px-gutter">
      <div className="border-b border-primary/10 pb-lg">
        <p className="font-label-md text-label-md uppercase text-secondary">Saved selections</p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Your Wishlist</h1>
        <p className="mt-sm font-body-md text-on-surface-variant">
          Items reflect the current published catalog. {customer
            ? 'Your saved items are linked to your account.'
            : 'Guest selections are stored on this device.'}
        </p>
      </div>
      {wishlist.length > 0 && isLoading ? (
        <p className="mt-xl py-2xl text-center font-body-md text-on-surface-variant" role="status">
          Loading saved formulations…
        </p>
      ) : catalogError ? (
        <div className="mt-xl border-y border-outline-variant/50 py-2xl text-center" role="alert">
          <h2 className="text-headline-md">Saved formulations are unavailable</h2>
          <p className="mt-sm font-body-md text-error">{catalogError.message}</p>
          <button
            type="button"
            className="mt-lg font-label-sm text-[9px] uppercase text-secondary underline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : savedProducts.length ? (
        <div className="mt-xl"><ProductGrid products={savedProducts} /></div>
      ) : wishlist.length > 0 ? (
        <div className="py-3xl text-center">
          <h2 className="text-headline-md">No saved formulations are currently available</h2>
          <p className="mt-sm font-body-md text-on-surface-variant">
            Saved items that are no longer in the published catalog cannot be displayed.
          </p>
          <Link to="/shop" className="mt-lg inline-flex bg-primary px-xl py-md font-label-sm text-[10px] uppercase text-on-primary">
            Browse formulations
          </Link>
        </div>
      ) : (
        <div className="py-3xl text-center">
          <h2 className="text-headline-md">No saved items yet</h2>
          <p className="mt-sm font-body-md text-on-surface-variant">Use the heart on a formulation to save it here.</p>
          <Link to="/shop" className="mt-lg inline-flex bg-primary px-xl py-md font-label-sm text-[10px] uppercase text-on-primary">
            Browse formulations
          </Link>
        </div>
      )}
    </section>
  )
}
