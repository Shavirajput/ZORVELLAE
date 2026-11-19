import axios from 'axios'
import api from './api'

export async function fetchAdminDashboard(signal) {
  try {
    const response = await api.get('/admin/dashboard', { signal })
    if (!response.data?.success || !response.data?.data) {
      throw new Error(
        response.data?.message || 'Dashboard data is temporarily unavailable.',
      )
    }
    return response.data.data
  } catch (error) {
    if (axios.isCancel(error)) throw error
    const dashboardError = new Error(
      typeof error?.response?.data?.message === 'string'
        ? error.response.data.message
        : 'Dashboard data is temporarily unavailable.',
    )
    dashboardError.status = error?.response?.status
    dashboardError.code = error?.code
    throw dashboardError
  }
}
