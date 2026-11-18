import { Link } from 'react-router-dom'
import { formatPrice } from '../../data/formulations'

export default function CartSummary({ subtotal, itemCount }) {
  return (
    <aside className="h-fit border border-outline-variant/50 bg-surface px-lg py-lg">
      <h2 className="font-headline text-headline-sm">Dossier summary</h2>
      <div className="mt-lg space-y-md border-b border-outline-variant/50 pb-lg">
        <div className="flex justify-between gap-md font-body-sm">
          <span>Sample items ({itemCount})</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-md font-body-sm text-on-surface-variant">
          <span>Shipping</span>
          <span>Not calculated</span>
        </div>
      </div>
      <div className="flex justify-between gap-md py-lg font-headline text-headline-sm">
        <span>Displayed subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <Link
        to="/checkout"
        className="inline-flex min-h-12 w-full items-center justify-center bg-primary px-md text-center font-label-sm text-[10px] uppercase text-on-primary"
      >
        Continue to demo checkout
      </Link>
      <p className="mt-md font-body-sm leading-relaxed text-on-surface-variant">
        Demonstration only. This sample dossier cannot be used to place an order or submit payment.
      </p>
      <Link to="/shop" className="mt-lg inline-flex font-label-sm text-[9px] uppercase text-secondary underline">
        Continue exploring
      </Link>
    </aside>
  )
}
