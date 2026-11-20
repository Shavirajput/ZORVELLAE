import axios from 'axios'
import api from './api'

const ADMIN_SETTINGS_TIMEOUT_MS = 15000

function toAdminSettingsError(error) {
  if (axios.isCancel(error)) return error

  const response = error?.response?.data
  const status = error?.response?.status
  const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
  let message = response?.message

  if (typeof message !== 'string' || !message.trim()) {
    if (status === 401) {
      message = 'Your admin session could not be verified. Sign in again and retry.'
    } else if (status === 403) {
      message = 'You do not have permission to change store settings.'
    } else if (status >= 500) {
      message = 'Store settings are temporarily unavailable. Please try again.'
    } else if (timedOut) {
      message = 'The settings request timed out. Please try again.'
    } else if (!error?.response) {
      message = 'Unable to connect to the settings service. Check your connection and retry.'
    } else {
      message = `The settings request failed${status ? ` (${status})` : ''}. Please try again.`
    }
  }

  const settingsError = new Error(message)
  settingsError.status = status
  settingsError.code = error?.code
  settingsError.fields = Array.isArray(response?.errors) ? response.errors : []
  return settingsError
}

async function request(config) {
  try {
    const response = await api.request(config)
    if (!response.data?.success) {
      const error = new Error(
        response.data?.message || 'Store settings are unavailable.',
      )
      error.response = { status: response.status, data: response.data }
      throw error
    }
    return {
      data: response.data.data,
      message: response.data.message || '',
    }
  } catch (error) {
    throw toAdminSettingsError(error)
  }
}

export function getAdminStoreSettings(signal) {
  return request({
    url: '/admin/settings',
    method: 'GET',
    signal,
    timeout: ADMIN_SETTINGS_TIMEOUT_MS,
  })
}

export function updateAdminStoreSettings(data) {
  return request({
    url: '/admin/settings',
    method: 'PUT',
    data,
    timeout: ADMIN_SETTINGS_TIMEOUT_MS,
  })
}
