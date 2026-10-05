import { ShoppingBag, Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'

const demoProducts = [
  {name:'Demo Urban Sneakers',category:'Shoes',price:'UGX 145,000',image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Leather Handbag',category:'Bags',price:'UGX 180,000',image:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Smart Watch',category:'Electronics',price:'UGX 210,000',image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Wireless Headphones',category:'Audio',price:'UGX 285,000',image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Linen Shirt',category:'Fashion',price:'UGX 95,000',image:'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Sunglasses',category:'Accessories',price:'UGX 75,000',image:'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Coffee Set',category:'Home',price:'UGX 118,000',image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Smartphone',category:'Phones',price:'UGX 1,250,000',image:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Desk Lamp',category:'Home',price:'UGX 89,000',image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=82'},
  {name:'Demo Travel Backpack',category:'Bags',price:'UGX 130,000',image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=82'},
]

export function DemoShopPage() {
  return <div className="app-shell customer-storefront demo-storefront" style={{'--shop-accent':'#7c3aed'} as CSSProperties}>
    <Header compact/>
    <main><div className="page-container">
      <section className="demo-shop-hero">
        <div><span className="section-kicker"><Sparkles size={14}/> Demo shop</span><h1>Welcome to Gulako Demo Store</h1><p>This is a sample customer storefront. Use it to preview how a polished Gulako shop can feel before you publish your own.</p></div>
        <div className="demo-shop-badge">Demo experience · 10 products</div>
      </section>
      <section className="catalog-section">
        <div className="catalog-heading-row"><div><div className="title-with-count"><h2>Demo products</h2><span className="count-pill">10</span></div><p>Preview only — these sample products are not for sale.</p></div></div>
        <div className="product-grid demo-product-grid">
          {demoProducts.map(product=><article className="product-card" key={product.name}>
            <div className="product-image-wrap">
              <img className="product-image" src={product.image} alt={product.name} loading="lazy"/>
              <span className="category-chip">{product.category}</span>
              <span className="product-badge">Demo</span>
            </div>
            <div className="product-info"><p className="product-shop">Gulako Demo Store</p><strong className="product-title">{product.name}</strong><div className="product-bottom"><span className="price">{product.price}</span><span className="round-action strong"><ShoppingBag size={17}/></span></div></div>
          </article>)}
        </div>
      </section>
    </div></main>
    <Footer/>
  </div>
}
