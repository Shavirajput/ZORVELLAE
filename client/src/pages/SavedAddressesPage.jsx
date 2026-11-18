import { useState } from 'react'
import FormField from '../components/forms/FormField'
import useShop from '../context/useShop'

const addressFields = [
  ['firstName', 'First name', 'given-name'],
  ['lastName', 'Last name', 'family-name'],
  ['addressLine1', 'Street address', 'address-line1'],
  ['addressLine2', 'Apartment, suite, etc. (optional)', 'address-line2', false],
  ['city', 'City', 'address-level2'],
  ['region', 'State, province, or region', 'address-level1'],
  ['postalCode', 'Postal code', 'postal-code'],
  ['country', 'Country', 'country-name'],
]

export default function SavedAddressesPage() {
  const {
    savedAddresses,
    addSavedAddress,
    removeSavedAddress,
    setDefaultAddress,
  } = useShop()
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const clearFieldError = (event) => {
    const { name } = event.target
    setErrors((current) => ({ ...current, [name]: undefined }))
    setSaved(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(event.currentTarget)
    const address = Object.fromEntries(
      addressFields.map(([name]) => [name, String(formData.get(name) || '').trim()]),
    )
    const nextErrors = {}
    addressFields.forEach(([name, label, , required = true]) => {
      if (required && !address[name]) nextErrors[name] = `${label} is required.`
    })

    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    const savedSuccessfully = await addSavedAddress(address)
    if (savedSuccessfully) {
      form.reset()
      setSaved(true)
    }
  }

  return (
    <section aria-labelledby="addresses-heading">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Customer address book</p>
      <h2 id="addresses-heading" className="mt-xs font-headline text-headline-md">Saved addresses</h2>
      <p className="mt-sm font-body-sm text-on-surface-variant">
        Addresses are saved to your account. The first saved address becomes the default shipping address.
      </p>

      {savedAddresses.length === 0 ? (
        <p className="mt-lg rounded-lg bg-surface-container-low p-lg font-body-sm text-on-surface-variant">
          No saved addresses yet.
        </p>
      ) : (
        <ul className="mt-lg grid gap-md sm:grid-cols-2">
          {savedAddresses.map((address) => (
            <li key={address.id} className="rounded-lg border border-primary/10 bg-white p-lg">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <p className="font-body-md font-medium text-primary">{address.firstName} {address.lastName}</p>
                {address.isDefault && (
                  <span className="rounded-full bg-secondary-container px-sm py-xs font-label-sm text-[9px] uppercase tracking-wider text-secondary">
                    Default shipping
                  </span>
                )}
              </div>
              <address className="mt-sm not-italic font-body-sm leading-relaxed text-on-surface-variant">
                {address.addressLine1}{address.addressLine2 && `, ${address.addressLine2}`}<br />
                {address.city}, {address.region} {address.postalCode}<br />
                {address.country}
              </address>
              {!address.isDefault && (
                <button
                  type="button"
                  onClick={() => setDefaultAddress(address.id)}
                  className="mt-md mr-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
                >
                  Set as default
                </button>
              )}
              <button
                type="button"
                onClick={() => removeSavedAddress(address.id)}
                className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary underline"
              >
                Remove address
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-xl border-t border-primary/10 pt-lg">
        <h3 className="font-headline text-headline-sm">Add a saved address</h3>
        <form className="mt-md grid max-w-3xl gap-md sm:grid-cols-2" onSubmit={handleSubmit} noValidate>
          {addressFields.map(([name, label, autoComplete, required = true]) => (
            <div key={name} className={name === 'addressLine1' || name === 'addressLine2' ? 'sm:col-span-2' : ''}>
              <FormField
                id={name}
                label={label}
                autoComplete={autoComplete}
                onChange={clearFieldError}
                error={errors[name]}
                required={required}
              />
            </div>
          ))}
          {Object.values(errors).some(Boolean) && (
            <p role="alert" className="font-body-sm text-error sm:col-span-2">
              Correct the highlighted fields.
            </p>
          )}
          {saved && (
            <p role="status" className="font-body-sm text-secondary sm:col-span-2">
              Address saved to your account.
            </p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase tracking-wider text-white hover:bg-espresso">
              Save address
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
