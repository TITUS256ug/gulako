import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { PricingSection } from '../components/PricingSection'

export function PricingPage() {
  return <div className="app-shell"><Header/><main className="page-container standalone-page"><PricingSection compact/><div className="pricing-note">No order limits on Free. Upgrade when you need more products and business tools.</div></main><Footer/></div>
}
