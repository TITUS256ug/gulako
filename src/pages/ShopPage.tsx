import { ExternalLink, Instagram, Link2, Map, MapPin, MessageCircle, Search, ShoppingBag, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { getShopLogo } from '../lib/shopBrand'
import { accentColors, getSellerProducts, getStoreProfile } from '../lib/storeData'

export function ShopPage({ slug }: { slug?: string }) {
  const [profile,setProfile]=useState(()=>getStoreProfile())
  const [products,setProducts]=useState(()=>getSellerProducts())
  const [logo,setLogo]=useState(()=>getShopLogo())
  const [query,setQuery]=useState('')
  const [category,setCategory]=useState('All products')

  useEffect(()=>{
    const refresh=()=>{
      setProfile(getStoreProfile())
      setProducts(getSellerProducts())
      setLogo(getShopLogo())
    }
    window.addEventListener('gulako-store',refresh)
    window.addEventListener('gulako-products',refresh)
    window.addEventListener('gulako-brand',refresh)
    return()=>{
      window.removeEventListener('gulako-store',refresh)
      window.removeEventListener('gulako-products',refresh)
      window.removeEventListener('gulako-brand',refresh)
    }
  },[])

  const published=Boolean(profile.businessName && slug===profile.slug)
  const categories=['All products',...Array.from(new Set(products.map(item=>item.category)))]
  const visibleProducts=useMemo(()=>{
    const q=query.trim().toLowerCase()
    return products.filter(item=>{
      const matchesCategory=category==='All products'||item.category===category
      const matchesQuery=!q||(item.name+' '+item.category+' '+item.description).toLowerCase().includes(q)
      return matchesCategory&&matchesQuery
    }).map(item=>({...item,shopName:profile.businessName||item.shopName,shopSlug:profile.slug}))
  },[products,profile.businessName,profile.slug,query,category])

  const shareShop=async()=>{
    const url=window.location.href
    if(navigator.share) await navigator.share({title:profile.businessName,url}).catch(()=>undefined)
    else {
      await navigator.clipboard.writeText(url).catch(()=>undefined)
      window.alert('Shop link copied')
    }
  }

  if(!published){
    return <div className="app-shell">
      <Header compact/>
      <main><div className="page-container">
        <div className="context-strip"><Store size={16}/> Gulako storefront</div>
        <section className="shop-empty-page">
          <div className="shop-empty-icon"><Store size={30}/></div>
          <span className="section-kicker">Storefront</span>
          <h1>This shop is not published yet.</h1>
          <p>Set up your business details in the seller dashboard, then preview your storefront here.</p>
          <div className="home-actions"><a className="primary-button" href="/dashboard/store">Set up store</a><a className="soft-button" href="/">Back to Gulako</a></div>
        </section>
      </div></main>
      <Footer/>
    </div>
  }

  const accent=accentColors[profile.accent]
  const whatsapp=profile.whatsapp.replace(/\D/g,'')
  const instagramUrl=profile.instagram?'https://instagram.com/'+profile.instagram.replace(/^@/,''):''
  const style={ '--shop-accent': accent } as CSSProperties

  return <div className="app-shell" style={style}>
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
