import { ExternalLink, Instagram, Link2, Map, MapPin, MessageCircle, Search, ShoppingBag, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import type { Product } from '../data/mock'
import { accentColors, fetchPublicShop, recordStoreView } from '../lib/storeData'
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
    fetchPublicShop(slug).then(data=>{
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
  const accent=accentColors[profile.accent]
  const whatsapp=profile.whatsapp.replace(/\D/g,'')
  const instagramUrl=profile.instagram?'https://instagram.com/'+profile.instagram.replace(/^@/,''):''
  const style={ '--shop-accent': accent } as CSSProperties

  return <div className="app-shell customer-storefront" style={style}>
    <Header compact onSearch={setQuery}/>
    <main>
      <div className="page-container">
        <div className="context-strip"><Store size={16}/> Independent storefront on Gulako</div>
        <section className="shop-hero-v2 live-shop-hero">
          <div className="shop-hero-content">
            {logo?<img className="shop-avatar shop-avatar-image" src={logo} alt={profile.businessName}/>:<div className="shop-avatar">{profile.businessName.slice(0,1).toUpperCase()}</div>}
            <div>
              <p className="eyebrow">Welcome to our shop</p>
              <h1>{profile.businessName}</h1>
              {profile.description&&<p className="hero-description">{profile.description}</p>}
              <div className="shop-meta-actions">
                {profile.location&&<span className="shop-location"><MapPin size={18}/>{profile.location}</span>}
                {profile.mapsLink&&<a href={profile.mapsLink} target="_blank" rel="noreferrer"><Map size={18}/> Directions <ExternalLink size={13}/></a>}
                {whatsapp&&<a href={'https://wa.me/'+whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={18}/> WhatsApp</a>}
                {instagramUrl&&<a href={instagramUrl} target="_blank" rel="noreferrer"><Instagram size={18}/> Instagram</a>}
              </div>
            </div>
          </div>
          <button className="share-button" onClick={shareShop}><Link2 size={18}/> Share shop</button>
          {profile.cover&&<div className="shop-hero-image"><img src={profile.cover} alt="Shop cover"/></div>}
        </section>

        <section className="catalog-section">
          <div className="catalog-heading-row">
            <div><div className="title-with-count"><h2>Products</h2><span className="count-pill">{visibleProducts.length}</span></div><p>Order directly from this shop.</p></div>
            <label className="catalog-search"><Search size={18}/><input placeholder="Search products..." value={query} onChange={(e:ChangeEvent<HTMLInputElement>)=>setQuery(e.target.value)}/></label>
          </div>
          {categories.length>1&&<div className="category-tabs">{categories.map(item=><button className={item===category?'category-tab active':'category-tab'} key={item} onClick={()=>setCategory(item)}>{item}</button>)}</div>}
          {visibleProducts.length?<div className="product-grid">{visibleProducts.map(item=><ProductCard product={item} key={item.id}/>)}</div>:<div className="empty-state storefront-products-empty"><ShoppingBag size={26}/><h3>No products yet</h3><p>This seller has not published products yet.</p></div>}
        </section>
      </div>
    </main>
    <Footer/>
  </div>
}
