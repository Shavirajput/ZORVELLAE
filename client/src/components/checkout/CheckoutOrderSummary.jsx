import { formatPrice } from '../../data/formulations'
import ProductImagePlaceholder from '../product/ProductImagePlaceholder'

export default function CheckoutOrderSummary({ lines, totals }) {
  const { subtotal, shipping, total } = totals
  return (
    <aside className="rounded-xl border border-primary/10 bg-white p-lg shadow-card lg:sticky lg:top-24" aria-labelledby="checkout-summary-heading">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Demo order record</p>
      <h2 id="checkout-summary-heading" className="mt-xs font-headline text-headline-sm">Order summary</h2>
      <p className="mt-xs font-body-sm text-on-surface-variant">
        {lines.length} {lines.length === 1 ? 'development sample' : 'development samples'}
      </p>

      <ul className="mt-lg divide-y divide-primary/10">
        {lines.map(({ item, product, variant }) => (
          <li key={`${item.productId}-${item.variantId}`} className="flex gap-md py-md first:pt-0">
            <ProductImagePlaceholder product={product} className="h-16 w-12 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1">
              <p className="font-body-sm font-medium text-primary">{product.name}</p>
              <p className="mt-xs font-body-sm text-on-surface-variant">{variant.label} · Qty {item.quantity}</p>
              <p className="mt-xs font-label-sm text-[10px] text-primary">
                {formatPrice(variant.price * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="mt-md space-y-sm border-t border-primary/10 pt-md font-body-sm">
        <div className="flex justify-between gap-md">
          <dt className="text-on-surface-variant">Subtotal</dt>
          <dd className="font-medium text-primary">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-md">
          <dt className="text-on-surface-variant">Shipping</dt>
          <dd className="text-right font-medium text-secondary">
            {shipping === null ? 'Not configured' : formatPrice(shipping)}
          </dd>
        </div>
        <div className="flex justify-between gap-md border-t border-primary/10 pt-md">
          <dt className="font-medium text-primary">Total</dt>
          <dd className="text-right font-medium text-primary">
            {total === null ? 'Unavailable' : formatPrice(total)}
          </dd>
        </div>
      </dl>
      <p className="mt-md rounded-lg bg-surface-container-low p-md font-body-sm text-on-surface-variant">
        No approved shipping rate or tax is available. The subtotal is not a payable total.
      </p>
    </aside>
  )
}
