import { Link } from 'react-router-dom'

const columns = [
  {
    title: 'Explore',
    links: [['Shop', '/shop'], ['Routines', '/routines'], ['Skin Concerns', '/skin-concerns']],
  },
  {
    title: 'Discover',
    links: [['Our Science', '/our-science'], ['Ingredients', '/ingredients'], ['About Us', '/about']],
  },
  {
    title: 'Client Care',
    links: [['Contact', '/contact'], ['Account', '/account'], ['Wishlist', '/wishlist']],
  },
]

export default function Footer() {
  return (
    <footer className="bg-primary-container text-inverse-on-surface">
      <div className="mx-auto grid max-w-canvas gap-xl px-gutter-mobile py-xl md:grid-cols-[1.5fr_repeat(3,1fr)] md:px-gutter">
        <div>
          <p className="font-headline text-[24px] tracking-[0.14em] text-white">ZORVELLAE</p>
          <p className="mt-sm max-w-sm font-body-sm text-[13px] leading-relaxed text-inverse-on-surface/70">
            Botanical purity meets clinical efficacy.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="font-label-sm text-label-sm uppercase text-inverse-on-surface/60">{column.title}</p>
            <ul className="mt-md space-y-sm">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="font-body-sm text-inverse-on-surface/80 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-gutter-mobile py-md md:px-gutter">
        <p className="mx-auto max-w-canvas font-label-sm text-[9px] uppercase text-inverse-on-surface/50">
          © ZORVELLAE
        </p>
      </div>
    </footer>
  )
}
