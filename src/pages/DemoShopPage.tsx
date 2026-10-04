import { ShoppingBag, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

const demoProducts = [
  ['Demo Urban Sneakers','Shoes','UGX 145,000'],
  ['Demo Leather Handbag','Bags','UGX 180,000'],
  ['Demo Smart Watch','Electronics','UGX 210,000'],
  ['Demo Wireless Headphones','Audio','UGX 285,000'],
  ['Demo Linen Shirt','Fashion','UGX 95,000'],
  ['Demo Sunglasses','Accessories','UGX 75,000'],
  ['Demo Coffee Set','Home','UGX 118,000'],
  ['Demo Running Shoes','Sports','UGX 165,000'],
  ['Demo Desk Lamp','Home','UGX 89,000'],
  ['Demo Travel Backpack','Bags','UGX 130,000'],
]

export function DemoShopPage() {
  return <div className="app-shell customer-storefront demo-storefront" style={{'--shop-accent':'#7c3aed'} as CSSProperties}>
    <Header compact/>
    <main><div className="page-container">
      <section className="demo-shop-hero">
        <div><span className="section-kicker"><Sparkles size={14}/> Demo shop</span><h1>Gulako Demo Store</h1><p>See how your storefront can look before you create your own.</p></div>
        <div className="demo-shop-badge">10 demo products</div>
      </section>
      <section className="catalog-section">
        <div className="catalog-heading-row"><div><div className="title-with-count"><h2>Demo products</h2><span className="count-pill">10</span></div><p>Preview only — these products are not for sale.</p></div></div>
        <div className="product-grid demo-product-grid">
          {demoProducts.map(([name,category,price],index)=><article className="product-card" key={name}>
            <div className={"product-image-wrap demo-image demo-image-"+(index%5)}><span className="category-chip">{category}</span><span className="product-badge">Demo</span></div>
            <div className="product-info"><p className="product-shop">Gulako Demo Store</p><strong className="product-title">{name}</strong><div className="product-bottom"><span className="price">{price}</span><span className="round-action strong"><ShoppingBag size={17}/></span></div></div>
          </article>)}
        </div>
      </section>
    </div></main>
    <Footer/>
  </div>
}
