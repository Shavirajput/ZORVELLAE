import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getAdminCurrentUser,
  loginAdmin as loginRequest,
  logoutAdmin as logoutRequest,
} from '../services/adminAuth'
import AdminAuthContext from './adminAuthContext'

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [authStatus, setAuthStatus] = useState('loading')
  const [authError, setAuthError] = useState(null)
  const requestId = useRef(0)

  const refreshAdmin = useCallback(async (signal) => {
    const currentRequestId = ++requestId.current
    try {
      const currentAdmin = await getAdminCurrentUser(signal)
      if (currentRequestId !== requestId.current) return null
      setAdmin(currentAdmin)
      setAuthStatus('authenticated')
      setAuthError(null)
      return currentAdmin
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') return null
      if (currentRequestId !== requestId.current) return null
      setAdmin(null)
      setAuthStatus(error?.status === 401 ? 'unauthenticated' : 'error')
      setAuthError(error?.status === 401 ? null : error)
      return null
    }
  }, [])

  const retryAdminSession = useCallback(() => {
    setAuthStatus('loading')
    return refreshAdmin()
  }, [refreshAdmin])

  useEffect(() => {
    const controller = new AbortController()
    const currentRequestId = ++requestId.current
    let active = true

    getAdminCurrentUser(controller.signal)
      .then((currentAdmin) => {
        if (!active || currentRequestId !== requestId.current) return
        setAdmin(currentAdmin)
        setAuthStatus('authenticated')
        setAuthError(null)
      })
      .catch((error) => {
        if (!active || error?.code === 'ERR_CANCELED' || currentRequestId !== requestId.current) return
        setAdmin(null)
        setAuthStatus(error?.status === 401 ? 'unauthenticated' : 'error')
        setAuthError(error?.status === 401 ? null : error)
      })

    return () => controller.abort()
  }, [])

  const loginAdmin = useCallback(async (credentials) => {
    const currentRequestId = ++requestId.current
    setAuthStatus('loading')
    setAuthError(null)
    try {
      const signedInAdmin = await loginRequest(credentials)
      if (currentRequestId !== requestId.current) return null
      setAdmin(signedInAdmin)
      setAuthStatus('authenticated')
      return signedInAdmin
    } catch (error) {
      if (currentRequestId !== requestId.current) throw error
      setAdmin(null)
      setAuthStatus('unauthenticated')
      setAuthError(error)
      throw error
    }
  }, [])

  const logoutAdmin = useCallback(async () => {
    const currentRequestId = ++requestId.current
    await logoutRequest()
    if (currentRequestId !== requestId.current) return
    setAdmin(null)
    setAuthStatus('unauthenticated')
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({
      admin,
      authStatus,
      authError,
      loginAdmin,
      logoutAdmin,
      refreshAdmin,
      retryAdminSession,
    }),
    [admin, authStatus, authError, loginAdmin, logoutAdmin, refreshAdmin, retryAdminSession],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
