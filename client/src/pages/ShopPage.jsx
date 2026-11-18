import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import ProductGrid from '../components/product/ProductGrid'
import ShopFilterPanel from '../components/product/ShopFilterPanel'
import {
  fetchCategories,
  fetchCategoryBySlug,
  fetchProducts,
  isCatalogRequestCancelled,
} from '../services/catalog'

const EMPTY_CATEGORIES = []
const PAGE_SIZE = 12

export default function ShopPage({ collection = false }) {
  const params = useParams()
  const slug = params.slug || params.category
  const [retryToken, setRetryToken] = useState(0)
  const [categoryListResult, setCategoryListResult] = useState({
    retryToken: -1,
    categories: [],
    error: null,
  })
  const categoriesLoading = categoryListResult.retryToken !== retryToken
  const categories = categoriesLoading ? [] : categoryListResult.categories
  const categoriesError = categoriesLoading ? null : categoryListResult.error
  const categoryRequestKey = collection && slug ? `${slug}:${retryToken}` : ''
  const [categoryResult, setCategoryResult] = useState({
    key: '',
    category: null,
    error: null,
  })
  const categoryLoading =
    collection && Boolean(slug) && categoryResult.key !== categoryRequestKey
  const categoryDetails =
    categoryResult.key === categoryRequestKey ? categoryResult.category : null
  const categoryError =
    categoryResult.key === categoryRequestKey ? categoryResult.error : null
  const [productResult, setProductResult] = useState({
    key: '',
    products: [],
    pagination: null,
    error: null,
  })
  const [categoryFilters, setCategoryFilters] = useState({})
  const filterKey = collection && slug ? slug : 'all'
  const selectedCategories = useMemo(
    () =>
      categoryFilters[filterKey] ??
      (collection && slug ? [slug] : EMPTY_CATEGORIES),
    [categoryFilters, collection, filterKey, slug],
  )
  const [priceBand, setPriceBand] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const productRequestKey = JSON.stringify({
    page,
    priceBand,
    query: query.trim(),
    retryToken,
    selectedCategories,
    sort,
  })
  const productsLoading = productResult.key !== productRequestKey
  const products = productsLoading ? [] : productResult.products
  const pagination = productsLoading ? null : productResult.pagination
  const productsError = productsLoading ? null : productResult.error

  const retryCatalog = () => setRetryToken((value) => value + 1)

  const setSelectedCategories = (value) => {
    setCategoryFilters((filters) => ({ ...filters, [filterKey]: value }))
    setPage(1)
  }

  const changePriceBand = (value) => {
    setPriceBand(value)
    setPage(1)
  }

  const changeQuery = (value) => {
    setQuery(value)
    setPage(1)
  }

  const changeSort = (value) => {
    setSort(value)
    setPage(1)
  }

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchCategories({ signal: controller.signal })
      .then((result) => {
        if (active) {
          setCategoryListResult({
            retryToken,
            categories: result,
            error: null,
          })
        }
      })
      .catch((error) => {
        if (!active || isCatalogRequestCancelled(error)) return
        setCategoryListResult({ retryToken, categories: [], error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [retryToken])

  useEffect(() => {
    if (!collection || !slug) {
      return undefined
    }

    const controller = new AbortController()
    let active = true

    fetchCategoryBySlug(slug, { signal: controller.signal })
      .then((result) => {
        if (active) {
          setCategoryResult({ key: categoryRequestKey, category: result, error: null })
        }
      })
      .catch((error) => {
        if (!active || isCatalogRequestCancelled(error)) return
        setCategoryResult({ key: categoryRequestKey, category: null, error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [categoryRequestKey, collection, retryToken, slug])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const queryParams = {
      page,
      limit: PAGE_SIZE,
      sort,
      priceBand,
    }
    if (selectedCategories.length > 0) {
      queryParams.category = selectedCategories.join(',')
    }
    if (query.trim()) queryParams.search = query.trim()

    fetchProducts(queryParams, { signal: controller.signal })
      .then((result) => {
        if (!active) return
        setProductResult({
          key: productRequestKey,
          products: result.products,
          pagination: result.pagination,
          error: null,
        })
      })
      .catch((error) => {
        if (!active || isCatalogRequestCancelled(error)) return
        setProductResult({
          key: productRequestKey,
          products: [],
          pagination: null,
          error,
        })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [page, priceBand, productRequestKey, query, retryToken, selectedCategories, sort])

  useEffect(() => {
    if (!filtersOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setFiltersOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [filtersOpen])

  if (collection && categoryLoading) {
    return (
      <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl md:px-gutter" role="status">
        Loading collection…
      </section>
    )
  }

  if (collection && (categoryError || !categoryDetails)) {
    const notFound = categoryError?.status === 404 || !slug
    return (
      <section className="mx-auto max-w-canvas px-gutter-mobile py-3xl md:px-gutter">
        <p className="font-label-md text-label-md uppercase text-secondary">
          {notFound ? 'Collection unavailable' : 'Catalog unavailable'}
        </p>
        <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">
          {notFound ? 'No collection found' : 'Unable to load this collection'}
        </h1>
        {!notFound && (
          <button type="button" className="mt-lg underline" onClick={retryCatalog}>
            Try again
          </button>
        )}
        <Link to="/shop" className="mt-lg inline-flex underline">
          Browse all development samples
        </Link>
      </section>
    )
  }

  const routeCategory = collection ? categoryDetails : null
  const title = routeCategory?.name || 'The Complete Formulation Collection'
  const description =
    routeCategory?.description ||
    'Browse development-only sample listings. Final product descriptions, approved imagery, ingredient details, and retail information are pending.'

  return (
    <>
      <div className="border-b border-primary/10 bg-surface-container-low px-gutter-mobile py-sm md:px-gutter">
        <div className="mx-auto max-w-canvas font-label-sm text-[9px] uppercase tracking-wider text-on-surface-variant">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-sm">/</span>
          <Link to="/shop" className="hover:text-primary">Shop</Link>
          {routeCategory && <><span className="mx-sm">/</span><span className="text-primary">{routeCategory.name}</span></>}
        </div>
      </div>

      <section className="mx-auto max-w-canvas px-gutter-mobile pb-3xl pt-2xl md:px-gutter">
        <div className="relative overflow-hidden border border-primary/10 bg-surface-container-low px-lg py-xl md:px-xl md:py-2xl">
          {routeCategory?.bannerImage && (
            <img
              src={routeCategory.bannerImage}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20"
            />
          )}
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-secondary/20 md:right-10" />
          <div className="relative max-w-3xl">
            <p className="font-label-md text-label-md uppercase text-secondary">Development catalog / Not for sale</p>
            <h1 className="mt-sm text-headline-lg-mobile md:text-headline-lg">{title}</h1>
            <p className="mt-md max-w-2xl font-body-md text-on-surface-variant">{description}</p>
            <p className="mt-md font-label-sm text-[9px] uppercase tracking-wider text-secondary">
              All products and prices shown are demonstration data only. No orders are processed.
            </p>
          </div>
          {!routeCategory?.bannerImage && (
            <div className="absolute bottom-0 right-0 hidden w-[25%] border-l border-t border-primary/10 bg-surface/40 px-lg py-md text-right font-label-sm text-[8px] uppercase text-secondary md:block">
              Development collection banner placeholder
            </div>
          )}
        </div>

        <nav className="hide-scrollbar mt-lg flex gap-sm overflow-x-auto pb-xs" aria-label="Formulation categories">
          <Link
            to="/shop"
            className={`shrink-0 rounded-sm px-md py-sm font-label-sm text-[9px] uppercase ${
              !routeCategory ? 'bg-primary text-on-primary' : 'border border-outline-variant/60 text-primary'
            }`}
          >
            All formulations
          </Link>
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/shop/category/${category.slug}`}
              className={`shrink-0 rounded-sm px-md py-sm font-label-sm text-[9px] uppercase ${
                routeCategory?.slug === category.slug ? 'bg-primary text-on-primary' : 'border border-outline-variant/60 text-primary'
              }`}
            >
              {category.name}
            </Link>
          ))}
        </nav>
        {categoriesLoading && (
          <p className="mt-sm font-label-sm text-[9px] uppercase text-secondary" role="status">
            Loading categories…
          </p>
        )}
        {categoriesError && (
          <p className="mt-sm font-body-sm text-error" role="alert">
            Category options could not be loaded.{' '}
            <button type="button" className="underline" onClick={retryCatalog}>Try again</button>
          </p>
        )}

        <div className="mt-xl flex flex-col gap-md border-b border-primary/10 pb-md sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 items-center gap-sm border border-outline-variant/70 bg-surface px-md sm:max-w-sm sm:flex-1">
            <Search size={16} className="text-secondary" />
            <span className="sr-only">Search formulations</span>
            <input
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Search formulations"
              className="w-full border-0 bg-transparent p-0 text-body-sm focus:ring-0"
            />
          </label>
          <div className="flex items-center justify-between gap-md sm:justify-end">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex min-h-10 items-center gap-sm border border-outline-variant/70 px-md font-label-sm text-[9px] uppercase lg:hidden"
            >
              <SlidersHorizontal size={14} /> Filters
            </button>
            <label className="flex items-center gap-sm font-label-sm text-[9px] uppercase text-secondary">
              Sort by
              <select value={sort} onChange={(event) => changeSort(event.target.value)} className="border-outline-variant/70 bg-surface py-sm pl-sm pr-8 font-body-sm text-primary">
                <option value="featured">Featured</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-xl grid gap-xl lg:grid-cols-[220px_minmax(0,1fr)]">
          <ShopFilterPanel
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            priceBand={priceBand}
            onPriceBandChange={changePriceBand}
          />
          <div>
            {!productsLoading && !productsError && pagination && (
              <p className="mb-md font-label-sm text-[9px] uppercase tracking-wider text-secondary" aria-live="polite">
                Showing {products.length} of {pagination.total} development samples
              </p>
            )}
            {productsLoading ? (
              <p className="border-y border-outline-variant/50 py-3xl text-center font-body-md" role="status">
                Loading formulations…
              </p>
            ) : productsError ? (
              <div className="border-y border-outline-variant/50 py-3xl text-center" role="alert">
                <h2 className="text-headline-md">Unable to load formulations</h2>
                <p className="mt-sm font-body-md text-on-surface-variant">{productsError.message}</p>
                <button type="button" className="mt-lg underline" onClick={retryCatalog}>Try again</button>
              </div>
            ) : (
              <>
                <ProductGrid products={products} />
                {pagination?.pages > 1 && (
                  <nav className="mt-xl flex items-center justify-center gap-md" aria-label="Product pages">
                    <button
                      type="button"
                      className="min-h-10 border border-outline-variant/70 px-md font-label-sm text-[9px] uppercase disabled:opacity-40"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      Previous
                    </button>
                    <span className="font-label-sm text-[9px] uppercase" aria-live="polite">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      type="button"
                      className="min-h-10 border border-outline-variant/70 px-md font-label-sm text-[9px] uppercase disabled:opacity-40"
                      disabled={page >= pagination.pages}
                      onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))}
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {filtersOpen && (
        <ShopFilterPanel
          categories={categories}
          drawer
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          priceBand={priceBand}
          onPriceBandChange={changePriceBand}
          onClose={() => setFiltersOpen(false)}
        />
      )}
    </>
  )
}
