import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthPage } from './pages/AuthPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { DashboardAnalyticsPage, DashboardCustomersPage, DashboardHomePage, DashboardOrdersPage, DashboardProductsPage, DashboardSettingsPage, DashboardStorePage } from './pages/DashboardPages'
import { DemoShopPage } from './pages/DemoShopPage'
import { FounderPage } from './pages/FounderPage'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OrderTrackPage } from './pages/OrderTrackPage'
import { ProductPage } from './pages/ProductPage'
import { ShopPage } from './pages/ShopPage'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const parts = path.split('/').filter(Boolean)
  if (path === '/') return <HomePage />
  if (path === '/demo') return <DemoShopPage />
  if (path === '/explore') { window.location.replace('/'); return null }
  if (path === '/pricing') { window.location.replace('/signin'); return null }
  if (path === '/signin' || path === '/login') return <AuthPage mode="signin" />
  if (path === '/auth/callback') return <AuthCallbackPage />
  if (path === '/signup' || path === '/register') return <AuthPage mode="signup" />
  if (path === '/onboarding') return <OnboardingPage />
  if (path === '/cart') return <CartPage />
  if (path === '/checkout') return <CheckoutPage />
  if (parts[0] === 'order') return <OrderTrackPage id={parts[1] ?? 'GLK-2420'} />
  if (parts[0] === 'product') return <ProductPage id={parts[1] ?? ''} />
  if (path === '/dashboard') return <ProtectedRoute><DashboardHomePage /></ProtectedRoute>
  if (path === '/dashboard/products') return <ProtectedRoute><DashboardProductsPage /></ProtectedRoute>
  if (path === '/dashboard/orders') return <ProtectedRoute><DashboardOrdersPage /></ProtectedRoute>
  if (path === '/dashboard/customers') return <ProtectedRoute><DashboardCustomersPage /></ProtectedRoute>
  if (path === '/dashboard/analytics') return <ProtectedRoute><DashboardAnalyticsPage /></ProtectedRoute>
  if (path === '/dashboard/store') return <ProtectedRoute><DashboardStorePage /></ProtectedRoute>
  if (path === '/dashboard/settings') return <ProtectedRoute><DashboardSettingsPage /></ProtectedRoute>
  if (path === '/founder') return <ProtectedRoute><FounderPage /></ProtectedRoute>
  if (parts.length === 1) return <ShopPage slug={parts[0]} />
  return <HomePage />
}
