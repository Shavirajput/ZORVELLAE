import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import FormField from '../components/forms/FormField'
import CheckoutOrderSummary from '../components/checkout/CheckoutOrderSummary'
import useShop from '../context/useShop'
import { getDemoCheckoutTotals, getCartLines } from '../utils/cart'

const initialValues = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
}

const fieldLabels = {
  email: 'Email address',
  phone: 'Phone number',
  firstName: 'First name',
  lastName: 'Last name',
  addressLine1: 'Street address',
  city: 'City',
  region: 'State, province, or region',
  postalCode: 'Postal code',
  country: 'Country',
}

function validate(values, confirmedDemo) {
  const errors = {}
  Object.entries(fieldLabels).forEach(([field, label]) => {
    if (!values[field].trim()) errors[field] = `${label} is required.`
  })
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (!confirmedDemo) errors.demoConfirmation = 'Confirm that you understand this is a demo submission.'
  return errors
}

function ProgressSteps() {
  return (
    <nav aria-label="Checkout progress" className="flex flex-wrap items-center gap-sm">
      {['Contact & address', 'Delivery', 'Final review'].map((step, index) => (
        <div key={step} className="flex items-center gap-sm">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full font-label-sm text-[10px] ${
            index === 0 ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'
          }`}>{index + 1}</span>
          <span className={`font-label-sm text-[9px] uppercase tracking-wider ${
            index === 0 ? 'text-primary' : 'text-on-surface-variant'
          }`}>{step}</span>
          {index < 2 && <span aria-hidden="true" className="mx-xs h-px w-5 bg-outline-variant" />}
        </div>
      ))}
    </nav>
  )
}

export default function CheckoutPage() {
  const { cart, customer, savedAddresses, recordDemoOrder } = useShop()
  const navigate = useNavigate()
  const lines = getCartLines(cart)
  const totals = getDemoCheckoutTotals(lines)
  const [values, setValues] = useState(initialValues)
  const [hasEdited, setHasEdited] = useState(false)
  const [confirmedDemo, setConfirmedDemo] = useState(false)
  const [errors, setErrors] = useState({})
  const defaultAddress = savedAddresses.find((address) => address.isDefault)
  const currentValues = hasEdited
    ? values
    : {
        ...initialValues,
        email: customer?.email || '',
        firstName: defaultAddress?.firstName || '',
        lastName: defaultAddress?.lastName || '',
        addressLine1: defaultAddress?.addressLine1 || '',
        addressLine2: defaultAddress?.addressLine2 || '',
        city: defaultAddress?.city || '',
        region: defaultAddress?.region || '',
        postalCode: defaultAddress?.postalCode || '',
        country: defaultAddress?.country || '',
      }

  if (lines.length === 0) return <Navigate to="/cart" replace />

  const handleChange = (event) => {
    const { name, value } = event.target
    setHasEdited(true)
    setValues({ ...currentValues, [name]: value })
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate(currentValues, confirmedDemo)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const order = recordDemoOrder({
      contact: { email: currentValues.email.trim(), phone: currentValues.phone.trim() },
      shippingAddress: {
        firstName: currentValues.firstName.trim(),
        lastName: currentValues.lastName.trim(),
        addressLine1: currentValues.addressLine1.trim(),
        addressLine2: currentValues.addressLine2.trim(),
        city: currentValues.city.trim(),
        region: currentValues.region.trim(),
        postalCode: currentValues.postalCode.trim(),
        country: currentValues.country.trim(),
      },
      items: lines.map(({ item }) => item),
      ...totals,
    })
    navigate(`/order-confirmation/${order.id}`)
  }

  const field = (name, label, autoComplete, type = 'text', required = true) => (
    <FormField
      key={name}
      id={name}
      label={label}
      value={currentValues[name]}
      onChange={handleChange}
      error={errors[name]}
      autoComplete={autoComplete}
      type={type}
      required={required}
    />
  )

  return (
    <>
      <div className="border-b border-primary/10 bg-surface-container-low px-gutter-mobile py-md md:px-gutter">
        <div className="mx-auto flex max-w-canvas flex-col justify-between gap-md lg:flex-row lg:items-center">
          <ProgressSteps />
          <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">
            Demo checkout · No payment processing
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-canvas px-gutter-mobile py-xl md:px-gutter md:py-2xl">
        <div className="mb-xl">
          <p className="font-label-md text-label-md uppercase text-secondary">Development samples only</p>
          <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Checkout</h1>
          <p className="mt-sm max-w-2xl font-body-md text-on-surface-variant">
            Enter details to review a local demo submission. No order, payment, or shipment will be created.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid items-start gap-xl lg:grid-cols-12">
            <div className="space-y-lg lg:col-span-7">
              <section className="rounded-xl border border-primary/10 bg-white p-lg shadow-card md:p-xl" aria-labelledby="contact-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Chapter 01</p>
                <h2 id="contact-heading" className="mt-xs font-headline text-headline-sm">Contact information</h2>
                <p className="mb-lg mt-xs font-body-sm text-on-surface-variant">The account email may be prefilled; checkout details remain part of this demo session.</p>
                <div className="grid gap-md sm:grid-cols-2">
                  {field('email', 'Email address', 'email', 'email')}
                  {field('phone', 'Phone number', 'tel', 'tel')}
                </div>
              </section>

              <section className="rounded-xl border border-primary/10 bg-white p-lg shadow-card md:p-xl" aria-labelledby="address-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Chapter 02</p>
                <h2 id="address-heading" className="mt-xs font-headline text-headline-sm">Shipping address</h2>
                <p className="mb-lg mt-xs font-body-sm text-on-surface-variant">Your default saved address may prefill this demo form. Checkout does not submit it to a shipping service.</p>
                <div className="grid gap-md sm:grid-cols-2">
                  {field('firstName', 'First name', 'given-name')}
                  {field('lastName', 'Last name', 'family-name')}
                  <div className="sm:col-span-2">{field('addressLine1', 'Street address', 'address-line1')}</div>
                  <div className="sm:col-span-2">{field('addressLine2', 'Apartment, suite, etc. (optional)', 'address-line2', 'text', false)}</div>
                  {field('city', 'City', 'address-level2')}
                  {field('region', 'State, province, or region', 'address-level1')}
                  {field('postalCode', 'Postal code', 'postal-code')}
                  {field('country', 'Country', 'country-name')}
                </div>
              </section>

              <section className="rounded-xl border border-primary/10 bg-white p-lg shadow-card md:p-xl" aria-labelledby="delivery-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Chapter 03</p>
                <h2 id="delivery-heading" className="mt-xs font-headline text-headline-sm">Delivery summary</h2>
                <div className="mt-md rounded-lg bg-surface-container-low p-md">
                  <p className="font-label-sm text-[10px] uppercase tracking-wider text-primary">Shipping not configured</p>
                  <p className="mt-xs font-body-sm text-on-surface-variant">
                    No approved carrier rates or delivery estimates are available for these development samples.
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-primary/10 bg-white p-lg shadow-card md:p-xl" aria-labelledby="review-heading">
                <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Chapter 04</p>
                <h2 id="review-heading" className="mt-xs font-headline text-headline-sm">Final demo review</h2>
                <p className="mt-sm font-body-sm text-on-surface-variant">
                  Check the contact and shipping details above and review the sample subtotal before continuing.
                </p>
                <label className="mt-md flex cursor-pointer items-start gap-sm rounded-lg bg-surface-container-low p-md">
                  <input
                    type="checkbox"
                    checked={confirmedDemo}
                    onChange={(event) => {
                      setConfirmedDemo(event.target.checked)
                      setErrors((current) => ({ ...current, demoConfirmation: undefined }))
                    }}
                    aria-invalid={Boolean(errors.demoConfirmation)}
                    aria-describedby={errors.demoConfirmation ? 'demo-confirmation-error' : undefined}
                    className="mt-1 accent-primary"
                  />
                  <span className="font-body-sm text-on-surface-variant">
                    I understand this is a demo submission only. It will not create an order, charge a payment method, or arrange shipment.
                  </span>
                </label>
                {errors.demoConfirmation && (
                  <p id="demo-confirmation-error" className="mt-sm font-body-sm text-error" role="alert">
                    {errors.demoConfirmation}
                  </p>
                )}
              </section>

              {Object.values(errors).some(Boolean) && (
                <p role="alert" className="rounded-lg border border-error/30 bg-error/5 p-md font-body-sm text-error">
                  Please correct the highlighted fields and confirm the demo notice before continuing.
                </p>
              )}

              <button type="submit" className="w-full rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase tracking-wider text-white transition-colors hover:bg-espresso sm:w-auto">
                Submit demo review
              </button>
              <Link to="/cart" className="ml-md inline-flex font-label-sm text-[10px] uppercase tracking-wider text-secondary underline">
                Return to cart
              </Link>
            </div>

            <div className="lg:col-span-5">
              <CheckoutOrderSummary lines={lines} totals={totals} />
            </div>
          </div>
        </form>
      </section>
    </>
  )
}
