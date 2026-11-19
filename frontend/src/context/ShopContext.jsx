import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateCurrentUser,
} from '../services/auth'
import {
  addCustomerAddress,
  addCustomerCartItem,
  addCustomerWishlistItem,
  clearCustomerCart,
  deleteCustomerAddress,
  getCustomerAddresses,
  getCustomerCart,
  getCustomerWishlist,
  removeCustomerCartItem,
  removeCustomerWishlistItem,
  setDefaultCustomerAddress,
  updateCustomerAddress,
  updateCustomerCartItem,
} from '../services/customerData'
import ShopContext from './shop-context'

const CART_STORAGE_KEY = 'zorvellae-demo-cart'
const WISHLIST_STORAGE_KEY = 'zorvellae-demo-wishlist'

function readStoredValue(key, fallback) {
  try {
    const stored = window.localStorage.getItem(key)
    if (!stored) return fallback
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : fallback
  } catch (error) {
    console.error(`Unable to read ${key} from local storage.`, error)
    return fallback
  }
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStoredValue(key, fallback))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Unable to save ${key} to local storage.`, error)
    }
  }, [key, value])

  return [value, setValue]
}

export function ShopProvider({ children }) {
  const [guestCart, setGuestCart] = useStoredState(CART_STORAGE_KEY, [])
  const [guestWishlist, setGuestWishlist] = useStoredState(WISHLIST_STORAGE_KEY, [])
  const [customerCart, setCustomerCart] = useState([])
  const [customerWishlist, setCustomerWishlist] = useState([])
  const [lastDemoOrder, setLastDemoOrder] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [authStatus, setAuthStatus] = useState('loading')
  const [authError, setAuthError] = useState(null)
  const [customerDataError, setCustomerDataError] = useState('')
  const authRequestId = useRef(0)
  const [savedAddresses, setSavedAddresses] = useState([])

  const cart = authStatus === 'authenticated' ? customerCart : guestCart
  const wishlist = authStatus === 'authenticated' ? customerWishlist : guestWishlist

  const clearCustomerData = useCallback(() => {
    setCustomerCart([])
    setCustomerWishlist([])
    setSavedAddresses([])
  }, [])

  const refreshCustomer = useCallback(async (signal) => {
    const requestId = ++authRequestId.current
    try {
      const currentUser = await getCurrentUser(signal)
      const [currentCart, currentWishlist, currentAddresses] = await Promise.all([
        getCustomerCart(signal),
        getCustomerWishlist(signal),
        getCustomerAddresses(signal),
      ])
      if (requestId === authRequestId.current) {
        setCustomerCart(currentCart)
        setCustomerWishlist(currentWishlist)
        setSavedAddresses(currentAddresses)
        setCustomer(currentUser)
        setAuthStatus('authenticated')
        setAuthError(null)
        setCustomerDataError('')
      }
      return currentUser
    } catch (error) {
      if (error?.code === 'ERR_CANCELED') return null
      if (requestId === authRequestId.current) {
        clearCustomerData()
        setCustomer(null)
        setAuthStatus(error?.status === 401 ? 'unauthenticated' : 'error')
        setAuthError(error?.status === 401 ? null : error)
      }
      return null
    }
  }, [clearCustomerData])

  useEffect(() => {
    const controller = new AbortController()
    const initializeSession = async () => {
      await refreshCustomer(controller.signal)
    }
    initializeSession()
    return () => controller.abort()
  }, [refreshCustomer])

  const login = useCallback(async (credentials) => {
    const requestId = ++authRequestId.current
    setAuthStatus('loading')
    setAuthError(null)
    setCustomerDataError('')
    clearCustomerData()
    let signedInUser = null
    try {
      signedInUser = await loginRequest(credentials)
      const [currentCart, currentWishlist, currentAddresses] = await Promise.all([
        getCustomerCart(),
        getCustomerWishlist(),
        getCustomerAddresses(),
      ])
      if (requestId === authRequestId.current) {
        setCustomerCart(currentCart)
        setCustomerWishlist(currentWishlist)
        setSavedAddresses(currentAddresses)
        setCustomer(signedInUser)
        setAuthStatus('authenticated')
      }
      return signedInUser
    } catch (error) {
      if (requestId === authRequestId.current) {
        clearCustomerData()
        setCustomer(signedInUser)
        setAuthStatus(signedInUser ? 'error' : 'unauthenticated')
        setAuthError(signedInUser ? error : null)
      }
      throw error
    }
  }, [clearCustomerData])

  const register = useCallback(async (details) => {
    const requestId = ++authRequestId.current
    setAuthStatus('loading')
    setAuthError(null)
    setCustomerDataError('')
    clearCustomerData()
    let registeredUser = null
    try {
      registeredUser = await registerRequest(details)
      const [currentCart, currentWishlist, currentAddresses] = await Promise.all([
        getCustomerCart(),
        getCustomerWishlist(),
        getCustomerAddresses(),
      ])
      if (requestId === authRequestId.current) {
        setCustomerCart(currentCart)
        setCustomerWishlist(currentWishlist)
        setSavedAddresses(currentAddresses)
        setCustomer(registeredUser)
        setAuthStatus('authenticated')
      }
      return registeredUser
    } catch (error) {
      if (requestId === authRequestId.current) {
        clearCustomerData()
        setCustomer(registeredUser)
        setAuthStatus(registeredUser ? 'error' : 'unauthenticated')
        setAuthError(registeredUser ? error : null)
      }
      throw error
    }
  }, [clearCustomerData])

  const logout = useCallback(async () => {
    const requestId = ++authRequestId.current
    await logoutRequest()
    if (requestId === authRequestId.current) {
      clearCustomerData()
      setCustomer(null)
      setAuthStatus('unauthenticated')
      setAuthError(null)
      setCustomerDataError('')
      setLastDemoOrder(null)
    }
  }, [clearCustomerData])

  const updateProfile = useCallback(async (profile) => {
    const requestId = ++authRequestId.current
    const updatedUser = await updateCurrentUser(profile)
    if (requestId === authRequestId.current) {
      setCustomer(updatedUser)
      setAuthStatus('authenticated')
      setAuthError(null)
    }
    return updatedUser
  }, [])

  const persistCustomerData = useCallback(async (operation, updateState) => {
    try {
      const data = await operation()
      updateState(data)
      setCustomerDataError('')
      return true
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') {
        setCustomerDataError(
          error?.message || 'Your saved customer data could not be updated.',
        )
      }
      return false
    }
  }, [])

  const addToCart = useCallback((productId, variantId, quantity = 1) => {
    if (authStatus === 'authenticated') {
      return persistCustomerData(
        () => addCustomerCartItem({ productId, variantId, quantity }),
        setCustomerCart,
      )
    }
    setGuestCart((items) => {
      const existing = items.find((item) => item.productId === productId && item.variantId === variantId)
      if (existing) {
        return items.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [...items, { productId, variantId, quantity }]
    })
    return Promise.resolve(true)
  }, [authStatus, persistCustomerData, setGuestCart])

  const updateQuantity = useCallback((productId, variantId, quantity) => {
    const nextQuantity = Math.max(1, Math.floor(Number(quantity) || 1))
    if (authStatus === 'authenticated') {
      return persistCustomerData(
        () => updateCustomerCartItem({ productId, variantId, quantity: nextQuantity }),
        setCustomerCart,
      )
    }
    setGuestCart((items) =>
      items.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity: nextQuantity }
          : item,
      ),
    )
    return Promise.resolve(true)
  }, [authStatus, persistCustomerData, setGuestCart])

  const removeFromCart = useCallback((productId, variantId) => {
    if (authStatus === 'authenticated') {
      return persistCustomerData(
          () => removeCustomerCartItem({ productId, variantId }),
          setCustomerCart,
      )
    }
    setGuestCart((items) =>
      items.filter((item) => item.productId !== productId || item.variantId !== variantId),
    )
    return Promise.resolve(true)
  }, [authStatus, persistCustomerData, setGuestCart])

  const clearCart = useCallback(() => {
    if (authStatus === 'authenticated') {
      return persistCustomerData(clearCustomerCart, setCustomerCart)
    }
    setGuestCart([])
    return Promise.resolve(true)
  }, [authStatus, persistCustomerData, setGuestCart])

  const toggleWishlist = useCallback((productId) => {
    if (authStatus === 'authenticated') {
      const operation = customerWishlist.includes(productId)
          ? () => removeCustomerWishlistItem(productId)
          : () => addCustomerWishlistItem(productId)
      return persistCustomerData(operation, setCustomerWishlist)
    }
    setGuestWishlist((items) =>
      items.includes(productId)
        ? items.filter((id) => id !== productId)
        : [...items, productId],
    )
    return Promise.resolve(true)
  }, [authStatus, customerWishlist, persistCustomerData, setGuestWishlist])

  const recordDemoOrder = useCallback((orderDetails) => {
    const order = {
      ...orderDetails,
      id: `DEMO-${Date.now().toString(36).toUpperCase()}`,
      submittedAt: new Date().toISOString(),
    }
    setLastDemoOrder(order)
    return order
  }, [])

  const addSavedAddress = useCallback((address) =>
    persistCustomerData(
      async () => {
        const newAddress = await addCustomerAddress(address)
        return [...savedAddresses, newAddress]
      },
      setSavedAddresses,
    ), [persistCustomerData, savedAddresses])

  const updateSavedAddress = useCallback((addressId, address) =>
    persistCustomerData(
      async () => {
        const updated = await updateCustomerAddress(addressId, address)
        return savedAddresses.map((item) => item.id === addressId ? updated : item)
      },
      setSavedAddresses,
    ), [persistCustomerData, savedAddresses])

  const removeSavedAddress = useCallback((addressId) =>
    persistCustomerData(
      () => deleteCustomerAddress(addressId),
      setSavedAddresses,
    ), [persistCustomerData])

  const setDefaultAddress = useCallback((addressId) =>
    persistCustomerData(
      () => setDefaultCustomerAddress(addressId),
      setSavedAddresses,
    ), [persistCustomerData])

  const clearCustomerDataError = useCallback(() => setCustomerDataError(''), [])

  const value = useMemo(
    () => ({
      cart,
      wishlist,
      cartCount: cart.reduce((total, item) => total + item.quantity, 0),
      lastDemoOrder,
      customer,
      authStatus,
      authError,
      customerDataError,
      savedAddresses,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      recordDemoOrder,
      login,
      register,
      logout,
      refreshCustomer,
      updateProfile,
      updateSavedAddress,
      addSavedAddress,
      removeSavedAddress,
      setDefaultAddress,
      clearCustomerDataError,
    }),
    [cart, wishlist, lastDemoOrder, customer, authStatus, authError, customerDataError, savedAddresses, addToCart, updateQuantity, removeFromCart, clearCart, toggleWishlist, recordDemoOrder, login, register, logout, refreshCustomer, updateProfile, updateSavedAddress, addSavedAddress, removeSavedAddress, setDefaultAddress, clearCustomerDataError],
  )

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}
