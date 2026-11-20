import { useEffect, useState } from 'react'
import { ArrowRight, Droplet, FlaskConical, Leaf, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductGrid from '../components/product/ProductGrid'
import { fetchProducts, isCatalogRequestCancelled } from '../services/catalog'
import heroEditorial720 from '../assets/home/hero-editorial-720.webp'
import heroEditorial1440 from '../assets/home/hero-editorial-1440.webp'
import stepCleanse480 from '../assets/home/step-cleanse-480.webp'
import stepCleanse960 from '../assets/home/step-cleanse-960.webp'
import stepTreat480 from '../assets/home/step-treat-480.webp'
import stepTreat960 from '../assets/home/step-treat-960.webp'
import stepHydrate480 from '../assets/home/step-hydrate-480.webp'
import stepHydrate960 from '../assets/home/step-hydrate-960.webp'
import stepProtect480 from '../assets/home/step-protect-480.webp'
import stepProtect960 from '../assets/home/step-protect-960.webp'
import scienceEditorial720 from '../assets/home/science-editorial-720.webp'
import scienceEditorial1440 from '../assets/home/science-editorial-1440.webp'

const steps = [
  {
    step: '01',
    title: 'Cleanse',
    copy: 'Purify without compromising the lipid barrier.',
    src: stepCleanse960,
    srcSet: `${stepCleanse480} 480w, ${stepCleanse960} 960w`,
    sizes: '(min-width: 1024px) 320px, (min-width: 640px) 46vw, 100vw',
    alt: 'Fresh herbs arranged on a light surface; illustrative botanical stock photography.',
  },
  {
    step: '02',
    title: 'Treat',
    copy: 'Target cellular pathways with precise bio-actives.',
    src: stepTreat960,
    srcSet: `${stepTreat480} 480w, ${stepTreat960} 960w`,
    sizes: '(min-width: 1024px) 320px, (min-width: 640px) 46vw, 100vw',
    alt: 'A close crop of white cream on a beige surface; illustrative texture stock photo, not a ZORVELLAE formula.',
  },
  {
    step: '03',
    title: 'Hydrate',
    copy: 'Replenish water and lipids for sustained comfort.',
    src: stepHydrate960,
    srcSet: `${stepHydrate480} 480w, ${stepHydrate960} 960w`,
    sizes: '(min-width: 1024px) 320px, (min-width: 640px) 46vw, 100vw',
    alt: 'Gloved hands mixing cream during a formulation process; illustrative stock photography, not a ZORVELLAE product or facility.',
  },
  {
    step: '04',
    title: 'Protect',
    copy: 'Support the skin against daily oxidative stress.',
    src: stepProtect960,
    srcSet: `${stepProtect480} 480w, ${stepProtect960} 960w`,
    sizes: '(min-width: 1024px) 320px, (min-width: 640px) 46vw, 100vw',
    alt: 'Hands smoothing cream over skin against a warm peach backdrop; illustrative skincare ritual stock photo.',
  },
]

const pillars = [
  { number: '01', label: 'Science-led', Icon: FlaskConical },
  { number: '02', label: 'Botanical integrity', Icon: Leaf },
  { number: '03', label: 'Considered formulas', Icon: Droplet },
  { number: '04', label: 'Everyday rituals', Icon: Sparkles },
]

function HomeEditorialImage({
  src,
  srcSet,
  sizes,
  alt,
  fallbackLabel,
  className,
  loading = 'lazy',
  width,
  height,
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} Image unavailable`}
        className={`flex items-center justify-center bg-surface-container-high ${className}`}
      >
        <span className="max-w-[13rem] px-md text-center font-label-sm text-[9px] uppercase tracking-[0.14em] text-secondary">
          {fallbackLabel}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

export default function HomePage() {
  const [featuredResult, setFeaturedResult] = useState({
    attempt: -1,
    products: [],
    error: null,
  })
  const [attempt, setAttempt] = useState(0)
  const isLoading = featuredResult.attempt !== attempt

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchProducts({ limit: 4, sort: 'featured' }, { signal: controller.signal })
      .then(({ products }) => {
        if (active) setFeaturedResult({ attempt, products, error: null })
      })
      .catch((error) => {
        if (!active || isCatalogRequestCancelled(error)) return
        setFeaturedResult({ attempt, products: [], error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [attempt])

  const featuredProducts = isLoading ? [] : featuredResult.products
  const featuredError = isLoading ? null : featuredResult.error

  return (
    <>
      <section className="relative overflow-hidden border-b border-primary/10 bg-surface-container-low">
        <div className="mx-auto grid w-full min-w-0 max-w-canvas items-center xl:min-h-[620px] xl:grid-cols-[1.08fr_0.92fr]">
          <div className="min-w-0 px-gutter-mobile py-2xl sm:px-gutter sm:py-3xl xl:pr-xl">
            <p className="font-label-md text-label-md uppercase tracking-[0.16em] text-secondary">
              Science-led botanical skincare
            </p>
            <h1 className="mt-md w-full min-w-0 max-w-[720px] text-headline-xl-mobile sm:text-[44px] sm:leading-[1.12] xl:text-headline-xl">
              Where Botanical Purity<br className="hidden sm:block" /> Meets <em className="font-normal italic">Clinical Efficacy.</em>
            </h1>
            <p className="mt-lg w-full min-w-0 max-w-[560px] font-body-lg text-on-surface-variant">
              Formulations that unite restorative botanicals with clinically considered actives—created for resilient, balanced skin.
            </p>
            <div className="mt-xl flex min-w-0 flex-col gap-sm sm:flex-row sm:flex-wrap sm:gap-md">
              <Link
                to="/shop"
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-primary px-xl font-label-sm text-[11px] uppercase text-on-primary transition-colors hover:bg-primary-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                Explore formulations
              </Link>
              <Link
                to="/routines/builder"
                className="inline-flex min-h-12 items-center justify-center rounded-sm border border-primary/40 px-xl font-label-sm text-[11px] uppercase text-primary transition-colors hover:border-primary hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
              >
                Build a routine
              </Link>
            </div>
          </div>
          <div
            className="relative aspect-[4/3] overflow-hidden border-y border-primary/10 bg-surface-container-high sm:aspect-[16/9] xl:aspect-square xl:border-y-0 xl:border-l"
          >
            <HomeEditorialImage
              src={heroEditorial1440}
              srcSet={`${heroEditorial720} 720w, ${heroEditorial1440} 1440w`}
              sizes="(min-width: 1280px) 620px, 100vw"
              alt="A pale leafy branch against a warm beige backdrop; botanical editorial stock photography."
              fallbackLabel="Botanical editorial image unavailable"
              width={1440}
              height={1080}
              loading="eager"
              className="absolute inset-0 h-full w-full object-cover object-[62%_center]"
            />
            <div className="pointer-events-none absolute inset-4 border border-primary/15 sm:inset-6 lg:inset-8" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="border-b border-primary/10 bg-surface-container-low">
        <div className="mx-auto grid max-w-canvas grid-cols-2 gap-sm px-gutter-mobile py-lg sm:gap-md md:grid-cols-4 md:px-gutter">
          {pillars.map(({ number, label, Icon }) => (
            <div key={number} className="flex min-h-[84px] items-center gap-sm border border-primary/5 bg-surface-container-lowest px-sm py-md shadow-card sm:gap-md sm:px-md">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-container/70 text-secondary sm:h-10 sm:w-10">
                <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-label-sm text-[9px] uppercase tracking-[0.16em] text-secondary">{number}</p>
                <p className="mt-xs font-label-md text-label-md uppercase leading-snug text-primary">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-canvas px-gutter-mobile py-2xl sm:py-3xl md:px-gutter">
        <div className="flex items-end justify-between gap-lg">
          <div>
            <p className="font-label-md text-label-md uppercase text-secondary">A complete ritual</p>
            <h2 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Shop by formulation step</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-sm font-label-md text-label-md uppercase text-primary transition-colors hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary md:flex">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="mt-xl grid gap-md sm:grid-cols-2 sm:gap-lg lg:grid-cols-4">
          {steps.map((item) => (
            <Link key={item.step} to="/shop" className="group min-w-0 rounded-lg border border-primary/10 bg-surface-container-lowest p-sm transition-shadow hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary sm:p-md">
              <div
                className="relative aspect-[3/2] overflow-hidden bg-surface-container-high p-md sm:p-lg"
              >
                <HomeEditorialImage
                  src={item.src}
                  srcSet={item.srcSet}
                  sizes={item.sizes}
                  alt={item.alt}
                  fallbackLabel={`${item.title} image unavailable`}
                  width={960}
                  height={640}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-3 border border-white/70 sm:inset-4" aria-hidden="true" />
                <span className="absolute left-sm top-sm bg-surface/90 px-sm py-xs font-label-sm text-[8px] uppercase tracking-[0.14em] text-secondary sm:left-md sm:top-md">
                  Step {item.step}
                </span>
              </div>
              <div className="px-xs pb-sm pt-md sm:px-sm sm:pb-md">
                <h3 className="text-headline-md">{item.title}</h3>
                <p className="mt-sm min-h-12 font-body-md text-on-surface-variant">{item.copy}</p>
                <span className="mt-md inline-flex items-center gap-sm font-label-sm text-label-sm uppercase text-primary">
                  Explore <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-low py-2xl">
        <div className="mx-auto max-w-canvas px-gutter-mobile sm:py-sm md:px-gutter">
          <div className="flex items-end justify-between gap-md">
            <div>
              <p className="font-label-md text-label-md uppercase text-secondary">Curated essentials</p>
              <h2 className="mt-sm text-headline-lg-mobile md:text-headline-lg">Featured formulations</h2>
            </div>
            <Link to="/shop" className="hidden items-center gap-sm font-label-md text-label-md uppercase transition-colors hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary md:flex">
              Shop all <ArrowRight size={14} />
            </Link>
          </div>
          {featuredProducts.length > 0 && featuredProducts.every((product) => product.isDemo) && (
            <p className="mt-md font-body-sm text-secondary">Development samples — not available for purchase.</p>
          )}
          <div className="mt-xl">
            {isLoading ? (
              <p role="status" className="py-xl font-body-md text-on-surface-variant">
                Loading featured formulations…
              </p>
            ) : featuredError ? (
              <div role="alert" className="border-y border-outline-variant/50 py-xl">
                <p className="font-body-md text-error">
                  Featured formulations are temporarily unavailable.
                </p>
                <button
                  type="button"
                  className="mt-sm font-label-sm text-[9px] uppercase text-secondary underline"
                  onClick={() => setAttempt((value) => value + 1)}
                >
                  Try again
                </button>
              </div>
            ) : featuredProducts.length === 0 ? (
              <p className="border-y border-outline-variant/50 py-xl font-body-md text-on-surface-variant">
                No formulations are currently available.
              </p>
            ) : (
              <ProductGrid products={featuredProducts} className="lg:grid-cols-4" cardVariant="featured" />
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-canvas lg:grid-cols-2">
        <div
          className="relative aspect-[4/3] overflow-hidden border-y border-primary/10 bg-surface-container-high sm:aspect-[16/9] lg:aspect-[5/4] lg:border-y-0 lg:border-r"
        >
          <HomeEditorialImage
            src={scienceEditorial1440}
            srcSet={`${scienceEditorial720} 720w, ${scienceEditorial1440} 1440w`}
            sizes="(min-width: 1024px) 680px, 100vw"
            alt="A hand uses a dropper above a glass beaker in a softly lit apothecary setting; illustrative stock photography, not a ZORVELLAE facility or test."
            fallbackLabel="Science editorial image unavailable"
            width={1440}
            height={1152}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-4 border border-white/70 sm:inset-8" aria-hidden="true" />
          <p className="absolute bottom-md left-md max-w-[16rem] bg-surface/90 px-sm py-xs font-label-sm text-[9px] uppercase tracking-[0.12em] text-primary sm:bottom-xl sm:left-xl">
            Illustrative stock photo; not a ZORVELLAE facility or test.
          </p>
        </div>
        <div className="flex min-h-[320px] items-center bg-surface px-gutter-mobile py-2xl sm:px-gutter lg:min-h-[520px] lg:px-xl">
          <div className="max-w-lg">
            <p className="font-label-md text-label-md uppercase text-secondary">Our science</p>
            <h2 className="mt-sm text-headline-lg-mobile md:text-headline-lg">
              Formulated with reference, not reinvention.
            </h2>
            <p className="mt-lg font-body-lg text-on-surface-variant">
              Botanical intelligence meets measured formulation: barrier-supporting lipids, targeted actives and transparent rationale.
            </p>
            <Link to="/our-science" className="mt-xl inline-flex items-center gap-sm font-label-md text-label-md uppercase text-primary transition-colors hover:text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-secondary">
              Explore our science <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
