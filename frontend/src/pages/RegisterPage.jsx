import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AccountAuthShell from '../components/account/AccountAuthShell'
import FormField from '../components/forms/FormField'
import useShop from '../context/useShop'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function RegisterPage() {
  const { customer, authStatus, register } = useShop()
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authStatus === 'authenticated' && customer) {
    return <Navigate to="/account" replace />
  }

  const clearFieldError = (event) => {
    const { name } = event.target
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const name = String(formData.get('name') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const confirmation = String(formData.get('confirmPassword') || '')
    const nextErrors = {}

    if (!name) nextErrors.name = 'Name is required.'
    else if (name.length > 80) nextErrors.name = 'Name must be 80 characters or fewer.'
    if (!email) nextErrors.email = 'Email address is required.'
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.'
    else if (email.length > 254) nextErrors.email = 'Email address is too long.'
    if (!password) nextErrors.password = 'Password is required.'
    else if (password.length < 12 || password.length > 128) {
      nextErrors.password = 'Use a password between 12 and 128 characters.'
    }
    if (!confirmation) nextErrors.confirmPassword = 'Confirm your password.'
    else if (password !== confirmation) nextErrors.confirmPassword = 'The passwords do not match.'

    setErrors(nextErrors)
    setFormError('')
    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)
    try {
      await register({ name, email, password })
      form.reset()
      navigate('/account', { replace: true })
    } catch (error) {
      const serverErrors = {}
      error.fields?.forEach(({ field, message }) => {
        if (field) serverErrors[field] = message
      })
      setErrors((current) => ({ ...current, ...serverErrors }))
      setFormError(error.message || 'Unable to create your account right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccountAuthShell eyebrow="Customer account" title="Create an account">
      <form className="mt-lg space-y-md" onSubmit={handleSubmit} noValidate>
        <FormField id="name" label="Name" autoComplete="name" onChange={clearFieldError} error={errors.name} />
        <FormField id="email" label="Email address" type="email" autoComplete="email" onChange={clearFieldError} error={errors.email} />
        <FormField id="password" label="Password (12 characters minimum)" type="password" autoComplete="new-password" onChange={clearFieldError} error={errors.password} />
        <FormField id="confirmPassword" label="Confirm password" type="password" autoComplete="new-password" onChange={clearFieldError} error={errors.confirmPassword} />
        {formError && (
          <p role="alert" className="rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">
            {formError}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase tracking-wider text-white hover:bg-espresso disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-lg font-body-sm text-on-surface-variant">
        Already have an account?{' '}
        <Link to="/login" className="text-secondary underline">Sign in</Link>
      </p>
    </AccountAuthShell>
  )
}
