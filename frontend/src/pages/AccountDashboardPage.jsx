import { Link } from 'react-router-dom'
import useShop from '../context/useShop'

const cards = [
  {
    title: 'Profile details',
    description: 'Review or update the name and email address associated with your account.',
    to: '/account/profile',
    link: 'Manage profile',
  },
  {
    title: 'Saved addresses',
    description: 'Manage saved shipping addresses and your default.',
    to: '/account/addresses',
    link: 'Manage addresses',
  },
  {
    title: 'Order history',
    description: 'Review submitted order records. Temporary demo checkout confirmations are not saved.',
    to: '/account/orders',
    link: 'View order history',
  },
]

export default function AccountDashboardPage() {
  const { customer, savedAddresses } = useShop()

  return (
    <div>
      <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">Account overview</p>
      <h2 className="mt-xs font-headline text-headline-md">Your account</h2>
      <div className="mt-lg grid gap-md sm:grid-cols-2">
        <div className="rounded-lg bg-surface-container-low p-lg">
          <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Email</p>
          <p className="mt-sm break-words font-body-md text-primary">{customer.email}</p>
        </div>
        <div className="rounded-lg bg-surface-container-low p-lg">
          <p className="font-label-sm text-[9px] uppercase tracking-wider text-secondary">Saved addresses</p>
          <p className="mt-sm font-body-md text-primary">{savedAddresses.length}</p>
        </div>
      </div>
      <div className="mt-lg grid gap-md md:grid-cols-3">
        {cards.map(({ title, description, to, link }) => (
          <article key={to} className="flex flex-col rounded-lg border border-primary/10 bg-white p-lg">
            <h3 className="font-headline text-headline-sm">{title}</h3>
            <p className="mt-sm flex-1 font-body-sm text-on-surface-variant">{description}</p>
            <Link to={to} className="mt-lg font-label-sm text-[9px] uppercase tracking-wider text-secondary underline">
              {link}
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
