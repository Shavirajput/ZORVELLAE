import { Link, useParams } from 'react-router-dom'

export default function OrderDetailsPage() {
  const { orderId } = useParams()

  return (
    <section aria-labelledby="order-details-heading">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Account records</p>
      <h2 id="order-details-heading" className="mt-xs font-headline text-headline-md">Order details unavailable</h2>
      <div className="mt-lg rounded-lg bg-surface-container-low p-lg md:p-xl">
        <p className="font-body-md text-primary">No permanent order record is available for this account.</p>
        <p className="mt-sm font-body-sm text-on-surface-variant">
          {orderId.startsWith('DEMO-')
            ? 'Demo checkout references are temporary and do not become account orders.'
            : 'This account has no real order history in the demo.'}
        </p>
        <Link to="/account/orders" className="mt-lg inline-flex font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
          Return to order history
        </Link>
      </div>
    </section>
  )
}
