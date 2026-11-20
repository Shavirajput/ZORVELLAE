import axios from 'axios'
import api from './api'

const ADMIN_CONTENT_TIMEOUT_MS = 15000

function toAdminContentError(error) {
  if (axios.isCancel(error)) return error

  const response = error?.response?.data
  const status = error?.response?.status
  const timedOut = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT'
  let message = response?.message

  if (typeof message !== 'string' || !message.trim()) {
    if (status === 401) {
      message = 'Your admin session could not be verified. Sign in again and retry.'
    } else if (status === 403) {
      message = 'You do not have permission to manage content.'
    } else if (status >= 500) {
      message = 'Content records are temporarily unavailable. Please try again.'
    } else if (timedOut) {
      message = 'The content request timed out. Please try again.'
    } else if (!error?.response) {
      message = 'Unable to connect to the content service. Check your connection and retry.'
    } else {
      message = `The content request failed${status ? ` (${status})` : ''}. Please try again.`
    }
  }

  const contentError = new Error(message)
  contentError.status = status
  contentError.code = error?.code
  contentError.fields = Array.isArray(response?.errors) ? response.errors : []
  return contentError
}

async function request(config) {
  try {
    const response = await api.request({
      timeout: ADMIN_CONTENT_TIMEOUT_MS,
      ...config,
    })
    if (!response.data?.success) {
      const error = new Error(
        response.data?.message || 'Content records are unavailable.',
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
    throw toAdminContentError(error)
  }
}

export function getAdminContentPage(pageKey, signal) {
  return request({
    url: `/admin/content-pages/${encodeURIComponent(pageKey)}`,
    method: 'GET',
    signal,
  })
}

export function saveAdminContentPage(pageKey, data) {
  return request({
    url: `/admin/content-pages/${encodeURIComponent(pageKey)}`,
    method: 'PUT',
    data,
  })
}

export function listAdminIngredients(params, signal) {
  return request({
    url: '/admin/ingredients',
    method: 'GET',
    params,
    signal,
  })
}

export function getAdminIngredient(ingredientId, signal) {
  return request({
    url: `/admin/ingredients/${encodeURIComponent(ingredientId)}`,
    method: 'GET',
    signal,
  })
}

export function createAdminIngredient(data) {
  return request({ url: '/admin/ingredients', method: 'POST', data })
}

export function updateAdminIngredient(ingredientId, data) {
  return request({
    url: `/admin/ingredients/${encodeURIComponent(ingredientId)}`,
    method: 'PUT',
    data,
  })
}

export function deleteAdminIngredient(ingredientId) {
  return request({
    url: `/admin/ingredients/${encodeURIComponent(ingredientId)}`,
    method: 'DELETE',
  })
}

export function listAdminContactMessages(params, signal) {
  return request({
    url: '/admin/contact-messages',
    method: 'GET',
    params,
    signal,
  })
}

export function getAdminContactMessage(messageId, signal) {
  return request({
    url: `/admin/contact-messages/${encodeURIComponent(messageId)}`,
    method: 'GET',
    signal,
  })
}

export function updateAdminContactMessageStatus(messageId, status) {
  return request({
    url: `/admin/contact-messages/${encodeURIComponent(messageId)}/status`,
    method: 'PATCH',
    data: { status },
  })
}
