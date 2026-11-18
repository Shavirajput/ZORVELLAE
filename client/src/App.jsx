import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ShopProvider } from './context/ShopContext'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import PlaceholderPage from './pages/PlaceholderPage'
import ShopPage from './pages/ShopPage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import WishlistPage from './pages/WishlistPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AccountLayout from './components/account/AccountLayout'
import AccountDashboardPage from './pages/AccountDashboardPage'
import AccountProfilePage from './pages/AccountProfilePage'
import SavedAddressesPage from './pages/SavedAddressesPage'
import OrderHistoryPage from './pages/OrderHistoryPage'
import OrderDetailsPage from './pages/OrderDetailsPage'

function App() {
  return (
    <BrowserRouter>
      <ShopProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="shop/category/:slug" element={<ShopPage collection />} />
            <Route path="shop/:category" element={<ShopPage collection />} />
            <Route path="product/:slug" element={<ProductPage />} />
            <Route path="products/:slug" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="routines" element={<PlaceholderPage title="Skincare Routines" />} />
            <Route path="routine-builder" element={<PlaceholderPage title="Build Your Custom Routine" />} />
            <Route path="skin-concerns" element={<PlaceholderPage title="Skin Concerns" />} />
            <Route path="ingredients" element={<PlaceholderPage title="Ingredient Library" />} />
            <Route path="science" element={<PlaceholderPage title="Our Science" />} />
            <Route path="about" element={<PlaceholderPage title="About ZORVELLAE" />} />
            <Route path="contact" element={<PlaceholderPage title="Contact Us" />} />
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<AccountDashboardPage />} />
              <Route path="profile" element={<AccountProfilePage />} />
              <Route path="addresses" element={<SavedAddressesPage />} />
              <Route path="orders" element={<OrderHistoryPage />} />
              <Route path="orders/:orderId" element={<OrderDetailsPage />} />
            </Route>
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
          </Route>
        </Routes>
      </ShopProvider>
    </BrowserRouter>
  )
}

export default App
