import { useState } from 'react'
import FormField from '../components/forms/FormField'
import useShop from '../context/useShop'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function AccountProfilePage() {
  const { customer, updateProfile } = useShop()
  const [values, setValues] = useState({ name: customer.name, email: customer.email })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
    setSaved(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Name is required.'
    if (!values.email.trim()) nextErrors.email = 'Email address is required.'
    else if (!isValidEmail(values.email.trim())) nextErrors.email = 'Enter a valid email address.'

    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setSaving(true)
    setFormError('')
    try {
      const updated = await updateProfile({
        name: values.name.trim(),
        email: values.email.trim(),
      })
      setValues({ name: updated.name, email: updated.email })
      setSaved(true)
    } catch (error) {
      setFormError(error.message || 'Unable to update your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section aria-labelledby="profile-heading">
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Account profile</p>
      <h2 id="profile-heading" className="mt-xs font-headline text-headline-md">Profile details</h2>
      <p className="mt-sm font-body-sm text-on-surface-variant">
        Changes are saved to your account.
      </p>
      <form className="mt-lg max-w-xl space-y-md" onSubmit={handleSubmit} noValidate>
        <FormField id="name" label="Name" value={values.name} onChange={handleChange} error={errors.name} autoComplete="name" />
        <FormField id="email" label="Email address" type="email" value={values.email} onChange={handleChange} error={errors.email} autoComplete="email" />
        {Object.values(errors).some(Boolean) && (
          <p role="alert" className="font-body-sm text-error">Correct the highlighted fields.</p>
        )}
        {formError && <p role="alert" className="font-body-sm text-error">{formError}</p>}
        {saved && <p role="status" className="font-body-sm text-secondary">Profile updated.</p>}
        <button type="submit" disabled={saving} className="rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase tracking-wider text-white hover:bg-espresso disabled:opacity-50">
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </section>
  )
}
