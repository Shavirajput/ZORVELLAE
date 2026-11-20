import axios from 'axios'
import api from './api'

const CATALOG_LIST_TIMEOUT_MS = 15000

function toCatalogError(error) {
  if (axios.isCancel(error)) return error

  const response = error?.response?.data
  const status = error?.response?.status
  const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
  let message = response?.message

  if (typeof message !== 'string' || !message.trim()) {
    if (status === 401) {
      message = 'Your admin session could not be verified. Sign in again and retry.'
    } else if (status === 403) {
      message = 'You do not have permission to manage the catalog.'
    } else if (status >= 500) {
      message = 'The catalog service is unavailable. Please try again.'
    } else if (timedOut) {
      message = 'The catalog request timed out. Please try again.'
    } else if (!error?.response) {
      message = 'Unable to connect to the catalog service. Check your connection and retry.'
    } else {
      message = `The catalog request failed${status ? ` (${status})` : ''}. Please try again.`
    }
  }

  const catalogError = new Error(
    message,
  )
  catalogError.status = status
  catalogError.code = error?.code
  catalogError.fields = Array.isArray(response?.errors) ? response.errors : []
  return catalogError
}

async function request(config) {
  try {
    const response = await api.request(config)
    if (!response.data?.success) {
      const error = new Error(
        response.data?.message || 'Catalog management is unavailable.',
      )
      error.response = { status: response.status, data: response.data }
      throw error
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination || null,
      message: response.data.message || '',
    }
  } catch (error) {
    throw toCatalogError(error)
  }
}

export function listAdminProducts(params, signal) {
  return request({
    url: '/admin/products',
    method: 'GET',
    params,
    signal,
    timeout: CATALOG_LIST_TIMEOUT_MS,
  })
}

export function getAdminProduct(productId, signal) {
  return request({ url: `/admin/products/${encodeURIComponent(productId)}`, method: 'GET', signal })
}

export function createAdminProduct(data) {
  return request({ url: '/admin/products', method: 'POST', data })
}

export function updateAdminProduct(productId, data) {
  return request({
    url: `/admin/products/${encodeURIComponent(productId)}`,
    method: 'PUT',
    data,
  })
}

export function deleteAdminProduct(productId) {
  return request({
    url: `/admin/products/${encodeURIComponent(productId)}`,
    method: 'DELETE',
  })
}

export function listAdminCategories(params, signal) {
  return request({
    url: '/admin/categories',
    method: 'GET',
    params,
    signal,
    timeout: CATALOG_LIST_TIMEOUT_MS,
  })
}

export async function listAllAdminCategories(signal) {
  const firstPage = await listAdminCategories(
    { page: 1, limit: 100, status: 'all' },
    signal,
  )
  const pages = firstPage.pagination?.pages || 1
  if (pages <= 1) return firstPage.data

  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      listAdminCategories({ page: index + 2, limit: 100, status: 'all' }, signal),
    ),
  )
  return firstPage.data.concat(...remaining.map((page) => page.data))
}

export function getAdminCategory(categoryId, signal) {
  return request({ url: `/admin/categories/${encodeURIComponent(categoryId)}`, method: 'GET', signal })
}

export function createAdminCategory(data) {
  return request({ url: '/admin/categories', method: 'POST', data })
}

export function updateAdminCategory(categoryId, data) {
  return request({
    url: `/admin/categories/${encodeURIComponent(categoryId)}`,
    method: 'PUT',
    data,
  })
}

export function deleteAdminCategory(categoryId) {
  return request({
    url: `/admin/categories/${encodeURIComponent(categoryId)}`,
    method: 'DELETE',
  })
}
