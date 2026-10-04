import { ArrowLeft, Check, MessageCircle, PackageSearch, ShieldCheck, ShoppingBag } from 'lucide-react'
import { Header } from '../components/Header'
import { addToCart } from '../lib/cart'
import { getSellerProducts, getStoreProfile } from '../lib/storeData'

export function ProductPage({ id }: { id: string }) {
  const product=getSellerProducts().find(item=>item.id===id)
  const profile=getStoreProfile()

  if(!product){
    return <div className="app-shell"><Header/><main className="page-container product-page">
      <a className="back-link" href={profile.businessName?'/shop/'+profile.slug:'/'}><ArrowLeft size={17}/> Back</a>
      <section className="empty-state product-empty"><PackageSearch size={30}/><h2>Product unavailable</h2><p>This product is not currently published.</p></section>
    </main></div>
  }

  const formatted=new Intl.NumberFormat('en-UG').format(product.price)
  const whatsapp=profile.whatsapp.replace(/\D/g,'')
  const message=encodeURIComponent('Hello '+(profile.businessName||'seller')+', I am interested in '+product.name+'.')
  const add=()=>{addToCart(product.id);window.dispatchEvent(new Event('gulako-cart'))}
  const buy=()=>{addToCart(product.id);window.location.href='/cart'}

  return <div className="app-shell"><Header/><main className="page-container product-page">
    <a className="back-link" href={'/shop/'+profile.slug}><ArrowLeft size={17}/> Back to shop</a>
    <section className="product-detail-grid">
      <div className="product-detail-image">{product.image?<img src={product.image} alt={product.name}/>:<div className="product-image-placeholder"><PackageSearch size={40}/></div>}</div>
      <div className="product-detail-copy">
        <span className="category-chip inline-chip">{product.category}</span>
        <p className="product-shop-link"><a href={'/shop/'+profile.slug}>{profile.businessName||product.shopName}</a></p>
        <h1>{product.name}</h1>
        <p className="detail-price">UGX {formatted}</p>
        {product.description&&<p className="detail-description">{product.description}</p>}
        <div className="detail-benefits"><span><Check size={18}/> {product.stock} in stock</span><span><ShieldCheck size={18}/> Seller contact available</span></div>
        <div className="product-cta-stack">
          <button className="primary-button large full-width" onClick={buy}><ShoppingBag size={19}/> Buy now</button>
          <button className="soft-button large full-width" onClick={add}><ShoppingBag size={18}/> Add to cart</button>
          {whatsapp&&<a className="whatsapp-product" href={'https://wa.me/'+whatsapp+'?text='+message} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Ask on WhatsApp</a>}
        </div>
      </div>
    </section>
  </main></div>
}
