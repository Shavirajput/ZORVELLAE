import axios from 'axios'
import api from './api'

function getAuthError(error) {
  if (axios.isCancel(error)) return error
  if (!error?.response && error?.name === 'Error') return error

  const response = error?.response?.data
  const authError = new Error(
    typeof response?.message === 'string'
      ? response.message
      : 'Authentication service is temporarily unavailable.',
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
      const error = new Error(
        response.data?.message ||
          'Authentication service is temporarily unavailable.',
      )
      error.fields = Array.isArray(response.data?.errors)
        ? response.data.errors
        : []
      throw error
    }
    return response.data.data
  } catch (error) {
    if (axios.isCancel(error)) throw error
    throw getAuthError(error)
  }
}

export const register = (data) =>
  request('/auth/register', { method: 'POST', data })

export const login = (data) =>
  request('/auth/login', { method: 'POST', data })

export const logout = () =>
  request('/auth/logout', { method: 'POST' })

export const getCurrentUser = (signal) =>
  request('/auth/me', { signal })

export const updateCurrentUser = (data) =>
  request('/auth/me', { method: 'PATCH', data })
