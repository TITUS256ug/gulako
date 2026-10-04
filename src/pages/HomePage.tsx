import { ArrowRight, Search, Store } from 'lucide-react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

export function HomePage() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <section className="page-container landing-minimal">
          <div className="landing-copy">
            <span className="hero-kicker">Gulako for modern sellers</span>
            <h1>Sell beautifully.<br/><span>Grow simply.</span></h1>
            <p>Your shop, products and orders in one clean place.</p>
            <div className="home-actions">
              <a className="primary-button large" href="/signin">Login <ArrowRight size={18}/></a>
              <a className="soft-button large" href="/signup"><Store size={18}/> Start selling</a>
            </div>
            <a className="landing-explore-link" href="/explore"><Search size={16}/> Explore shops</a>
          </div>

          <div className="landing-showcase clean-showcase">
            <div className="landing-orb orb-one"/>
            <div className="landing-orb orb-two"/>
            <div className="brand-showcase-card">
              <div className="brand-showcase-mark">g</div>
              <span>One link for your business.</span>
              <strong>Storefront. Orders. Customers.</strong>
              <a href="/signup">Create your shop <ArrowRight size={17}/></a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
