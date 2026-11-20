import axios from 'axios'
import api from './api'

const ADMIN_ORDER_TIMEOUT_MS = 15000

function toAdminOrderError(error) {
  if (axios.isCancel(error)) return error

  const response = error?.response?.data
  const status = error?.response?.status
  const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
  let message = response?.message

  if (typeof message !== 'string' || !message.trim()) {
    if (status === 401) {
      message = 'Your admin session could not be verified. Sign in again and retry.'
    } else if (status === 403) {
      message = 'You do not have permission to manage orders.'
    } else if (status >= 500) {
      message = 'Order records are temporarily unavailable. Please try again.'
    } else if (timedOut) {
      message = 'The order request timed out. Please try again.'
    } else if (!error?.response) {
      message = 'Unable to connect to the order service. Check your connection and retry.'
    } else {
      message = `The order request failed${status ? ` (${status})` : ''}. Please try again.`
    }
  }

  const orderError = new Error(message)
  orderError.status = status
  orderError.code = error?.code
  orderError.fields = Array.isArray(response?.errors) ? response.errors : []
  return orderError
}

async function request(config) {
  try {
    const response = await api.request(config)
    if (!response.data?.success) {
      const error = new Error(
        response.data?.message || 'Order records are unavailable.',
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
    throw toAdminOrderError(error)
  }
}

export function listAdminOrders(params, signal) {
  return request({
    url: '/admin/orders',
    method: 'GET',
    params,
    signal,
    timeout: ADMIN_ORDER_TIMEOUT_MS,
  })
}

export function getAdminOrder(orderId, signal) {
  return request({
    url: `/admin/orders/${encodeURIComponent(orderId)}`,
    method: 'GET',
    signal,
    timeout: ADMIN_ORDER_TIMEOUT_MS,
  })
}

export function updateAdminOrderStatus(orderId, status) {
  return request({
    url: `/admin/orders/${encodeURIComponent(orderId)}/status`,
    method: 'PATCH',
    data: { status },
    timeout: ADMIN_ORDER_TIMEOUT_MS,
  })
}
