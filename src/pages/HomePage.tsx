import { ArrowRight, Store } from 'lucide-react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { PricingSection } from '../components/PricingSection'

export function HomePage() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <section className="page-container landing-minimal">
          <div className="landing-copy">
            <span className="hero-kicker">Gulako for modern sellers</span>
            <h1>Take your shop online.<br/><span>Sell faster.</span></h1>
            <p>Storefront, orders, and customers in one place.</p>
            <div className="home-actions">
              <a className="primary-button large" href="/signin">Login <ArrowRight size={18}/></a>
              <a className="soft-button large" href="/signup"><Store size={18}/> Start selling</a>
            </div>
          </div>

          <div className="landing-showcase clean-showcase">
            <div className="landing-orb orb-one"/>
            <div className="landing-orb orb-two"/>
            <div className="brand-showcase-card">
              <div className="brand-showcase-mark">g</div>
              <span>Your business, online in minutes.</span>
              <strong>Products. Orders. Payments.</strong>
              <a href="/signup">Create your shop <ArrowRight size={17}/></a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export function PricingPage() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page-container">
        <PricingSection />
        <p className="public-pricing-note">All prices are monthly. Start with a free shop, then sign in to your dashboard to request an upgrade. Paid plans are activated after payment verification.</p>
      </main>
      <Footer />
    </div>
  )
}
