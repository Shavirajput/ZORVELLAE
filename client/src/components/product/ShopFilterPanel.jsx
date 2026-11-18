import { X } from 'lucide-react'

const priceBands = [
  { value: 'all', label: 'All development prices' },
  { value: 'under-50', label: 'Under $50' },
  { value: '50-70', label: '$50–$70' },
  { value: 'over-70', label: 'Over $70' },
]

export default function ShopFilterPanel({
  categories,
  selectedCategories,
  onCategoriesChange,
  priceBand,
  onPriceBandChange,
  onClose,
  drawer = false,
}) {
  const toggleCategory = (slug) => {
    onCategoriesChange(
      selectedCategories.includes(slug)
        ? selectedCategories.filter((item) => item !== slug)
        : [...selectedCategories, slug],
    )
  }

  const content = (
    <>
      <div className="flex items-center justify-between border-b border-outline-variant/50 pb-md">
        <h2 className="font-headline text-headline-sm">Filters</h2>
        <button
          type="button"
          className="font-label-sm text-[9px] uppercase text-secondary underline"
          onClick={() => {
            onCategoriesChange([])
            onPriceBandChange('all')
          }}
        >
          Clear all
        </button>
        {drawer && (
          <button type="button" onClick={onClose} className="ml-sm inline-flex h-9 w-9 items-center justify-center" aria-label="Close filters">
            <X size={18} />
          </button>
        )}
      </div>

      <fieldset className="mt-lg">
        <legend className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Formulation category</legend>
        <div className="mt-md space-y-md">
          {categories.map((category) => (
            <label key={category.slug} className="flex cursor-pointer items-center gap-sm font-body-sm">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.slug)}
                onChange={() => toggleCategory(category.slug)}
                className="rounded-sm border-outline text-primary focus:ring-secondary"
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-xl border-t border-outline-variant/50 pt-lg">
        <legend className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Display price</legend>
        <div className="mt-md space-y-md">
          {priceBands.map((band) => (
            <label key={band.value} className="flex cursor-pointer items-center gap-sm font-body-sm">
              <input
                type="radio"
                name="price-band"
                value={band.value}
                checked={priceBand === band.value}
                onChange={() => onPriceBandChange(band.value)}
                className="border-outline text-primary focus:ring-secondary"
              />
              <span>{band.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-xl border-t border-outline-variant/50 pt-md font-label-sm text-[8px] uppercase leading-relaxed text-secondary">
        Prices and formulations are for interface demonstration only.
      </p>
    </>
  )

  if (drawer) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Product filters">
        <button type="button" className="absolute inset-0 bg-primary/40" onClick={onClose} aria-label="Close filters" />
        <div className="relative z-10 h-full w-[min(88vw,380px)] overflow-y-auto bg-surface p-lg shadow-drawer">
          {content}
        </div>
      </div>
    )
  }

  return <aside className="hidden lg:block">{content}</aside>
}
