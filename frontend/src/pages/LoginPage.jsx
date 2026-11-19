import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AccountAuthShell from '../components/account/AccountAuthShell'
import FormField from '../components/forms/FormField'
import useShop from '../context/useShop'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const { customer, authStatus, login } = useShop()
  const location = useLocation()
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
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const nextErrors = {}

    if (!email) nextErrors.email = 'Email address is required.'
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Password is required.'

    setErrors(nextErrors)
    setFormError('')
    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)
    try {
      await login({ email, password })
      form.reset()
      const returnTo = location.state?.from
      navigate(
        typeof returnTo === 'string' && returnTo.startsWith('/account')
          ? returnTo
          : '/account',
        { replace: true },
      )
    } catch (error) {
      const serverErrors = {}
      error.fields?.forEach(({ field, message }) => {
        if (field) serverErrors[field] = message
      })
      setErrors((current) => ({ ...current, ...serverErrors }))
      setFormError(error.message || 'Unable to sign in right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AccountAuthShell eyebrow="Customer account" title="Sign in">
      <form className="mt-lg space-y-md" onSubmit={handleSubmit} noValidate>
        <FormField
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          onChange={clearFieldError}
          error={errors.email}
        />
        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          onChange={clearFieldError}
          error={errors.password}
        />
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
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-lg font-body-sm text-on-surface-variant">
        New to ZORVELLAE?{' '}
        <Link to="/register" className="text-secondary underline">Create an account</Link>
      </p>
    </AccountAuthShell>
  )
}
