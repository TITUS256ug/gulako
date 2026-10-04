import { Search, Store } from 'lucide-react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

export function ExplorePage() {
  return <div className="app-shell">
    <Header />
    <main className="page-container explore-page">
      <section className="explore-intro">
        <span className="section-kicker">Explore Gulako</span>
        <h1>Discover shops.</h1>
        <p>Live seller storefronts will appear here as businesses publish them.</p>
      </section>
      <div className="explore-toolbar">
        <label className="big-search"><Search size={20}/><input placeholder="Search shops or products" /></label>
      </div>
      <section className="empty-state marketplace-empty">
        <Store size={28}/>
        <h3>No live shops yet</h3>
        <p>Be among the first sellers to publish on Gulako.</p>
        <a className="primary-button" href="/signup">Start selling</a>
      </section>
    </main>
    <Footer />
  </div>
}
