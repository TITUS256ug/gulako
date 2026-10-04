import { ExternalLink, Instagram, Link2, Map, MapPin, MessageCircle, Search, ShoppingBag, Store } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { ProductCard } from '../components/ProductCard'
import { products, shops } from '../data/mock'
import { getShopLogo } from '../lib/shopBrand'

export function ShopPage({ slug }: { slug?: string }) {
  const currentShop = shops.find(s => s.slug === slug) ?? shops[0]
  const shopProducts = products.filter(p => p.shopSlug === currentShop.slug)
  const categories = ['All products', ...Array.from(new Set(shopProducts.map(p => p.category)))]
  const [category, setCategory] = useState('All products')
  const [query, setQuery] = useState('')
  const [logo,setLogo]=useState(()=>getShopLogo())

  useEffect(()=>{
    const refresh=()=>setLogo(getShopLogo())
    window.addEventListener('gulako-brand',refresh)
    return()=>window.removeEventListener('gulako-brand',refresh)
  },[])

  const visibleProducts = useMemo(() => shopProducts.filter(p => {
    const matchesCategory = category === 'All products' || p.category === category
    const q = query.trim().toLowerCase()
    return matchesCategory && (!q || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q))
  }), [shopProducts, category, query])

  const shareShop = async () => {
    const url = window.location.href
    if (navigator.share) await navigator.share({ title: currentShop.name, url }).catch(() => undefined)
    else { await navigator.clipboard.writeText(url).catch(() => undefined); window.alert('Shop link copied') }
  }

  return <div className="app-shell"><Header compact onSearch={setQuery}/><main><div className="page-container"><div className="context-strip"><Store size={16}/> Independent shop on Gulako</div><section className="shop-hero-v2"><div className="shop-hero-content">{logo && currentShop.slug==='nile-ai-solutions' ? <img className="shop-avatar shop-avatar-image" src={logo} alt={currentShop.name}/> : <div className="shop-avatar">{currentShop.initials}</div>}<div><p className="eyebrow">Welcome to our shop</p><h1>{currentShop.name}</h1><p className="hero-description">{currentShop.description}</p><div className="shop-meta-actions"><span className="shop-location"><MapPin size={18}/>{currentShop.location}</span><a href={currentShop.mapUrl} target="_blank" rel="noreferrer"><Map size={18}/> Maps <ExternalLink size={13}/></a><a href={`https://wa.me/${currentShop.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18}/> WhatsApp</a><a href="#"><Instagram size={18}/> Instagram</a></div></div></div><button className="share-button" onClick={shareShop}><Link2 size={18}/> Share shop</button><div className="shop-hero-image"><img src={currentShop.image} alt=""/></div></section>
      <section className="catalog-section"><div className="catalog-heading-row"><div><div className="title-with-count"><h2>Find your next favourite</h2><span className="count-pill">{visibleProducts.length}</span></div><p>No account needed. Order your way.</p></div><label className="catalog-search"><Search size={18}/><input placeholder="Search products..." value={query} onChange={(e: ChangeEvent<HTMLInputElement>)=>setQuery(e.target.value)}/></label></div><div className="category-tabs">{categories.map(item=><button className={item===category?'category-tab active':'category-tab'} key={item} onClick={()=>setCategory(item)}>{item}</button>)}</div>{visibleProducts.length?<div className="product-grid">{visibleProducts.map(p=><ProductCard product={p} key={p.id}/>)}</div>:<div className="empty-state"><Search size={26}/><h3>No products found</h3><p>Try another search.</p></div>}</section></div></main><section className="seller-cta page-container"><div><p className="eyebrow">Sell on Gulako</p><h2>Want a shop like this?</h2><p>Start free with up to 30 active products and unlimited orders.</p></div><a className="light-button" href="/signup"><ShoppingBag size={18}/> Create your shop</a></section><Footer/></div>
}
