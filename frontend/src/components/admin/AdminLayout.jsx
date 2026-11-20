import { useState } from 'react'
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Archive,
  Atom,
  FileText,
  FlaskConical,
  Mail,
  Package,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  X,
} from 'lucide-react'
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import useAdminAuth from '../../context/useAdminAuth'

const catalogSections = [
  { label: 'Products', to: '/admin/products', Icon: Package },
  { label: 'Categories', to: '/admin/categories', Icon: Tags },
]
const managementSections = [
  { label: 'Orders', to: '/admin/orders', Icon: ClipboardList },
  { label: 'Customers', to: '/admin/customers', Icon: Users },
  { label: 'Inventory', to: '/admin/inventory', Icon: Archive },
  { label: 'Store Settings', to: '/admin/settings', Icon: Settings },
]
const contentSections = [
  { label: 'About Us', to: '/admin/content/about-us', Icon: FileText },
  { label: 'Our Science', to: '/admin/content/our-science', Icon: Atom },
  { label: 'Ingredient Library', to: '/admin/ingredients', Icon: FlaskConical },
  { label: 'Contact Messages', to: '/admin/contact-messages', Icon: Mail },
]

function AdminSidebar({ admin, onNavigate, onLogout, loggingOut, logoutError }) {
  return (
    <div className="flex h-full flex-col">
      <Link to="/admin/dashboard" className="border-b border-white/10 px-lg py-xl" onClick={onNavigate}>
        <span className="block font-headline text-[20px] tracking-[0.14em] text-white">ZORVELLAE</span>
        <span className="mt-xs block font-label-sm text-[8px] uppercase tracking-wider text-white/60">Admin console</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-md py-lg" aria-label="Admin navigation">
        <NavLink
          to="/admin/dashboard"
          onClick={onNavigate}
          className={({ isActive }) => `flex min-h-11 items-center gap-sm rounded-md px-md font-body-sm ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
        >
          <LayoutDashboard size={17} /> Overview
        </NavLink>
        <p className="mb-sm mt-xl px-md font-label-sm text-[8px] uppercase tracking-[0.16em] text-white/40">
          Catalog
        </p>
        <ul className="space-y-xs">
          {catalogSections.map(({ label, to, Icon }) => (
            <li key={label}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) => `flex min-h-11 items-center gap-sm rounded-md px-md font-body-sm ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={17} /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="mb-sm mt-xl px-md font-label-sm text-[8px] uppercase tracking-[0.16em] text-white/40">
          Management
        </p>
        <ul className="space-y-xs">
          {managementSections.map(({ label, to, Icon }) => (
            <li key={label}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) => `flex min-h-11 items-center gap-sm rounded-md px-md font-body-sm ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={17} /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="mb-sm mt-xl px-md font-label-sm text-[8px] uppercase tracking-[0.16em] text-white/40">
          Content
        </p>
        <ul className="space-y-xs">
          {contentSections.map(({ label, to, Icon }) => (
            <li key={label}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) => `flex min-h-11 items-center gap-sm rounded-md px-md font-body-sm ${isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <Icon size={17} /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {logoutError && <p className="mx-md mb-md font-body-sm text-red-200" role="alert">{logoutError}</p>}
      <div className="border-t border-white/10 p-md">
        <div className="flex items-center gap-sm px-xs py-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10" aria-hidden="true">
            <ShieldCheck size={17} className="text-white" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-body-sm text-white">{admin.name}</p>
            <p className="truncate font-label-sm text-[8px] text-white/55">{admin.email}</p>
          </div>
        </div>
        <button type="button" disabled={loggingOut} onClick={onLogout} className="mt-sm flex min-h-10 w-full items-center gap-sm rounded-md px-md font-label-sm text-[9px] uppercase tracking-wider text-white/75 hover:bg-white/5 hover:text-white disabled:opacity-50">
          <LogOut size={15} /> {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { admin, authStatus, authError, logoutAdmin, retryAdminSession } = useAdminAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  if (authStatus === 'loading') {
    return <main className="min-h-screen px-gutter-mobile py-3xl font-body-md text-on-surface-variant md:px-gutter" role="status">Verifying administrator session…</main>
  }
  if (authStatus === 'error') {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-gutter-mobile py-3xl md:px-gutter">
        <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Admin service unavailable</p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Unable to verify access</h1>
        <p role="alert" className="mt-md font-body-md text-error">{authError?.message || 'Admin authentication is temporarily unavailable.'}</p>
        <button type="button" className="mt-lg underline" onClick={retryAdminSession}>Try again</button>
        <Link to="/admin/login" className="ml-md underline">Admin sign in</Link>
      </main>
    )
  }
  if (authStatus !== 'authenticated' || !admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setLogoutError('')
    try {
      await logoutAdmin()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      setLogoutError(error.message || 'Unable to sign out.')
    } finally {
      setLoggingOut(false)
    }
  }

  const closeMobileNavigation = () => setMobileOpen(false)
  const sectionName = location.pathname.startsWith('/admin/products')
    ? 'Products'
    : location.pathname.startsWith('/admin/categories')
      ? 'Categories'
      : location.pathname.startsWith('/admin/orders')
        ? 'Orders'
        : location.pathname.startsWith('/admin/customers')
          ? 'Customers'
          : location.pathname.startsWith('/admin/inventory')
            ? 'Inventory'
            : location.pathname.startsWith('/admin/settings')
              ? 'Store Settings'
              : location.pathname.startsWith('/admin/content/about-us')
                ? 'About Us'
                : location.pathname.startsWith('/admin/content/our-science')
                  ? 'Our Science'
                  : location.pathname.startsWith('/admin/ingredients')
                    ? 'Ingredient Library'
                    : location.pathname.startsWith('/admin/contact-messages')
                      ? 'Contact Messages'
                      : 'Overview'

  return (
    <div className="min-h-screen bg-surface-container-low lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen bg-primary-container lg:block">
        <AdminSidebar admin={admin} onLogout={handleLogout} loggingOut={loggingOut} logoutError={logoutError} />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-primary/10 bg-surface/95 px-gutter-mobile backdrop-blur md:px-gutter">
          <div className="flex items-center gap-sm">
            <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary/15 lg:hidden" aria-label="Open admin navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
              <Menu size={19} />
            </button>
            <p className="font-label-sm text-[9px] uppercase tracking-[0.14em] text-secondary">Admin / {sectionName}</p>
          </div>
          <div className="flex items-center gap-sm">
            <span className="hidden max-w-48 truncate font-body-sm text-on-surface-variant sm:inline">{admin.name}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/10 bg-white" aria-label="Administrator profile">
              <ShieldCheck size={17} />
            </span>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] px-gutter-mobile py-xl md:px-gutter md:py-2xl">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-primary/45" onClick={closeMobileNavigation} aria-label="Close admin navigation" />
          <aside className="relative h-full w-[min(84vw,320px)] bg-primary-container shadow-drawer" aria-label="Mobile admin navigation">
            <button type="button" className="absolute right-md top-md z-10 inline-flex h-9 w-9 items-center justify-center rounded-md text-white" aria-label="Close admin navigation" onClick={closeMobileNavigation}>
              <X size={19} />
            </button>
            <AdminSidebar admin={admin} onNavigate={closeMobileNavigation} onLogout={handleLogout} loggingOut={loggingOut} logoutError={logoutError} />
          </aside>
        </div>
      )}
    </div>
  )
}
