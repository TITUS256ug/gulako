import { ArrowLeft, Check, MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Header } from '../components/Header'
import { products, shops } from '../data/mock'
import { addToCart } from '../lib/cart'

export function ProductPage({ id }: { id: string }) {
  const product = products.find(item => item.id === id) ?? products[0]
  const currentShop = shops.find(s=>s.slug===product.shopSlug) ?? shops[0]
  const formatted = new Intl.NumberFormat('en-UG').format(product.price)
  const message = encodeURIComponent(`Hello ${currentShop.name}, I am interested in ${product.name}.`)
  const add = () => { addToCart(product.id); window.dispatchEvent(new Event('gulako-cart')) }
  const buy = () => { addToCart(product.id); window.location.href='/cart' }
  return <div className="app-shell"><Header/><main className="page-container product-page"><a className="back-link" href={`/shop/${product.shopSlug}`}><ArrowLeft size={17}/> Back to shop</a><section className="product-detail-grid"><div className="product-detail-image"><img src={product.image} alt={product.name}/></div><div className="product-detail-copy"><span className="category-chip inline-chip">{product.category}</span><p className="product-shop-link"><a href={`/shop/${product.shopSlug}`}>{product.shopName}</a></p><h1>{product.name}</h1><p className="detail-price">{product.currency} {formatted}</p><p className="detail-description">{product.description}</p><div className="detail-benefits"><span><Check size={18}/> {product.stock} in stock</span><span><ShieldCheck size={18}/> Seller details visible</span></div><div className="product-cta-stack"><button className="primary-button large full-width" onClick={buy}><ShoppingBag size={19}/> Buy now</button><button className="soft-button large full-width" onClick={add}><ShoppingBag size={18}/> Add to cart</button><a className="whatsapp-product" href={`https://wa.me/${currentShop.whatsapp}?text=${message}`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Ask on WhatsApp</a></div></div></section></main></div>
}
