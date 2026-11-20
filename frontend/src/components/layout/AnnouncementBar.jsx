import { Link } from 'react-router-dom'

export default function AnnouncementBar() {
  return (
    <div className="border-b border-primary/5 bg-secondary-container/60 px-gutter-mobile py-space-xs sm:px-gutter">
      <div className="mx-auto grid w-full min-w-0 max-w-canvas grid-cols-1 items-center sm:grid-cols-[1fr_auto_1fr]">
        <span className="hidden sm:block" aria-hidden="true" />
        <p className="min-w-0 max-w-full text-center font-label-sm text-label-sm uppercase leading-tight tracking-[0.12em] text-primary sm:tracking-[0.15em]">
          Thoughtful skincare. Science-led formulations.
        </p>
        <Link
          to="/contact"
          className="hidden justify-self-end font-label-sm text-[9px] uppercase tracking-[0.12em] text-primary underline-offset-4 transition-colors hover:text-secondary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary sm:inline-flex"
        >
          Contact us
        </Link>
      </div>
    </div>
  )
}
