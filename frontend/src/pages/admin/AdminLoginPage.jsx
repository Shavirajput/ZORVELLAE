import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import FormField from '../../components/forms/FormField'
import useAdminAuth from '../../context/useAdminAuth'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function AdminLoginPage() {
  const { authStatus, authError, loginAdmin, retryAdminSession } = useAdminAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authStatus === 'authenticated') {
    return <Navigate to="/admin/dashboard" replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const email = values.email.trim().toLowerCase()
    const nextErrors = {}
    if (!email) nextErrors.email = 'Email address is required.'
    else if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.'
    if (!values.password) nextErrors.password = 'Password is required.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.values(nextErrors).some(Boolean)) return

    setSubmitting(true)
    try {
      await loginAdmin({ email, password: values.password })
      setValues({ email: '', password: '' })
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      const fieldErrors = {}
      error.fields?.forEach(({ field, message }) => {
        if (field) fieldErrors[field] = message
      })
      setErrors((current) => ({ ...current, ...fieldErrors }))
      setFormError(error.message || 'Unable to sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-container-low px-gutter-mobile py-2xl md:px-gutter">
      <section className="w-full max-w-md rounded-xl border border-primary/10 bg-white p-lg shadow-card md:p-xl" aria-labelledby="admin-login-heading">
        <Link to="/" className="font-headline text-[22px] tracking-[0.14em] text-primary">
          ZORVELLAE
        </Link>
        <p className="mt-xl font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">
          Restricted administration
        </p>
        <h1 id="admin-login-heading" className="mt-sm text-headline-lg-mobile md:text-headline-lg">
          Admin sign in
        </h1>
        <p className="mt-sm font-body-sm text-on-surface-variant">
          Use an administrator account provisioned by an authorized operator.
        </p>

        {authStatus === 'error' && (
          <div className="mt-lg rounded-md border border-error/30 bg-error/5 p-md">
            <p role="alert" className="font-body-sm text-error">
              {authError?.message || 'Unable to verify the admin session.'}
            </p>
            <button type="button" className="mt-sm font-label-sm text-[9px] uppercase text-secondary underline" onClick={retryAdminSession}>
              Retry session check
            </button>
          </div>
        )}

        <form className="mt-lg space-y-md" onSubmit={handleSubmit} noValidate>
          <FormField
            id="email"
            label="Admin email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="username"
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
          />
          {formError && (
            <p role="alert" className="rounded-md border border-error/30 bg-error/5 p-md font-body-sm text-error">
              {formError}
            </p>
          )}
          <button type="submit" disabled={submitting} className="w-full rounded-md bg-primary px-lg py-md font-label-sm text-[10px] uppercase tracking-wider text-white hover:bg-espresso disabled:opacity-50">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <Link to="/" className="mt-lg inline-flex font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
          Return to storefront
        </Link>
      </section>
    </main>
  )
}
