import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { cartDetails, updateCart } from '../lib/cart'

export function CartPage() {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const refresh = () => setVersion(v => v + 1)
    window.addEventListener('gulako-cart', refresh)
    return () => window.removeEventListener('gulako-cart', refresh)
  }, [])
  const lines = useMemo(() => cartDetails(), [version])
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0)
  const money = (n:number) => new Intl.NumberFormat('en-UG').format(n)

  return <div className="app-shell"><Header/><main className="page-container cart-page">
    <a className="back-link" href="/explore"><ArrowLeft size={17}/> Keep shopping</a>
    <div className="cart-title"><div><span className="section-kicker">Your bag</span><h1>Cart</h1></div><span>{lines.length} item{lines.length===1?'':'s'}</span></div>
    {lines.length===0 ? <section className="empty-cart"><div className="empty-cart-icon"><ShoppingBag size={30}/></div><h2>Your cart is empty.</h2><p>Browse Gulako and add something you like.</p><a className="primary-button" href="/explore">Explore products <ArrowRight size={17}/></a></section> :
    <div className="cart-grid"><section className="cart-lines">{lines.map(line=><article className="cart-line" key={line.productId}><img src={line.product.image} alt={line.product.name}/><div className="cart-line-main"><small>{line.product.shopName}</small><strong>{line.product.name}</strong><span>UGX {money(line.product.price)}</span><div className="quantity-control"><button onClick={()=>updateCart(line.productId,line.quantity-1)}><Minus size={15}/></button><span>{line.quantity}</span><button onClick={()=>updateCart(line.productId,line.quantity+1)}><Plus size={15}/></button></div></div><button className="delete-button" onClick={()=>updateCart(line.productId,0)}><Trash2 size={18}/></button></article>)}</section>
    <aside className="order-summary"><span className="section-kicker">Summary</span><div><span>Subtotal</span><strong>UGX {money(subtotal)}</strong></div><div><span>Delivery</span><span>Calculated at checkout</span></div><hr/><div className="summary-total"><span>Total</span><strong>UGX {money(subtotal)}</strong></div><a className="primary-button large full-width" href="/checkout">Checkout <ArrowRight size={18}/></a><small>No buyer account required.</small></aside></div>}
  </main><Footer/></div>
}
