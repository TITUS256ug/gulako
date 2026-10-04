import { MapPin, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Header } from '../components/Header'
import { Footer } from '../components/Footer'
import { ProductCard } from '../components/ProductCard'
import { products, shops } from '../data/mock'

export function ExplorePage() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'products'|'shops'>('products')
  const q = query.trim().toLowerCase()
  const visibleProducts = useMemo(() => products.filter(p => !q || `${p.name} ${p.category} ${p.shopName}`.toLowerCase().includes(q)), [q])
  const visibleShops = useMemo(() => shops.filter(s => !q || `${s.name} ${s.category} ${s.location}`.toLowerCase().includes(q)), [q])

  return <div className="app-shell">
    <Header />
    <main className="page-container explore-page">
      <section className="explore-intro"><span className="section-kicker">Explore Gulako</span><h1>Find something good.</h1><p>Products and independent businesses, all in one place.</p></section>
      <div className="explore-toolbar">
        <label className="big-search"><Search size={20}/><input value={query} onChange={(e: ChangeEvent<HTMLInputElement>)=>setQuery(e.target.value)} placeholder="Search products, shops or categories" /></label>
        <button className="filter-button"><SlidersHorizontal size={18}/> Filters</button>
      </div>
      <div className="switch-tabs"><button className={tab==='products'?'active':''} onClick={()=>setTab('products')}>Products <span>{visibleProducts.length}</span></button><button className={tab==='shops'?'active':''} onClick={()=>setTab('shops')}>Shops <span>{visibleShops.length}</span></button></div>
      {tab==='products' ? <div className="product-grid explore-grid">{visibleProducts.map(p=><ProductCard product={p} key={p.id}/>)}</div> : <div className="shop-grid explore-shops">{visibleShops.map(s=><a className="shop-card tall" href={`/shop/${s.slug}`} key={s.slug}><img src={s.image} alt={s.name}/><div className="shop-card-body"><span className="mini-avatar">{s.initials}</span><div><strong>{s.name}</strong><small><MapPin size={13}/> {s.location}</small></div><b>{s.rating}</b></div></a>)}</div>}
    </main>
    <Footer />
  </div>
}
