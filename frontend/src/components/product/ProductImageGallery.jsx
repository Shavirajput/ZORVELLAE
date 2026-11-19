import { useState } from 'react'
import { ZoomIn } from 'lucide-react'
import ProductImagePlaceholder from './ProductImagePlaceholder'

const views = ['Product visual', 'Detail visual', 'Scale visual']

export default function ProductImageGallery({ product }) {
  const [activeView, setActiveView] = useState(0)
  const [zoomed, setZoomed] = useState(false)
  const images = product.images || []
  const activeImage = images[activeView] || images[0]

  return (
    <div className="grid gap-md sm:grid-cols-[76px_1fr]">
      <div className="order-2 flex gap-sm overflow-x-auto sm:order-1 sm:flex-col">
        {views.map((view, index) => (
          <button
            type="button"
            key={view}
            className={`w-16 shrink-0 border p-1 text-[9px] uppercase ${
              activeView === index ? 'border-primary' : 'border-outline-variant/50'
            }`}
            aria-label={`Show ${view.toLowerCase()} placeholder`}
            aria-pressed={activeView === index}
            onClick={() => setActiveView(index)}
          >
            {images[index]?.url ? (
              <img
                src={images[index].url}
                alt={images[index].alt || `${product.name} image ${index + 1}`}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <span className="flex aspect-square items-center justify-center bg-surface-container-high text-[8px] text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="order-1 sm:order-2">
        <button
          type="button"
          className={`group relative block w-full cursor-zoom-in overflow-hidden text-left ${zoomed ? 'cursor-zoom-out' : ''}`}
          onClick={() => setZoomed((value) => !value)}
          aria-label={zoomed ? 'Return to standard view' : 'Zoom product image'}
          aria-pressed={zoomed}
        >
          {activeImage?.url ? (
            <img
              src={activeImage.url}
              alt={activeImage.alt || product.name}
              className={`aspect-[4/4.5] w-full object-cover transition-transform duration-300 ${zoomed ? 'scale-110' : ''}`}
            />
          ) : (
            <ProductImagePlaceholder
              product={product}
              viewIndex={activeView}
              className={`aspect-[4/4.5] transition-transform duration-300 ${zoomed ? 'scale-110' : ''}`}
            />
          )}
          <span className="absolute bottom-md right-md flex h-10 w-10 items-center justify-center rounded-full bg-surface text-primary shadow-card">
            <ZoomIn size={18} />
          </span>
        </button>
        <p className="mt-sm text-right font-label-sm text-[8px] uppercase text-secondary">
          {activeImage?.url ? 'Product image' : `${views[activeView]} — development placeholder`}
        </p>
      </div>
    </div>
  )
}
