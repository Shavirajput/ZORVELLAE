import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import { formulations } from '../data/formulations'

const steps = [
  { step: '01', title: 'Cleanse', copy: 'Purify without compromising the lipid barrier.' },
  { step: '02', title: 'Treat', copy: 'Target cellular pathways with precise bio-actives.' },
  { step: '03', title: 'Hydrate', copy: 'Replenish water and lipids for sustained comfort.' },
  { step: '04', title: 'Protect', copy: 'Support the skin against daily oxidative stress.' },
]

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-primary/10 bg-surface-container-low">
        <div className="mx-auto grid min-h-[620px] max-w-canvas items-center md:grid-cols-[1.08fr_0.92fr]">
          <div className="px-gutter-mobile py-3xl md:px-gutter md:pr-xl">
            <p className="font-label-md text-label-md uppercase text-secondary">
              Science-led botanical skincare
            </p>
            <h1 className="mt-md max-w-[720px] text-headline-xl-mobile md:text-headline-xl">
              Where Botanical Purity<br />Meets Clinical Efficacy
            </h1>
            <p className="mt-lg max-w-[560px] font-body-lg text-on-surface-variant">
              Formulations that unite restorative botanicals with clinically considered actives—created for resilient, balanced skin.
            </p>
            <div className="mt-xl flex flex-wrap gap-md">
              <Link
                to="/shop"
                className="inline-flex items-center justify-center rounded-sm bg-primary px-xl py-md font-label-sm text-[11px] uppercase text-on-primary"
              >
                Explore formulations
              </Link>
              <Link
                to="/routine-builder"
                className="inline-flex items-center justify-center rounded-sm border border-primary px-xl py-md font-label-sm text-[11px] uppercase text-primary"
              >
                Build a routine
              </Link>
            </div>
          </div>
          <div className="relative min-h-[360px] bg-[linear-gradient(145deg,#ebe8e2,#d8c2b6)] md:min-h-[620px]">
            <div className="absolute inset-6 border border-white/60">
              <div className="flex h-full items-center justify-center">
                <div className="h-52 w-52 rounded-full border border-primary/20 bg-surface/70 shadow-drawer backdrop-blur-sm">
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <p className="font-label-sm text-label-sm uppercase text-secondary">Development placeholder</p>
                    <p className="mt-sm max-w-36 font-headline text-headline-sm">Approved campaign image</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-primary/10 bg-surface">
        <div className="mx-auto grid max-w-canvas grid-cols-2 divide-x divide-primary/10 md:grid-cols-4">
          {[
            ['01', 'Science-led'],
            ['02', 'Botanical integrity'],
            ['03', 'Considered formulas'],
            ['04', 'Everyday rituals'],
          ].map(([number, label]) => (
            <div key={number} className="px-md py-lg text-center">
              <p className="font-label-sm text-[9px] text-secondary">{number}</p>
              <p className="mt-xs font-label-md text-label-md uppercase text-primary">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-canvas px-gutter-mobile py-2xl md:px-gutter">
        <div className="flex items-end justify-between gap-lg">
          <div>
            <p className="font-label-md text-label-md uppercase text-secondary">A complete ritual</p>
            <h2 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Shop by formulation step</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-sm font-label-md text-label-md uppercase text-primary md:flex">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-xl grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((item) => (
            <Link key={item.step} to="/shop" className="group border-t border-primary/20 pt-lg">
              <p className="font-label-sm text-label-sm text-secondary">Step {item.step}</p>
              <h3 className="mt-lg text-headline-md">{item.title}</h3>
              <p className="mt-sm min-h-12 font-body-md text-on-surface-variant">{item.copy}</p>
              <span className="mt-lg inline-flex items-center gap-sm font-label-sm text-label-sm uppercase text-primary">
                Explore <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low py-2xl">
        <div className="mx-auto max-w-canvas px-gutter-mobile md:px-gutter">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-label-md text-label-md uppercase text-secondary">Curated essentials</p>
              <h2 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Our proven formulations</h2>
            </div>
            <Link to="/shop" className="hidden items-center gap-sm font-label-md text-label-md uppercase md:flex">
              Shop all <ArrowRight size={14} />
            </Link>
          </div>
          <p className="mt-md font-body-sm text-secondary">Development samples — not available for purchase.</p>
          <div className="mt-xl"><ProductGrid products={formulations.slice(0, 4)} className="lg:grid-cols-4" /></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-canvas md:grid-cols-2">
        <div className="min-h-[440px] bg-[linear-gradient(135deg,#d8c2b6,#ebe8e2)]">
          <div className="flex h-full items-center justify-center p-xl">
            <p className="max-w-xs text-center font-headline text-headline-md text-primary">
              Approved botanical formulation photography
            </p>
          </div>
        </div>
        <div className="flex min-h-[440px] items-center bg-surface px-gutter-mobile py-2xl md:px-xl">
          <div className="max-w-lg">
            <p className="font-label-md text-label-md uppercase text-secondary">Our science</p>
            <h2 className="mt-sm text-headline-lg-mobile md:text-headline-lg">
              Formulated with reference, not reinvention.
            </h2>
            <p className="mt-lg font-body-lg text-on-surface-variant">
              Botanical intelligence meets measured formulation: barrier-supporting lipids, targeted actives and transparent rationale.
            </p>
            <Link to="/science" className="mt-xl inline-flex items-center gap-sm font-label-md text-label-md uppercase text-primary">
              Explore our science <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
