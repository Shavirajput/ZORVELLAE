import axios from 'axios'
import api from './api'

function getCustomerDataError(error) {
  if (axios.isCancel(error)) return error

  const message = error?.response?.data?.message
  const dataError = new Error(
    typeof message === 'string' && message
      ? message
      : 'Your saved customer data is temporarily unavailable.',
  )
  dataError.status = error?.response?.status
  dataError.fields = Array.isArray(error?.response?.data?.errors)
    ? error.response.data.errors
    : []
  dataError.code = error?.code
  return dataError
}

async function request(path, method = 'GET', data, signal) {
  try {
    const response = await api.request({ url: path, method, data, signal })
    if (!response.data?.success) {
      throw new Error(
        response.data?.message ||
          'Your saved customer data is temporarily unavailable.',
      )
    }
    return response.data.data
  } catch (error) {
    if (axios.isCancel(error)) throw error
    if (!error?.response && error?.name === 'Error') throw error
    throw getCustomerDataError(error)
  }
}

export const getCustomerCart = (signal) =>
  request('/customer/cart', 'GET', undefined, signal)

export const addCustomerCartItem = (item) =>
  request('/customer/cart/items', 'POST', item)

export const updateCustomerCartItem = (item) =>
  request('/customer/cart/items', 'PATCH', item)

export const removeCustomerCartItem = (item) =>
  request('/customer/cart/items', 'DELETE', item)

export const clearCustomerCart = () =>
  request('/customer/cart', 'DELETE')

export const getCustomerWishlist = (signal) =>
  request('/customer/wishlist', 'GET', undefined, signal)

export const addCustomerWishlistItem = (productId) =>
  request('/customer/wishlist/items', 'POST', { productId })

export const removeCustomerWishlistItem = (productId) =>
  request(`/customer/wishlist/items/${encodeURIComponent(productId)}`, 'DELETE')

export const getCustomerAddresses = (signal) =>
  request('/customer/addresses', 'GET', undefined, signal)

export const addCustomerAddress = (address) =>
  request('/customer/addresses', 'POST', address)

export const updateCustomerAddress = (addressId, address) =>
  request(`/customer/addresses/${encodeURIComponent(addressId)}`, 'PATCH', address)

export const deleteCustomerAddress = (addressId) =>
  request(`/customer/addresses/${encodeURIComponent(addressId)}`, 'DELETE')

export const setDefaultCustomerAddress = (addressId) =>
  request(
    `/customer/addresses/${encodeURIComponent(addressId)}/default`,
    'PATCH',
  )
