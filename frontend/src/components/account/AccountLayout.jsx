import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useShop from '../../context/useShop'
import AccountNavigation from './AccountNavigation'

export default function AccountLayout() {
  const { customer, authStatus, authError, refreshCustomer } = useShop()
  const location = useLocation()

  if (authStatus === 'loading') {
    return (
      <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl md:px-gutter" role="status">
        Loading your account…
      </section>
    )
  }

  if (authStatus === 'error') {
    return (
      <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl md:px-gutter">
        <p className="font-label-md text-label-md uppercase text-secondary">Account unavailable</p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Unable to verify your session</h1>
        <p className="mt-md font-body-md text-on-surface-variant">
          {authError?.message || 'Authentication is temporarily unavailable.'}
        </p>
        <button type="button" className="mt-lg underline" onClick={() => refreshCustomer()}>
          Try again
        </button>
      </section>
    )
  }

  if (!customer) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <section className="mx-auto w-full max-w-canvas px-gutter-mobile py-xl md:px-gutter md:py-2xl">
      <div className="mb-xl border-b border-primary/10 pb-lg">
        <p className="font-label-md text-label-md uppercase text-secondary">Client account / Authenticated session</p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">
          {customer.name ? `Welcome, ${customer.name}` : 'Your account'}
        </h1>
        <p className="mt-sm max-w-2xl font-body-sm text-on-surface-variant">
          Your profile, saved addresses, cart, and wishlist are stored with your account. Explicitly submitted order records appear in your order history.
        </p>
      </div>

      <div className="grid gap-xl lg:grid-cols-[220px_minmax(0,1fr)]">
        <AccountNavigation />
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
