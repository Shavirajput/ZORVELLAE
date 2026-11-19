import axios from 'axios'
import api from './api'

function getAdminAuthError(error) {
  if (axios.isCancel(error)) return error

  const response = error?.response?.data
  const authError = new Error(
    typeof response?.message === 'string'
      ? response.message
      : 'Admin authentication is temporarily unavailable.',
  )
  authError.status = error?.response?.status
  authError.fields = Array.isArray(response?.errors) ? response.errors : []
  authError.code = error?.code
  return authError
}

async function request(path, options = {}) {
  try {
    const response = await api.request({
      url: path,
      method: options.method || 'GET',
      data: options.data,
      signal: options.signal,
    })
    if (!response.data?.success) {
      throw new Error(
        response.data?.message || 'Admin service is temporarily unavailable.',
      )
    }
    return response.data.data
  } catch (error) {
    if (axios.isCancel(error)) throw error
    throw getAdminAuthError(error)
  }
}

export const loginAdmin = (data) =>
  request('/admin/auth/login', { method: 'POST', data })

export const logoutAdmin = () =>
  request('/admin/auth/logout', { method: 'POST' })

export const getAdminCurrentUser = (signal) =>
  request('/admin/auth/me', { signal })
