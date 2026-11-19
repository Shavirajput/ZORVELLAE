import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import useShop from '../../context/useShop'

const accountLinks = [
  { label: 'Overview', to: '/account', end: true },
  { label: 'Profile details', to: '/account/profile' },
  { label: 'Saved addresses', to: '/account/addresses' },
  { label: 'Order history', to: '/account/orders' },
]

export default function AccountNavigation() {
  const { logout } = useShop()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLogoutError('')
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      setLogoutError(error.message || 'Unable to sign out right now.')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <nav aria-label="Account navigation" className="min-w-0">
      <div className="hide-scrollbar flex gap-xs overflow-x-auto border-b border-primary/10 pb-md lg:block lg:space-y-xs lg:overflow-visible lg:border-0 lg:pb-0">
        {accountLinks.map(({ label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `inline-flex shrink-0 rounded-md px-md py-sm font-label-sm text-[10px] uppercase tracking-wider transition-colors lg:flex ${
              isActive
                ? 'bg-primary text-white'
                : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
            }`}
          >
            {label}
          </NavLink>
        ))}
      </div>
      {logoutError && <p className="mt-md font-body-sm text-error" role="alert">{logoutError}</p>}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-md px-md py-sm font-label-sm text-[10px] uppercase tracking-wider text-secondary underline disabled:opacity-50 lg:mt-lg"
      >
        {loggingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </nav>
  )
}
