import { useEffect, useState } from 'react'
import FormField from '../../components/forms/FormField'
import {
  getAdminStoreSettings,
  updateAdminStoreSettings,
} from '../../services/adminStoreSettings'

function emptySettings() {
  return {
    storeName: '',
    storeLogoUrl: '',
    supportEmail: '',
    supportPhone: '',
    storeAddress: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
    },
    currencyCode: '',
    taxConfiguration: {
      enabled: false,
      ratePercent: '',
      isInclusive: false,
    },
    shippingConfiguration: {
      enabled: false,
      flatRate: '',
    },
    checkoutConfiguration: {
      enabled: null,
      allowGuestCheckout: null,
    },
  }
}

function normalizeSettings(settings) {
  const empty = emptySettings()
  return {
    storeName: settings?.storeName || '',
    storeLogoUrl: settings?.storeLogoUrl || '',
    supportEmail: settings?.supportEmail || '',
    supportPhone: settings?.supportPhone || '',
    storeAddress: {
      ...empty.storeAddress,
      ...(settings?.storeAddress || {}),
    },
    currencyCode: settings?.currencyCode || '',
    taxConfiguration: {
      ...empty.taxConfiguration,
      ...(settings?.taxConfiguration || {}),
      ratePercent: settings?.taxConfiguration?.ratePercent == null
        ? ''
        : String(settings.taxConfiguration.ratePercent),
    },
    shippingConfiguration: {
      ...empty.shippingConfiguration,
      ...(settings?.shippingConfiguration || {}),
      flatRate: settings?.shippingConfiguration?.flatRate == null
        ? ''
        : String(settings.shippingConfiguration.flatRate),
    },
    checkoutConfiguration: {
      ...empty.checkoutConfiguration,
      ...(settings?.checkoutConfiguration || {}),
    },
  }
}

function toPayload(values) {
  const optionalAmount = (value) => value.trim() === '' ? null : Number(value)
  return {
    ...values,
    currencyCode: values.currencyCode.trim().toUpperCase(),
    taxConfiguration: {
      ...values.taxConfiguration,
      ratePercent: optionalAmount(values.taxConfiguration.ratePercent),
    },
    shippingConfiguration: {
      ...values.shippingConfiguration,
      flatRate: optionalAmount(values.shippingConfiguration.flatRate),
    },
  }
}

function FieldError({ error }) {
  return error
    ? <p className="mt-xs font-body-sm text-error" role="alert">{error}</p>
    : null
}

function SectionHeading({ id, eyebrow, title, description }) {
  return (
    <div className="mb-lg">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">{eyebrow}</p>
      <h2 id={id} className="mt-xs font-headline text-headline-sm">{title}</h2>
      {description && <p className="mt-xs max-w-3xl font-body-sm text-on-surface-variant">{description}</p>}
    </div>
  )
}

function AmountField({ id, label, value, onChange, error, max }) {
  return (
    <div>
      <label htmlFor={id} className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider text-on-surface">{label}</label>
      <input
        id={id}
        type="number"
        min="0"
        max={max}
        step="0.01"
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-surface-container-low px-md py-sm font-body-md text-on-surface focus:border-secondary focus:bg-white focus:outline-none ${error ? 'border-error' : 'border-transparent'}`}
      />
      <FieldError error={error} />
    </div>
  )
}

function BooleanSetting({ id, label, value, onChange }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-sm font-body-sm text-on-surface">
      <input
        id={id}
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  )
}

function OptionalBooleanSetting({ id, label, value, onChange }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-xs block font-label-sm text-[9px] uppercase tracking-wider text-on-surface">{label}</span>
      <select
        id={id}
        value={value === null ? '' : String(value)}
        onChange={(event) => onChange(event.target.value === '' ? null : event.target.value === 'true')}
        className="min-h-11 w-full rounded-lg border border-transparent bg-surface-container-low px-md font-body-md text-on-surface focus:border-secondary focus:bg-white focus:outline-none"
      >
        <option value="">Unconfigured</option>
        <option value="true">Enabled</option>
        <option value="false">Disabled</option>
      </select>
    </label>
  )
}

function cloneSettings(settings) {
  return {
    ...settings,
    storeAddress: { ...settings.storeAddress },
    taxConfiguration: { ...settings.taxConfiguration },
    shippingConfiguration: { ...settings.shippingConfiguration },
    checkoutConfiguration: { ...settings.checkoutConfiguration },
  }
}

export default function AdminStoreSettingsPage() {
  const [values, setValues] = useState(emptySettings)
  const [savedValues, setSavedValues] = useState(emptySettings)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    getAdminStoreSettings(controller.signal)
      .then(({ data }) => {
        if (!active) return
        if (!data || typeof data !== 'object') {
          throw new Error('The settings service returned an invalid response.')
        }
        const normalized = normalizeSettings(data)
        setValues(normalized)
        setSavedValues(cloneSettings(normalized))
        setLoaded(true)
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED') return
        setLoadingError(error.message || 'Unable to load store settings.')
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [loadAttempt])

  const clearFeedback = () => {
    setNotice('')
    setSaveError('')
  }

  const updateValue = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    clearFeedback()
  }

  const updateNested = (section, field, value) => {
    setValues((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value },
    }))
    setFieldErrors((current) => ({
      ...current,
      [`${section}.${field}`]: undefined,
    }))
    clearFeedback()
  }

  const updateAddress = (field, value) => {
    setValues((current) => ({
      ...current,
      storeAddress: { ...current.storeAddress, [field]: value },
    }))
    setFieldErrors((current) => ({
      ...current,
      [`storeAddress.${field}`]: undefined,
    }))
    clearFeedback()
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setSaveError('')
    setNotice('')
    setFieldErrors({})
    try {
      const response = await updateAdminStoreSettings(toPayload(values))
      const normalized = normalizeSettings(response.data)
      setValues(normalized)
      setSavedValues(cloneSettings(normalized))
      setNotice(response.message || 'Store settings saved.')
    } catch (error) {
      setSaveError(error.message || 'Unable to save store settings.')
      setFieldErrors(
        Object.fromEntries((error.fields || []).map(({ field, message }) => [field, message])),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setValues(cloneSettings(savedValues))
    setFieldErrors({})
    setSaveError('')
    setNotice('Unsaved changes discarded.')
  }

  if (!loaded && !loadingError) {
    return <p className="rounded-lg border border-primary/10 bg-white p-lg font-body-sm text-on-surface-variant" role="status">Loading store settings…</p>
  }

  if (loadingError) {
    return (
      <section aria-labelledby="store-settings-heading">
        <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Store configuration</p>
        <h1 id="store-settings-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Store Settings</h1>
        <div className="mt-lg rounded-lg border border-error/30 bg-error/5 p-lg">
          <p role="alert" className="font-body-sm text-error">{loadingError}</p>
          <button type="button" onClick={() => { setLoaded(false); setLoadingError(''); setLoadAttempt((value) => value + 1) }} className="mt-sm font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">Try again</button>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="store-settings-heading">
      <div>
        <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Store configuration</p>
        <h1 id="store-settings-heading" className="mt-xs text-headline-lg-mobile md:text-headline-lg">Store Settings</h1>
        <p className="mt-sm max-w-3xl font-body-sm text-on-surface-variant">
          Configure store details and future checkout settings. Tax and shipping values are saved as configuration only; they do not affect checkout totals, payment, shipping rates, or storefront behavior.
        </p>
      </div>

      {notice && <p className="mt-lg rounded-md border border-secondary/20 bg-secondary-container/20 p-md font-body-sm" role="status">{notice}</p>}
      {saveError && <p className="mt-lg rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error" role="alert">{saveError}</p>}

      <form className="mt-lg space-y-lg" onSubmit={handleSave} noValidate>
        <fieldset disabled={saving} className="space-y-lg disabled:opacity-70">
          <section className="rounded-lg border border-primary/10 bg-white p-md md:p-lg" aria-labelledby="store-identity-heading">
            <SectionHeading id="store-identity-heading" eyebrow="Store profile" title="Identity and support" description="Leave fields blank if the business has not provided the information yet." />
            <div className="grid gap-md md:grid-cols-2">
              <FormField id="storeName" label="Store name" required={false} value={values.storeName} onChange={(event) => updateValue('storeName', event.target.value)} error={fieldErrors.storeName} />
              <FormField id="storeLogoUrl" label="Store logo HTTPS URL" required={false} type="url" value={values.storeLogoUrl} onChange={(event) => updateValue('storeLogoUrl', event.target.value)} error={fieldErrors.storeLogoUrl} />
              <FormField id="supportEmail" label="Support email" required={false} type="email" autoComplete="email" value={values.supportEmail} onChange={(event) => updateValue('supportEmail', event.target.value)} error={fieldErrors.supportEmail} />
              <FormField id="supportPhone" label="Support phone" required={false} type="tel" autoComplete="tel" value={values.supportPhone} onChange={(event) => updateValue('supportPhone', event.target.value)} error={fieldErrors.supportPhone} />
              <FormField id="currencyCode" label="Currency code" required={false} value={values.currencyCode} onChange={(event) => updateValue('currencyCode', event.target.value.toUpperCase())} error={fieldErrors.currencyCode} />
            </div>
            <div className="mt-lg">
              <h3 className="font-label-sm text-[9px] uppercase tracking-wider text-on-surface">Store address</h3>
              <div className="mt-md grid gap-md md:grid-cols-2">
                <FormField id="storeAddress.addressLine1" label="Address line 1" required={false} value={values.storeAddress.addressLine1} onChange={(event) => updateAddress('addressLine1', event.target.value)} error={fieldErrors['storeAddress.addressLine1']} />
                <FormField id="storeAddress.addressLine2" label="Address line 2" required={false} value={values.storeAddress.addressLine2} onChange={(event) => updateAddress('addressLine2', event.target.value)} error={fieldErrors['storeAddress.addressLine2']} />
                <FormField id="storeAddress.city" label="City" required={false} value={values.storeAddress.city} onChange={(event) => updateAddress('city', event.target.value)} error={fieldErrors['storeAddress.city']} />
                <FormField id="storeAddress.region" label="State, province, or region" required={false} value={values.storeAddress.region} onChange={(event) => updateAddress('region', event.target.value)} error={fieldErrors['storeAddress.region']} />
                <FormField id="storeAddress.postalCode" label="Postal code" required={false} value={values.storeAddress.postalCode} onChange={(event) => updateAddress('postalCode', event.target.value)} error={fieldErrors['storeAddress.postalCode']} />
                <FormField id="storeAddress.country" label="Country" required={false} value={values.storeAddress.country} onChange={(event) => updateAddress('country', event.target.value)} error={fieldErrors['storeAddress.country']} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-primary/10 bg-white p-md md:p-lg" aria-labelledby="tax-settings-heading">
            <SectionHeading id="tax-settings-heading" eyebrow="Tax" title="Tax configuration" description="No tax rate is prefilled. Saved tax settings are not applied to checkout in this milestone." />
            <BooleanSetting id="taxConfiguration.enabled" label="Enable tax configuration" value={values.taxConfiguration.enabled} onChange={(value) => updateNested('taxConfiguration', 'enabled', value)} />
            <div className="grid gap-md md:grid-cols-2">
              <AmountField id="taxConfiguration.ratePercent" label="Tax rate (%)" max="100" value={values.taxConfiguration.ratePercent} onChange={(event) => updateNested('taxConfiguration', 'ratePercent', event.target.value)} error={fieldErrors['taxConfiguration.ratePercent']} />
              <BooleanSetting id="taxConfiguration.isInclusive" label="Tax-inclusive pricing (configuration only)" value={values.taxConfiguration.isInclusive} onChange={(value) => updateNested('taxConfiguration', 'isInclusive', value)} />
            </div>
            <FieldError error={fieldErrors['taxConfiguration.enabled']} />
          </section>

          <section className="rounded-lg border border-primary/10 bg-white p-md md:p-lg" aria-labelledby="shipping-settings-heading">
            <SectionHeading id="shipping-settings-heading" eyebrow="Shipping" title="Shipping configuration" description="No shipping amount is prefilled. These values are stored only; no shipping-rate calculation or delivery estimate is performed." />
            <BooleanSetting id="shippingConfiguration.enabled" label="Enable shipping configuration" value={values.shippingConfiguration.enabled} onChange={(value) => updateNested('shippingConfiguration', 'enabled', value)} />
            <div className="mt-md max-w-md">
              <AmountField id="shippingConfiguration.flatRate" label="Flat shipping amount" value={values.shippingConfiguration.flatRate} onChange={(event) => updateNested('shippingConfiguration', 'flatRate', event.target.value)} error={fieldErrors['shippingConfiguration.flatRate']} />
            </div>
            <FieldError error={fieldErrors['shippingConfiguration.enabled']} />
          </section>

          <section className="rounded-lg border border-primary/10 bg-white p-md md:p-lg" aria-labelledby="checkout-settings-heading">
            <SectionHeading id="checkout-settings-heading" eyebrow="Checkout" title="Checkout configuration" description="These optional preferences are stored for future use and do not alter the current demo checkout." />
            <div className="grid gap-md md:grid-cols-2">
              <OptionalBooleanSetting id="checkoutConfiguration.enabled" label="Checkout enabled" value={values.checkoutConfiguration.enabled} onChange={(value) => updateNested('checkoutConfiguration', 'enabled', value)} />
              <OptionalBooleanSetting id="checkoutConfiguration.allowGuestCheckout" label="Guest checkout" value={values.checkoutConfiguration.allowGuestCheckout} onChange={(value) => updateNested('checkoutConfiguration', 'allowGuestCheckout', value)} />
            </div>
          </section>
        </fieldset>

        <div className="flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
          <button type="button" disabled={saving} onClick={handleCancel} className="min-h-11 rounded-md border border-primary/20 px-lg font-label-sm text-[9px] uppercase tracking-wider text-primary disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving} className="min-h-11 rounded-md bg-primary px-lg font-label-sm text-[9px] uppercase tracking-wider text-white disabled:opacity-50">
            {saving ? 'Saving settings…' : 'Save settings'}
          </button>
        </div>
      </form>
    </section>
  )
}
