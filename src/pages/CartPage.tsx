import { ArrowLeft, ArrowRight, Clock3, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
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
  const firstShop=lines[0]?.product
  const uniqueShops=new Set(lines.map(line=>line.product.shopSlug)).size

  return <div className="app-shell premium-cart-page"><Header/><main className="page-container cart-page">
    <a className="back-link" href={firstShop?'/'+firstShop.shopSlug:'/'}><ArrowLeft size={17}/> {firstShop?'Continue shopping':'Back to Gulako'}</a>

    <div className="cart-title premium-cart-title">
      <div><span className="section-kicker">Saved on this browser</span><h1>Your cart</h1><p>Come back later and your items will still be here on this device.</p></div>
      <span>{lines.reduce((sum,line)=>sum+line.quantity,0)} item{lines.reduce((sum,line)=>sum+line.quantity,0)===1?'':'s'}</span>
    </div>

    {lines.length===0 ? <section className="empty-cart premium-empty-cart">
      <div className="empty-cart-icon"><ShoppingBag size={30}/></div>
      <h2>Your cart is empty.</h2>
      <p>Add products from a seller's storefront and they will be remembered on this browser.</p>
      <a className="primary-button" href="/demo">View demo shop <ArrowRight size={17}/></a>
    </section> :
    <div className="cart-grid premium-cart-grid">
      <section className="cart-lines">
        {uniqueShops>1&&<div className="multi-shop-note"><Clock3 size={18}/><div><strong>Products from {uniqueShops} shops</strong><span>At checkout, payment instructions are shown separately for each seller.</span></div></div>}
        {lines.map(line=>{
          const image=line.product.images?.[0]||line.product.image
          return <article className="cart-line premium-cart-line" key={line.productId}>
            <a className="cart-line-image" href={'/product/'+line.product.id}>{image?<img src={image} alt={line.product.name}/>:<span><ShoppingBag size={24}/></span>}</a>
            <div className="cart-line-main">
              <small>{line.product.shopName}</small>
              <a className="cart-product-name" href={'/product/'+line.product.id}>{line.product.name}</a>
              <span>UGX {money(line.product.price)}</span>
              <div className="quantity-control">
                <button onClick={()=>updateCart(line.productId,line.quantity-1)} aria-label="Decrease quantity"><Minus size={15}/></button>
                <span>{line.quantity}</span>
                <button onClick={()=>updateCart(line.productId,line.quantity+1)} aria-label="Increase quantity"><Plus size={15}/></button>
              </div>
            </div>
            <div className="cart-line-total"><strong>UGX {money(line.product.price*line.quantity)}</strong><button className="delete-button" onClick={()=>updateCart(line.productId,0)} aria-label="Remove product"><Trash2 size={18}/></button></div>
          </article>
        })}
      </section>

      <aside className="order-summary premium-order-summary">
        <span className="section-kicker">Order summary</span>
        <div><span>Subtotal</span><strong>UGX {money(subtotal)}</strong></div>
        <div><span>Delivery</span><span>Confirmed with seller</span></div>
        <hr/>
        <div className="summary-total"><span>Total</span><strong>UGX {money(subtotal)}</strong></div>
        <a className="primary-button large full-width" href="/checkout">Continue to Mobile Money <ArrowRight size={18}/></a>
        <small>No buyer account required.</small>
      </aside>
    </div>}
  </main><Footer/></div>
}
