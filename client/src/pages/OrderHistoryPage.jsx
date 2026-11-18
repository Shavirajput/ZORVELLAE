import { Link } from 'react-router-dom'

export default function OrderHistoryPage() {
  return (
    <section aria-labelledby="order-history-heading">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Account records</p>
      <h2 id="order-history-heading" className="mt-xs font-headline text-headline-md">Order history</h2>
      <div className="mt-lg rounded-lg bg-surface-container-low p-lg md:p-xl">
        <h3 className="font-headline text-headline-sm">No permanent orders</h3>
        <p className="mt-sm max-w-2xl font-body-sm text-on-surface-variant">
          This demo does not create permanent orders. Temporary checkout confirmations are not saved to account history.
        </p>
        <Link to="/shop" className="mt-lg inline-flex rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase tracking-wider text-white">
          Browse development samples
        </Link>
      </div>
    </section>
  )
}
