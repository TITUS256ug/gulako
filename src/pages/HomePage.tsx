import { ArrowRight, Search, Store } from 'lucide-react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { products } from '../data/mock'

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

          <div className="landing-showcase">
            <div className="landing-orb orb-one"/>
            <div className="landing-orb orb-two"/>
            <div className="landing-phone">
              <div className="landing-phone-head">
                <span className="mini-avatar">N</span>
                <div><strong>Nile AI Solutions</strong><small>Ntinda, Kampala</small></div>
              </div>
              <img src={products[0].image} alt="Featured product"/>
              <div className="landing-phone-copy">
                <small>Audio</small>
                <strong>Studio Wireless Headphones</strong>
                <span>UGX 285,000</span>
              </div>
              <div className="landing-phone-actions"><button>View product</button><button>WhatsApp</button></div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
