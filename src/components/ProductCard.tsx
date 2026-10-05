import { ArrowUpRight, Check, Image, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import type { Product } from '../data/mock'
import { addToCart } from '../lib/cart'

export function ProductCard({ product }: { product: Product }) {
  const [added,setAdded]=useState(false)
  const formatted = new Intl.NumberFormat('en-UG').format(product.price)
  const image=product.images?.[0]||product.image
  const add = () => {
    addToCart(product)
    setAdded(true)
    window.setTimeout(()=>setAdded(false),1200)
  }

  return (
    <article className="product-card">
      <a className="product-image-wrap" href={`/product/${product.id}`}>
        {image ? <img src={image} alt={product.name} className="product-image" /> : <span className="product-card-placeholder"><Image size={30}/></span>}
        <span className="category-chip">{product.category}</span>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        {product.negotiable && <span className="negotiable-badge">Slightly negotiable</span>}
        {(product.images?.length??0)>1&&<span className="photo-count">{product.images?.length} photos</span>}
      </a>
      <div className="product-info">
        <p className="product-shop">{product.shopName}</p>
        <a className="product-title" href={`/product/${product.id}`}>{product.name}</a>
        <p className="product-description">{product.description}</p>
        <div className="product-bottom">
          <span className="price">{product.currency} {formatted}</span>
          <div className="product-actions">
            <button className={added?'round-action added':'round-action'} onClick={add} aria-label="Add to cart">{added?<Check size={17}/>:<ShoppingBag size={17}/>}</button>
            <a className="round-action strong" href={`/product/${product.id}`} aria-label="View product"><ArrowUpRight size={17} /></a>
          </div>
        </div>
      </div>
    </article>
  )
}
