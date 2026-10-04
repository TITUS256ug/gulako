import { ArrowLeft, Check, MessageCircle, PackageSearch, ShieldCheck, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Header } from '../components/Header'
import type { Product } from '../data/mock'
import { addToCart } from '../lib/cart'
import { accentColors, fetchPublicProduct } from '../lib/storeData'
import type { StoreProfile } from '../lib/storeData'

type ProductData={product:Product;profile:StoreProfile;logo:string}

export function ProductPage({ id }: { id: string }) {
  const [data,setData]=useState<ProductData|null>(null)
  const [ready,setReady]=useState(false)

  useEffect(()=>{
    let active=true
    fetchPublicProduct(id).then(result=>{
      if(!active)return
      setData(result)
      setReady(true)
    })
    return()=>{active=false}
  },[id])

  if(!ready)return null

  if(!data){
    return <div className="app-shell"><Header/><main className="page-container product-page">
      <a className="back-link" href="/"><ArrowLeft size={17}/> Back</a>
      <section className="empty-state product-empty"><PackageSearch size={30}/><h2>Product unavailable</h2><p>This product is not currently published.</p></section>
    </main></div>
  }

  const {product,profile}=data
  const formatted=new Intl.NumberFormat('en-UG').format(product.price)
  const style={ '--shop-accent': accentColors[profile.accent] } as CSSProperties
  const whatsapp=profile.whatsapp.replace(/\D/g,'')
  const message=encodeURIComponent('Hello '+(profile.businessName||'seller')+', I am interested in '+product.name+'.')
  const add=()=>{addToCart(product);window.dispatchEvent(new Event('gulako-cart'))}
  const buy=()=>{addToCart(product.id);window.location.href='/cart'}

  return <div className="app-shell customer-storefront" style={style}><Header/><main className="page-container product-page">
    <a className="back-link" href={'/'+profile.slug}><ArrowLeft size={17}/> Back to shop</a>
    <section className="product-detail-grid">
      <div className="product-detail-image">{product.image?<img src={product.image} alt={product.name}/>:<div className="product-image-placeholder"><PackageSearch size={40}/></div>}</div>
      <div className="product-detail-copy">
        <span className="category-chip inline-chip">{product.category}</span>
        <p className="product-shop-link"><a href={'/'+profile.slug}>{profile.businessName||product.shopName}</a></p>
        <h1>{product.name}</h1>
        <div className="detail-price-row"><p className="detail-price">UGX {formatted}</p>{product.negotiable&&<span className="negotiable-detail-badge">Slightly negotiable</span>}</div>
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
