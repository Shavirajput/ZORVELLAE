import { formatPrice } from '../../data/formulations'

export default function VariantSelector({ variants, value, onChange, currency }) {
  if (variants.length < 2) {
    return (
      <div className="border border-outline-variant/50 px-md py-sm">
        <span className="font-label-sm text-[9px] uppercase text-secondary">Size</span>
        <p className="mt-xs font-body-md">{variants[0]?.label}</p>
      </div>
    )
  }

  return (
    <fieldset>
      <legend className="mb-sm font-label-sm text-[9px] uppercase text-secondary">Choose a size</legend>
      <div className="grid grid-cols-2 gap-sm">
        {variants.map((variant) => (
          <label
            key={variant.id}
            className={`cursor-pointer border px-md py-sm ${
              value === variant.id ? 'border-primary bg-surface-container-low' : 'border-outline-variant/50'
            }`}
          >
            <input
              type="radio"
              name="formulation-size"
              value={variant.id}
              checked={value === variant.id}
              onChange={() => onChange(variant.id)}
              className="sr-only"
            />
            <span className="block font-body-md">{variant.label}</span>
            <span className="mt-xs block font-body-sm text-on-surface-variant">
              {formatPrice(variant.price, currency)}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
