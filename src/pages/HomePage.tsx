import { ArrowRight, BadgeCheck, MapPin, Search, ShoppingBag, Sparkles, Store, Zap } from 'lucide-react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { PricingSection } from '../components/PricingSection'
import { ProductCard } from '../components/ProductCard'
import { products, shops } from '../data/mock'

export function HomePage() {
  return (
    <div className="app-shell">
      <Header />
      <main>
        <section className="page-container home-hero-v2">
          <div className="home-copy">
            <span className="hero-kicker"><Sparkles size={16} /> Sell simply. Discover locally.</span>
            <h1>Your business, <span>beautifully online.</span></h1>
            <p>Create a modern shop, share it everywhere, and take orders without forcing customers to sign up.</p>
            <div className="home-actions">
              <a className="primary-button large" href="/signup">Start selling free <ArrowRight size={18} /></a>
              <a className="soft-button large" href="/explore"><Search size={18} /> Explore Gulako</a>
            </div>
            <div className="trust-row">
              <span><BadgeCheck size={16} /> Free to start</span>
              <span><ShoppingBag size={16} /> Unlimited orders</span>
              <span><MapPin size={16} /> Built for local commerce</span>
            </div>
          </div>
          <div className="home-showcase">
            <div className="showcase-glow" />
            <div className="showcase-window">
              <div className="showcase-top"><span className="mini-avatar">N</span><div><strong>Nile AI Solutions</strong><small>Ntinda, Kampala</small></div><span className="mini-status">Open</span></div>
              <div className="showcase-image"><img src={products[0].image} alt="Featured product" /><span>Popular</span></div>
              <div className="showcase-product"><div><small>Audio</small><strong>Studio Wireless Headphones</strong></div><b>UGX 285,000</b></div>
              <div className="showcase-actions"><button>View product</button><button>WhatsApp</button></div>
            </div>
            <div className="float-chip chip-one"><Zap size={16} /> Live in minutes</div>
            <div className="float-chip chip-two"><Store size={16} /> Your own shop link</div>
          </div>
        </section>

        <section className="page-container compact-feature-strip">
          <article><span>01</span><div><strong>Create your shop</strong><small>Add products and business details.</small></div></article>
          <article><span>02</span><div><strong>Share everywhere</strong><small>TikTok, Instagram and WhatsApp.</small></div></article>
          <article><span>03</span><div><strong>Take orders</strong><small>Customers buy without an account.</small></div></article>
        </section>

        <section className="page-container home-section">
          <div className="section-heading"><span className="section-kicker">Discover</span><h2>Shops worth opening.</h2><a href="/explore">See all <ArrowRight size={16} /></a></div>
          <div className="shop-grid">
            {shops.map(s => <a className="shop-card" href={`/shop/${s.slug}`} key={s.slug}><img src={s.image} alt={s.name} /><div className="shop-card-body"><span className="mini-avatar">{s.initials}</span><div><strong>{s.name}</strong><small>{s.category} · {s.location}</small></div><ArrowRight size={18} /></div></a>)}
          </div>
        </section>

        <section className="page-container home-section">
          <div className="section-heading"><span className="section-kicker">Trending</span><h2>Fresh finds.</h2></div>
          <div className="product-grid home-products">{products.slice(0, 3).map(p => <ProductCard product={p} key={p.id} />)}</div>
        </section>

        <div className="page-container"><PricingSection /></div>

        <section className="page-container final-cta">
          <div><span className="section-kicker inverted">Start today</span><h2>Your next customer should be one link away.</h2></div>
          <a className="light-button" href="/signup">Create free shop <ArrowRight size={18} /></a>
        </section>
      </main>
      <Footer />
    </div>
  )
}
