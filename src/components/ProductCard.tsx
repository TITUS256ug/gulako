import { ArrowUpRight, Image, ShoppingBag } from 'lucide-react'
import type { Product } from '../data/mock'
import { addToCart } from '../lib/cart'

export function ProductCard({ product }: { product: Product }) {
  const formatted = new Intl.NumberFormat('en-UG').format(product.price)
  const add = () => {
    addToCart(product.id)
    window.dispatchEvent(new Event('gulako-cart'))
  }
  return (
    <article className="product-card">
      <a className="product-image-wrap" href={`/product/${product.id}`}>
        {product.image ? <img src={product.image} alt={product.name} className="product-image" /> : <span className="product-card-placeholder"><Image size={30}/></span>}
        <span className="category-chip">{product.category}</span>
        {product.badge && <span className="product-badge">{product.badge}</span>}
      </a>
      <div className="product-info">
        <p className="product-shop">{product.shopName}</p>
        <a className="product-title" href={`/product/${product.id}`}>{product.name}</a>
        <p className="product-description">{product.description}</p>
        <div className="product-bottom">
          <span className="price">{product.currency} {formatted}</span>
          <div className="product-actions">
            <button className="round-action" onClick={add} aria-label="Add to cart"><ShoppingBag size={17} /></button>
            <a className="round-action strong" href={`/product/${product.id}`} aria-label="View product"><ArrowUpRight size={17} /></a>
          </div>
        </div>
      </div>
    </article>
  )
}
