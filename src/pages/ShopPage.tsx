import { ArrowRight, Store } from 'lucide-react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

export function ShopPage({ slug }: { slug?: string }) {
  return <div className="app-shell">
    <Header compact/>
    <main>
      <div className="page-container">
        <div className="context-strip"><Store size={16}/> Gulako storefront</div>
        <section className="shop-empty-page">
          <div className="shop-empty-icon"><Store size={30}/></div>
          <span className="section-kicker">Storefront</span>
          <h1>{slug ? 'This shop is not published yet.' : 'Shop not found.'}</h1>
          <p>Seller storefronts will display here once connected to the live Gulako database.</p>
          <div className="home-actions">
            <a className="primary-button" href="/signup">Create your shop <ArrowRight size={17}/></a>
            <a className="soft-button" href="/explore">Explore Gulako</a>
          </div>
        </section>
      </div>
    </main>
    <Footer/>
  </div>
}
