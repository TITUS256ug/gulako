import { ExternalLink, Instagram, Link2, Map, MapPin, MessageCircle, Search, ShoppingBag, Sparkles, Store, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import type { Product } from '../data/mock'
import { fetchPublicShop, getStoreAccent, recordStoreView } from '../lib/storeData'
import { shopWhatsappMessage, whatsappUrl } from '../lib/whatsapp'
import type { StoreProfile } from '../lib/storeData'

type PublicShopData={
  profile:StoreProfile
  logo:string
  views:number
  products:Product[]
}

export function ShopPage({ slug }: { slug?: string }) {
  const [shop,setShop]=useState<PublicShopData|null>(null)
  const [ready,setReady]=useState(false)
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('All products')

  useEffect(()=>{
    let active=true
    if(!slug){setReady(true);return}
    fetchPublicShop(slug).then(async data=>{
      if(!active)return
      setShop(data)
      setReady(true)
      if(data)void recordStoreView(slug)
    })
    return()=>{active=false}
  },[slug])

  const categories=useMemo(()=>['All products',...Array.from(new Set((shop?.products??[]).map(item=>item.category)))],[shop?.products])

  const visibleProducts=useMemo(()=>{
    if(!shop)return[]
    const q=query.trim().toLowerCase()
    return shop.products.filter(item=>{
      const matchesCategory=category==='All products'||item.category===category
      const matchesQuery=!q||(item.name+' '+item.category+' '+item.description).toLowerCase().includes(q)
      return matchesCategory&&matchesQuery
    })
  },[shop,query,category])

  const shareShop=async()=>{
    const url=window.location.href
    if(navigator.share) await navigator.share({title:shop?.profile.businessName||'Gulako shop',url}).catch(()=>undefined)
    else {
      await navigator.clipboard.writeText(url).catch(()=>undefined)
      window.alert('Shop link copied')
    }
  }

  if(!ready)return null

  if(!shop){
    return <div className="app-shell">
      <Header compact/>
      <main><div className="page-container">
        <div className="context-strip"><Store size={16}/> Gulako storefront</div>
        <section className="shop-empty-page">
          <div className="shop-empty-icon"><Store size={30}/></div>
          <span className="section-kicker">Storefront</span>
          <h1>This shop is not available.</h1>
          <p>The seller may still be setting it up, or the shop link may have changed.</p>
          <div className="home-actions"><a className="soft-button" href="/">Back to Gulako</a></div>
        </section>
      </div></main>
      <Footer/>
    </div>
  }

  const {profile,logo}=shop
  const accent=getStoreAccent(profile)
  const whatsappHref=whatsappUrl(profile.whatsapp,shopWhatsappMessage(profile.businessName,profile.slug))
  const instagramUrl=profile.instagram?'https://instagram.com/'+profile.instagram.replace(/^@/,''):''
  const style={ '--shop-accent': accent } as CSSProperties

  return <div className="app-shell customer-storefront premium-shop-page" style={style}>
    <Header compact onSearch={setQuery}/>
    <main>
      <div className="page-container">
        <section className={profile.cover?'premium-shop-hero has-cover':'premium-shop-hero'} style={profile.cover?{backgroundImage:`linear-gradient(90deg,rgba(20,12,35,.86),rgba(20,12,35,.55)),url("${profile.cover}")`}:undefined}>
          <div className="premium-shop-hero-copy">
            <div className="premium-shop-logo-wrap">
              {logo?<img className="premium-shop-logo" src={logo} alt={profile.businessName}/>:<div className="premium-shop-logo fallback">{profile.businessName.slice(0,1).toUpperCase()}</div>}
            </div>
            <div>
              <span className="premium-shop-eyebrow"><Sparkles size={14}/> Welcome to {profile.businessName}</span>
              <h1>{profile.businessName}</h1>
              {profile.description&&<p>{profile.description}</p>}
              <div className="premium-shop-meta">
                {profile.category&&<span><Store size={16}/>{profile.category}</span>}
                {profile.location&&<span><MapPin size={16}/>{profile.location}</span>}
                {profile.deliveryInfo&&<span><Truck size={16}/>Delivery available</span>}
              </div>
            </div>
          </div>

          <div className="premium-shop-actions">
            <button className="premium-share" onClick={shareShop}><Link2 size={17}/> Share shop</button>
            {whatsappHref&&<a className="premium-whatsapp-button" href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Chat on WhatsApp</a>}
            {profile.mapsLink&&<a href={profile.mapsLink} target="_blank" rel="noreferrer"><Map size={17}/> Directions <ExternalLink size={12}/></a>}
            {instagramUrl&&<a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={17}/> Instagram</a>}
          </div>
        </section>

        <section className="premium-catalog-shell">
          <div className="catalog-heading-row premium-catalog-head">
            <div>
              <span className="section-kicker">Shop collection</span>
              <div className="title-with-count"><h2>Products</h2><span className="count-pill">{visibleProducts.length}</span></div>
              <p>Browse and order directly from {profile.businessName}.</p>
            </div>
            <label className="catalog-search premium-shop-search"><Search size={18}/><input placeholder={'Search '+profile.businessName+'...'} value={query} onChange={(e:ChangeEvent<HTMLInputElement>)=>setQuery(e.target.value)}/></label>
          </div>

          {categories.length>1&&<div className="category-tabs premium-category-tabs">{categories.map(item=><button className={item===category?'category-tab active':'category-tab'} key={item} onClick={()=>setCategory(item)}>{item}</button>)}</div>}

          {visibleProducts.length?<div className="product-grid premium-product-grid">{visibleProducts.map(item=><ProductCard product={item} key={item.id}/>)}</div>:<div className="empty-state storefront-products-empty"><ShoppingBag size={26}/><h3>No products found</h3><p>Try another search or category.</p></div>}
        </section>
      </div>
    </main>
    <Footer/>
  </div>
}
