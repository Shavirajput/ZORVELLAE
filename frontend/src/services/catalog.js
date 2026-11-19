import api from './api'

function getError(error, fallback) {
  if (error?.code === 'ERR_CANCELED') return error

  const message = error?.response?.data?.message
  const catalogError = new Error(
    typeof message === 'string' && message ? message : fallback,
  )
  catalogError.status = error?.response?.status
  return catalogError
}

async function getCatalogData(path, options = {}) {
  try {
    const response = await api.get(path, {
      params: options.params,
      signal: options.signal,
    })
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Catalog data is unavailable.')
    }
    return response.data
  } catch (error) {
    if (error?.code === 'ERR_CANCELED') throw error
    throw getError(error, 'Catalog data is unavailable.')
  }
}

export async function fetchProducts(params = {}, options = {}) {
  const response = await getCatalogData('/products', { params, signal: options.signal })
  if (!Array.isArray(response.data)) {
    throw new Error('The product catalog response is invalid.')
  }
  return { products: response.data, pagination: response.pagination }
}

export async function fetchProductBySlug(slug, options = {}) {
  const response = await getCatalogData(
    `/products/${encodeURIComponent(slug)}`,
    options,
  )
  return response.data
}

export async function fetchCategories(options = {}) {
  const response = await getCatalogData('/categories', options)
  if (!Array.isArray(response.data)) {
    throw new Error('The category catalog response is invalid.')
  }
  return response.data
}

export async function fetchCategoryBySlug(slug, options = {}) {
  const response = await getCatalogData(
    `/categories/${encodeURIComponent(slug)}`,
    options,
  )
  return response.data
}

export function isCatalogRequestCancelled(error) {
  return error?.code === 'ERR_CANCELED'
}
