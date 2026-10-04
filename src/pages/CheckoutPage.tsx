import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { Header } from '../components/Header'
import { cartDetails } from '../lib/cart'

export function CheckoutPage() {
  const lines = cartDetails()
  if (!lines.length) {
    return <div className="app-shell"><Header/><main className="page-container checkout-page">
      <a className="back-link" href="/cart"><ArrowLeft size={17}/> Back to cart</a>
      <section className="empty-state product-empty">
        <ShoppingBag size={30}/>
        <h2>Your cart is empty</h2>
        <p>Add a product before continuing to checkout.</p>
        <a className="primary-button" href="/">Back to Gulako</a>
      </section>
    </main></div>
  }

  return <div className="app-shell"><Header/><main className="page-container checkout-page">
    <a className="back-link" href="/cart"><ArrowLeft size={17}/> Back to cart</a>
    <section className="empty-state product-empty">
      <ShoppingBag size={30}/>
      <h2>Checkout is ready for live orders.</h2>
      <p>Payment and live order creation will activate when the database and seller records are connected.</p>
    </section>
  </main></div>
}
