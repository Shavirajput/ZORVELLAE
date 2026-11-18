import { Link } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import { formulations } from '../data/formulations'
import useShop from '../context/useShop'

export default function WishlistPage() {
  const { customer, wishlist } = useShop()
  const savedProducts = formulations.filter((product) => wishlist.includes(product.id))

  return (
    <section className="mx-auto max-w-canvas px-gutter-mobile py-2xl md:px-gutter">
      <div className="border-b border-primary/10 pb-lg">
        <p className="font-label-md text-label-md uppercase text-secondary">Saved selections</p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Your Wishlist</h1>
        <p className="mt-sm font-body-md text-on-surface-variant">
          Development sample listings only. {customer
            ? 'Your saved items are linked to your account.'
            : 'Guest selections are stored on this device.'}
        </p>
      </div>
      {savedProducts.length ? (
        <div className="mt-xl"><ProductGrid products={savedProducts} /></div>
      ) : (
        <div className="py-3xl text-center">
          <h2 className="text-headline-md">No saved samples yet</h2>
          <p className="mt-sm font-body-md text-on-surface-variant">Use the heart on a sample to save it here.</p>
          <Link to="/shop" className="mt-lg inline-flex bg-primary px-xl py-md font-label-sm text-[10px] uppercase text-on-primary">
            Browse development samples
          </Link>
        </div>
      )}
    </section>
  )
}
