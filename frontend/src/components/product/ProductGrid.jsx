import ProductCard from './ProductCard'

export default function ProductGrid({ products, className = '', cardVariant = 'default' }) {
  if (!products.length) {
    return (
      <div className="border-y border-outline-variant/50 py-3xl text-center">
        <h2 className="text-headline-md">No formulations found</h2>
        <p className="mt-sm font-body-md text-on-surface-variant">
          Try adjusting your search or filters.
        </p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 gap-x-md gap-y-xl sm:grid-cols-2 sm:gap-x-lg lg:grid-cols-3 ${className}`}>
      {products.map((product) => <ProductCard key={product.id} product={product} variant={cardVariant} />)}
    </div>
  )
}
