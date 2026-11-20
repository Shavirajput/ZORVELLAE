import axios from 'axios'
import api from './api'

const ADMIN_CUSTOMER_TIMEOUT_MS = 15000

function toAdminCustomerError(error) {
  if (axios.isCancel(error)) return error

  const response = error?.response?.data
  const status = error?.response?.status
  const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
  let message = response?.message

  if (typeof message !== 'string' || !message.trim()) {
    if (status === 401) {
      message = 'Your admin session could not be verified. Sign in again and retry.'
    } else if (status === 403) {
      message = 'You do not have permission to manage customers.'
    } else if (status >= 500) {
      message = 'Customer records are temporarily unavailable. Please try again.'
    } else if (timedOut) {
      message = 'The customer request timed out. Please try again.'
    } else if (!error?.response) {
      message = 'Unable to connect to the customer service. Check your connection and retry.'
    } else {
      message = `The customer request failed${status ? ` (${status})` : ''}. Please try again.`
    }
  }

  const customerError = new Error(message)
  customerError.status = status
  customerError.code = error?.code
  customerError.fields = Array.isArray(response?.errors) ? response.errors : []
  return customerError
}

async function request(config) {
  try {
    const response = await api.request(config)
    if (!response.data?.success) {
      const error = new Error(
        response.data?.message || 'Customer records are unavailable.',
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
    throw toAdminCustomerError(error)
  }
}

export function listAdminCustomers(params, signal) {
  return request({
    url: '/admin/customers',
    method: 'GET',
    params,
    signal,
    timeout: ADMIN_CUSTOMER_TIMEOUT_MS,
  })
}

export function getAdminCustomer(customerId, params, signal) {
  return request({
    url: `/admin/customers/${encodeURIComponent(customerId)}`,
    method: 'GET',
    params,
    signal,
    timeout: ADMIN_CUSTOMER_TIMEOUT_MS,
  })
}
