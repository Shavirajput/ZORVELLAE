import { Minus, Plus } from 'lucide-react'

export default function QuantitySelector({ value, onChange, label = 'Quantity' }) {
  return (
    <div className="inline-flex h-11 items-center border border-outline-variant/70" aria-label={label}>
      <button
        type="button"
        className="inline-flex h-full w-10 items-center justify-center"
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus size={14} />
      </button>
      <output className="min-w-9 text-center font-body-md" aria-live="polite">{value}</output>
      <button
        type="button"
        className="inline-flex h-full w-10 items-center justify-center"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
