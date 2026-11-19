import { Link } from 'react-router-dom'
import CartItem from '../components/cart/CartItem'
import CartSummary from '../components/cart/CartSummary'
import useShop from '../context/useShop'
import { getCartLines, getCartSubtotal } from '../utils/cart'

export default function CartPage() {
  const { cart, customer } = useShop()
  const lines = getCartLines(cart)
  const itemCount = lines.reduce((total, { item }) => total + item.quantity, 0)
  const subtotal = getCartSubtotal(lines)

  return (
    <>
      <div className="border-b border-primary/10 bg-surface-container-low px-gutter-mobile py-sm md:px-gutter">
        <div className="mx-auto max-w-canvas font-label-sm text-[9px] uppercase text-on-surface-variant">
          <Link to="/" className="hover:text-primary">Home</Link><span className="mx-sm">/</span>
          <span className="text-primary">Formulation dossier</span>
        </div>
      </div>
      <section className="mx-auto max-w-canvas px-gutter-mobile py-2xl md:px-gutter">
        <p className="font-label-md text-label-md uppercase text-secondary">Sample selection / Demo basket</p>
        <div className="mt-sm flex flex-wrap items-end justify-between gap-md border-b border-primary/10 pb-lg">
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-lg">Your Formulation Dossier</h1>
            <p className="mt-sm font-body-md text-on-surface-variant">
              {itemCount} development {itemCount === 1 ? 'sample' : 'samples'} selected
            </p>
          </div>
          <Link to="/shop" className="font-label-sm text-[9px] uppercase text-primary underline">Continue exploring</Link>
        </div>
        <div className="mt-lg border border-secondary/20 bg-secondary-container/25 px-md py-md font-body-sm text-on-surface-variant">
          Demonstration basket only. Sample items cannot be purchased and no order or payment will be created.
        </div>
        <p className="mt-sm font-body-sm text-on-surface-variant">
          {customer
            ? 'Your selections are linked to your customer account.'
            : 'Guest selections are stored on this device.'}
        </p>

        {lines.length === 0 ? (
          <div className="py-3xl text-center">
            <h2 className="text-headline-md">Your dossier is currently empty</h2>
            <p className="mx-auto mt-sm max-w-lg font-body-md text-on-surface-variant">
              Add development samples to explore the basket interactions.
            </p>
            <Link to="/shop" className="mt-lg inline-flex bg-primary px-xl py-md font-label-sm text-[10px] uppercase text-on-primary">
              Browse samples
            </Link>
          </div>
        ) : (
          <div className="mt-xl grid items-start gap-2xl lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div>
              <div className="flex justify-between border-b border-primary/10 pb-sm font-label-sm text-[9px] uppercase text-secondary">
                <span>Selected development samples</span><span>Sample total</span>
              </div>
              {lines.map(({ item, product }) => (
                <CartItem key={`${item.productId}-${item.variantId}`} item={item} product={product} />
              ))}
            </div>
            <CartSummary subtotal={subtotal} itemCount={itemCount} />
          </div>
        )}
      </section>
    </>
  )
}
