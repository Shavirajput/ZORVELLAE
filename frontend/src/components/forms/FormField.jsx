export default function FormField({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  autoComplete,
  required = true,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider text-on-surface">
        {label}{required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-surface-container-low px-md py-sm font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-secondary focus:bg-white focus:outline-none ${
          error ? 'border-error' : 'border-transparent'
        }`}
      />
      {error && <p id={`${id}-error`} className="mt-xs font-body-sm text-error">{error}</p>}
    </div>
  )
}
