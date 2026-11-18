export default function AccountAuthShell({ eyebrow, title, children }) {
  return (
    <section className="mx-auto max-w-xl px-gutter-mobile py-2xl md:px-gutter md:py-3xl">
      <div className="rounded-xl border border-primary/10 bg-white p-lg shadow-card md:p-xl">
        <p className="font-label-md text-label-md uppercase text-secondary">{eyebrow}</p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">{title}</h1>
        <p className="mt-sm font-body-sm text-on-surface-variant">
          This development account service is not yet security-audited or production-ready. Passwords are not stored in this browser app.
        </p>
        {children}
      </div>
    </section>
  )
}
