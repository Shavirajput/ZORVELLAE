import { Outlet } from 'react-router-dom'
import AnnouncementBar from '../components/layout/AnnouncementBar'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import useShop from '../context/useShop'

export default function MainLayout() {
  const { customerDataError, clearCustomerDataError } = useShop()

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">
        {customerDataError && (
          <div
            className="flex flex-wrap items-center justify-between gap-sm border-b border-error/30 bg-error/5 px-gutter-mobile py-sm font-body-sm text-error md:px-gutter"
            role="alert"
          >
            <p>{customerDataError}</p>
            <button type="button" className="underline" onClick={clearCustomerDataError}>
              Dismiss
            </button>
          </div>
        )}
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
