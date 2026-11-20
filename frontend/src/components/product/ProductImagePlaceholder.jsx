export default function ProductImagePlaceholder({ product, className = '', viewIndex = 0, variant = 'default' }) {
  const isJar = viewIndex === 2 || product.category === 'moisturisers' || product.category === 'eye-care'
  const isEditorial = variant === 'editorial'

  return (
    <div
      className={`relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-surface-container-highest ${className}`}
      role="img"
      aria-label={isEditorial ? `${product.name}: approved product photography pending` : `${product.name}: development image placeholder`}
    >
      {isEditorial ? (
        <>
          <div className="absolute inset-4 border border-primary/10 sm:inset-6" />
          <div className="relative z-[1] max-w-[13rem] px-md text-center">
            <span className="font-label-sm text-[8px] uppercase tracking-[0.16em] text-secondary">
              {product.isDemo === true ? 'Development sample' : 'Product image'}
            </span>
            <p className="mt-sm font-headline text-headline-sm text-primary/80">
              Approved product photography pending
            </p>
          </div>
        </>
      ) : (
        <>
          <span className="pointer-events-none absolute left-sm top-sm z-10 rounded-sm bg-surface/90 px-sm py-xs font-label-sm text-[8px] uppercase tracking-wider text-secondary">
            Development image placeholder
          </span>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,rgba(255,255,255,0.75),transparent_58%)]" />
          <div
            className={`relative z-[1] flex items-end justify-center border border-primary/15 bg-surface/80 shadow-card ${
              isJar ? 'h-[26%] w-[56%] rounded-t-lg' : 'h-[53%] w-[30%] rounded-t-[22px]'
            }`}
          >
            {!isJar && <div className="absolute -top-5 h-6 w-7 rounded-t bg-outline-variant/70" />}
            <div className="mb-[18%] w-full border-y border-primary/10 px-1 py-md text-center">
              <span className="block font-label-sm text-[8px] tracking-[0.16em] text-secondary">ZORVELLAE</span>
              <span className="mt-1 block font-label-sm text-[6px] uppercase leading-tight text-on-surface-variant">
                Sample visual
              </span>
            </div>
          </div>
          <span className="pointer-events-none absolute bottom-sm right-sm font-label-sm text-[8px] uppercase text-on-surface-variant/70">
            Not product photography
          </span>
        </>
      )}
    </div>
  )
}
