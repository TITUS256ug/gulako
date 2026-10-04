import { AuthPage } from './pages/AuthPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { DashboardAnalyticsPage, DashboardCustomersPage, DashboardHomePage, DashboardOrdersPage, DashboardProductsPage, DashboardSettingsPage, DashboardStorePage } from './pages/DashboardPages'
import { HomePage } from './pages/HomePage'
import { OnboardingPage } from './pages/OnboardingPage'
import { OrderTrackPage } from './pages/OrderTrackPage'
import { ProductPage } from './pages/ProductPage'
import { ShopPage } from './pages/ShopPage'

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const parts = path.split('/').filter(Boolean)
  if (path === '/') return <HomePage />
  if (path === '/explore') { window.location.replace('/'); return null }
  if (path === '/pricing') { window.location.replace('/signin'); return null }
  if (path === '/signin' || path === '/login') return <AuthPage mode="signin" />
  if (path === '/signup' || path === '/register') return <AuthPage mode="signup" />
  if (path === '/onboarding') return <OnboardingPage />
  if (path === '/cart') return <CartPage />
  if (path === '/checkout') return <CheckoutPage />
  if (parts[0] === 'order') return <OrderTrackPage id={parts[1] ?? 'GLK-2420'} />
  if (parts[0] === 'shop') return <ShopPage slug={parts[1]} />
  if (parts[0] === 'product') return <ProductPage id={parts[1] ?? ''} />
  if (path === '/dashboard') return <DashboardHomePage />
  if (path === '/dashboard/products') return <DashboardProductsPage />
  if (path === '/dashboard/orders') return <DashboardOrdersPage />
  if (path === '/dashboard/customers') return <DashboardCustomersPage />
  if (path === '/dashboard/analytics') return <DashboardAnalyticsPage />
  if (path === '/dashboard/store') return <DashboardStorePage />
  if (path === '/dashboard/settings') return <DashboardSettingsPage />
  return <HomePage />
}
