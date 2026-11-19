import axios from 'axios'
import api from './api'

async function request(path, options = {}) {
  try {
    const response = await api.request({
      url: path,
      method: options.method || 'GET',
      data: options.data,
      signal: options.signal,
      headers: options.headers,
      params: options.params,
    })
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Order records are unavailable.')
    }
    return {
      data: response.data.data,
      pagination: response.data.pagination || null,
    }
  } catch (error) {
    if (axios.isCancel(error)) throw error
    const message = error?.response?.data?.message
    const orderError = new Error(
      typeof message === 'string' && message
        ? message
        : 'Order records are temporarily unavailable.',
    )
    orderError.status = error?.response?.status
    orderError.code = error?.code
    throw orderError
  }
}

export const getCustomerOrders = (params, signal) =>
  request('/customer/orders', { params, signal })

export const getCustomerOrder = (orderId, signal) =>
  request(`/customer/orders/${encodeURIComponent(orderId)}`, { signal })
