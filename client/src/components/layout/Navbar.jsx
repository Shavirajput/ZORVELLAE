import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import useShop from '../../context/useShop'

const links = [
  ['Shop', '/shop'],
  ['Skin Concerns', '/skin-concerns'],
  ['Routines', '/routines'],
  ['Ingredients', '/ingredients'],
  ['Our Science', '/science'],
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount, wishlist, customer } = useShop()

  return (
    <header className="sticky top-0 z-40 border-b border-primary/10 bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-canvas items-center justify-between px-gutter-mobile md:px-gutter">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center lg:hidden"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link to="/" className="min-w-0 text-center lg:text-left" aria-label="ZORVELLAE home">
          <span className="block font-headline text-[24px] leading-none tracking-[0.14em] text-primary">
            ZORVELLAE
          </span>
          <span className="mt-1 block font-label-sm text-[8px] uppercase text-secondary">
            Science-led skincare
          </span>
        </Link>

        <nav className="hidden items-center gap-lg lg:flex" aria-label="Primary navigation">
          {links.map(([label, href]) => (
            <Link
              key={href}
              to={href}
              className="font-label-md text-[12px] uppercase text-on-surface-variant transition-colors hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-sm">
          <Link to="/shop" className="hidden h-10 w-10 items-center justify-center sm:inline-flex" aria-label="Search formulations">
            <Search size={18} />
          </Link>
          <Link to="/wishlist" className="relative inline-flex h-10 w-10 items-center justify-center" aria-label={`Wishlist, ${wishlist.length} saved items`}>
            <Heart size={18} />
            {wishlist.length > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-white">{wishlist.length}</span>}
          </Link>
          <Link
            to={customer ? '/account' : '/login'}
            className="inline-flex h-10 w-10 items-center justify-center"
            aria-label={customer ? `Client account for ${customer.email}` : 'Sign in to client account'}
          >
            <UserRound size={18} />
          </Link>
          <Link to="/cart" className="relative inline-flex h-10 w-10 items-center justify-center" aria-label={`Open formulation dossier, ${cartCount} items`}>
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] text-white">{cartCount}</span>}
          </Link>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-primary/10 bg-surface px-gutter-mobile py-lg lg:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-md">
            {links.map(([label, href]) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-outline-variant/40 py-sm font-headline text-headline-sm"
              >
                {label}
              </Link>
            ))}
            <Link
              to={customer ? '/account' : '/login'}
              onClick={() => setMenuOpen(false)}
              className="border-b border-outline-variant/40 py-sm font-headline text-headline-sm"
            >
              {customer ? 'Client account' : 'Sign in'}
            </Link>
            {!customer && (
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="border-b border-outline-variant/40 py-sm font-headline text-headline-sm"
              >
                Create an account
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
