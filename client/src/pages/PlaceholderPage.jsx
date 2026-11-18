export default function PlaceholderPage({ title }) {
  const isCheckout = title === 'Demo Checkout'

  return (
    <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl md:px-gutter">
      <p className="font-label-md text-label-md uppercase text-secondary">ZORVELLAE</p>
      <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">{title}</h1>
      <p className="mt-lg max-w-xl font-body-lg text-on-surface-variant">
        {isCheckout
          ? 'Checkout and payment are intentionally disabled. The development sample basket cannot create orders or accept payment.'
          : 'This approved page is in the implementation sequence and will preserve the ZORVELLAE design system.'}
      </p>
    </section>
  )
}
