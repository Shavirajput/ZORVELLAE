import axios from 'axios'
import api from './api'

const ADMIN_INVENTORY_TIMEOUT_MS = 15000

function toAdminInventoryError(error) {
  if (axios.isCancel(error)) return error

  const response = error?.response?.data
  const status = error?.response?.status
  const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
  let message = response?.message

  if (typeof message !== 'string' || !message.trim()) {
    if (status === 401) {
      message = 'Your admin session could not be verified. Sign in again and retry.'
    } else if (status === 403) {
      message = 'You do not have permission to manage inventory.'
    } else if (status >= 500) {
      message = 'Inventory records are temporarily unavailable. Please try again.'
    } else if (timedOut) {
      message = 'The inventory request timed out. Please try again.'
    } else if (!error?.response) {
      message = 'Unable to connect to the inventory service. Check your connection and retry.'
    } else {
      message = `The inventory request failed${status ? ` (${status})` : ''}. Please try again.`
    }
  }

  const inventoryError = new Error(message)
  inventoryError.status = status
  inventoryError.code = error?.code
  inventoryError.fields = Array.isArray(response?.errors) ? response.errors : []
  return inventoryError
}

async function request(config) {
  try {
    const response = await api.request(config)
    if (!response.data?.success) {
      const error = new Error(
        response.data?.message || 'Inventory records are unavailable.',
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
    throw toAdminInventoryError(error)
  }
}

export function listAdminInventory(params, signal) {
  return request({
    url: '/admin/inventory',
    method: 'GET',
    params,
    signal,
    timeout: ADMIN_INVENTORY_TIMEOUT_MS,
  })
}

export function getAdminInventoryHistory(productId, variantId, params, signal) {
  return request({
    url: `/admin/inventory/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}/adjustments`,
    method: 'GET',
    params,
    signal,
    timeout: ADMIN_INVENTORY_TIMEOUT_MS,
  })
}

export function createAdminInventoryAdjustment(productId, variantId, data) {
  return request({
    url: `/admin/inventory/${encodeURIComponent(productId)}/${encodeURIComponent(variantId)}/adjustments`,
    method: 'POST',
    data,
    timeout: ADMIN_INVENTORY_TIMEOUT_MS,
  })
}
