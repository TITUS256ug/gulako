import { ArrowLeft, BadgeCheck, Check, MessageCircle, PackageSearch, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { trackShopEvent } from '../lib/traffic'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import type { Product } from '../data/mock'
import { addToCart } from '../lib/cart'
import { fetchPublicProduct, getStoreAccent } from '../lib/storeData'
import { productWhatsappMessage, whatsappUrl } from '../lib/whatsapp'
import { readDiscoveryData } from '../lib/discoveryData'
import type { StoreProfile } from '../lib/storeData'

export type ProductData={product:Product;profile:StoreProfile;logo:string}

export function ProductPage({ id, initialData = readDiscoveryData<ProductData>("product", id) }: { id: string; initialData?: ProductData | null }) {
  const [data,setData]=useState<ProductData|null>(initialData ?? null)
  const [ready,setReady]=useState(initialData !== undefined)
  const [activeImage,setActiveImage]=useState(initialData?.product.images?.[0] || initialData?.product.image || '')
  const [added,setAdded]=useState(false)

  useEffect(()=>{
    let active=true
    if(initialData !== undefined){if(initialData)void trackShopEvent(initialData.profile.slug,'product_view');return}
    fetchPublicProduct(id).then(result=>{
      if(!active)return
      setData(result)
      if(result){
        void trackShopEvent(result.profile.slug,'product_view')
        const images=result.product.images?.length?result.product.images:(result.product.image?[result.product.image]:[])
        setActiveImage(images[0]??'')
      }
      setReady(true)
    })
    return()=>{active=false}
  },[id])

  const images=useMemo(()=>{
    if(!data)return[]
    return data.product.images?.length?data.product.images:(data.product.image?[data.product.image]:[])
  },[data])

  if(!ready)return null

  if(!data){
    return <div className="app-shell"><Header/><main className="page-container product-page">
      <a className="back-link" href="/"><ArrowLeft size={17}/> Back</a>
      <section className="empty-state product-empty"><PackageSearch size={30}/><h2>Product unavailable</h2><p>This product is not currently published.</p></section>
    </main><Footer/></div>
  }

  const {product,profile,logo}=data
  const formatted=new Intl.NumberFormat('en-UG').format(product.price)
  const style={ '--shop-accent': getStoreAccent(profile) } as CSSProperties
  const whatsappMessage=productWhatsappMessage(product,profile.businessName||product.shopName)
  const whatsappHref=whatsappUrl(profile.whatsapp,whatsappMessage)
  const add=()=>{
    addToCart(product)
    void trackShopEvent(profile.slug,'cart_add')
    setAdded(true)
    window.setTimeout(()=>setAdded(false),1400)
  }
  const buy=()=>{
    addToCart(product)
    void trackShopEvent(profile.slug,'cart_add')
    window.location.href='/checkout?buy=1'
  }

  return <div className="app-shell customer-storefront premium-product-page" style={style}><Header/><main className="page-container product-page">
    <a className="back-link premium-back-link" href={'/'+profile.slug}><ArrowLeft size={17}/> Back to {profile.businessName}</a>

    <section className="premium-product-detail">
      <div className="product-gallery-shell">
        <div className="product-detail-image premium-product-main-image">
          {activeImage?<img src={activeImage} alt={product.name}/>:<div className="product-image-placeholder"><PackageSearch size={42}/></div>}
        </div>
        {images.length>1&&<div className="product-thumb-row">
          {images.map((image,index)=><button className={activeImage===image?'product-thumb active':'product-thumb'} onClick={()=>setActiveImage(image)} key={image} aria-label={'View product photo '+(index+1)}>
            <img src={image} alt=""/>
          </button>)}
        </div>}
      </div>

      <div className="product-detail-copy premium-product-copy">
        <div className="product-shop-identity">
          {logo?<img src={logo} alt={profile.businessName}/>:<span>{profile.businessName.slice(0,1).toUpperCase()}</span>}
          <div><small>Sold by</small><a href={'/'+profile.slug}>{profile.businessName||product.shopName}</a>{profile.locationVerified&&<span className="verified-location-mark compact" title="Business location verified by Gulako" aria-label="Business location verified by Gulako"><BadgeCheck size={18}/></span>}</div>
        </div>

        <span className="category-chip inline-chip">{product.category}</span>
        <h1>{product.name}</h1>
        <div className="detail-price-row"><p className="detail-price">{product.currency} {formatted}</p>{product.negotiable&&<span className="negotiable-detail-badge">Slightly negotiable</span>}</div>
        {product.description&&<p className="detail-description">{product.description}</p>}

        <div className="premium-product-benefits">
          <span><Check size={17}/> {product.stock} in stock</span>
          <span><ShieldCheck size={17}/> Direct from seller</span>
          {profile.deliveryInfo&&<span><Truck size={17}/> {profile.deliveryInfo}</span>}
        </div>

        <div className="mobile-money-hint"><Sparkles size={18}/><div><strong>Direct merchant checkout</strong><span>Buy now takes you to the seller's MTN MoMoPay or Airtel Money Pay merchant code when available.</span></div></div>

        <div className="product-cta-stack premium-product-actions">
          <button className="primary-button large full-width" onClick={buy}><ShoppingBag size={19}/> Buy now</button>
          <button className={added?'soft-button large full-width added':'soft-button large full-width'} onClick={add}>{added?<Check size={18}/>:<ShoppingBag size={18}/>} {added?'Added to cart':'Add to cart'}</button>
          {whatsappHref&&<a className="whatsapp-product premium-whatsapp-button" href={whatsappHref} onClick={()=>void trackShopEvent(profile.slug,'whatsapp_click')} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Chat on WhatsApp</a>}
        </div>
        <small className="browser-cart-note">Your cart is saved on this browser so you can come back later.</small>
      </div>
    </section>
  </main><Footer/></div>
}
