import { ArrowUpRight, BarChart3, Check, CheckCircle2, Eye, ImagePlus, MessageCircle, MoreHorizontal, PackagePlus, Plus, Search, Settings2, ShoppingBag, Sparkles, Trash2, TrendingUp, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import { PricingSection } from '../components/PricingSection'
import { ShopLogoUpload } from '../components/ShopLogoUpload'
import { fileToDataUrl, getShopLogo } from '../lib/shopBrand'
import { accentColors, addSellerProduct, deleteSellerProduct, getSellerProducts, getStoreProfile, saveStoreProfile, slugifyStoreName } from '../lib/storeData'
import type { AccentName, StoreProfile } from '../lib/storeData'

const money=(n:number)=>new Intl.NumberFormat('en-UG').format(n)

function useStoreSnapshot(){
  const [profile,setProfile]=useState(()=>getStoreProfile())
  const [products,setProducts]=useState(()=>getSellerProducts())
  const [logo,setLogo]=useState(()=>getShopLogo())

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

  return {profile,products,logo}
}

function StoreHealth({profile,productCount,logo}:{profile:StoreProfile;productCount:number;logo:string}){
  const profileDone = Boolean(profile.businessName && profile.category && profile.location && profile.description && profile.whatsapp)
  const deliveryDone = Boolean(profile.deliveryInfo)
  const socialDone = Boolean(profile.instagram || profile.tiktok)
  const checks = [
    {label:'Complete business profile',done:profileDone,points:40},
    {label:'Add shop logo',done:Boolean(logo),points:10},
    {label:'Add shop cover',done:Boolean(profile.cover),points:10},
    {label:'Add your first product',done:productCount>0,points:25},
    {label:'Add delivery details',done:deliveryDone,points:10},
    {label:'Connect a social channel',done:socialDone,points:5},
  ]
  const score=checks.reduce((sum,item)=>sum+(item.done?item.points:0),0)
  const label=score>=85?'Excellent':score>=60?'Looking good':score>=30?'Getting there':'Set up your shop'

  return <aside className="dash-card premium-card health-premium">
    <div className="health-premium-head">
      <div><span className="section-kicker">Store readiness</span><h2>Store health</h2><p>{label}</p></div>
      <span className="health-status-pill">{score}% ready</span>
    </div>
    <div className="health-premium-body">
      <div className="health-ring" style={{background:`conic-gradient(var(--purple-2) ${score}%, var(--surface-3) 0)`}}>
        <div className="health-ring-inner"><strong>{score}</strong><span>/100</span></div>
      </div>
      <div className="health-checklist">
        {checks.slice(0,4).map(item=><div className={item.done?'health-check done':'health-check'} key={item.label}>
          <span>{item.done?<Check size={14}/>:<span className="health-dot"/>}</span>
          <div><strong>{item.label}</strong><small>{item.done?'Completed':`+${item.points} points`}</small></div>
        </div>)}
      </div>
    </div>
    <a className="soft-button full-width" href="/dashboard/store"><Settings2 size={17}/> Improve store</a>
  </aside>
}

export function DashboardHomePage(){
  const {profile,products,logo}=useStoreSnapshot()
  const count=products.length
  const usage=Math.min(100,(count/30)*100)

  return <DashboardShell title="Overview" subtitle="A quick look at your shop today." action={<a className="primary-button" href="/dashboard/products?add=1"><Plus size={17}/>Add product</a>}>
    <section className="dashboard-welcome">
      <div>
        <span className="dashboard-kicker"><Sparkles size={15}/> Free plan</span>
        <h2>{profile.businessName ? `Grow ${profile.businessName}.` : 'Build your shop.'}</h2>
        <p>{count} of 30 products active · unlimited orders.</p>
      </div>
      <div className="plan-usage">
        <div className="plan-usage-row"><span>Product capacity</span><strong>{count} / 30</strong></div>
        <div className="plan-progress"><span style={{width:`${usage}%`}}/></div>
        <a href="/dashboard/settings">View plans <ArrowUpRight size={14}/></a>
      </div>
    </section>

    <section className="metric-grid premium-metrics">
      <article><span className="metric-icon"><ShoppingBag size={20}/></span><div><small>Orders</small><strong>0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><TrendingUp size={20}/></span><div><small>Sales</small><strong>UGX 0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><Eye size={20}/></span><div><small>Shop views</small><strong>0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><Users size={20}/></span><div><small>Customers</small><strong>0</strong><em>No data yet</em></div></article>
    </section>

    <div className="dashboard-two-col">
      <section className="dash-card premium-card">
        <div className="dash-card-head"><div><h2>Recent orders</h2><p>New orders will appear here.</p></div><a href="/dashboard/orders">View orders</a></div>
        <div className="dashboard-empty-mini"><ShoppingBag size={22}/><strong>No orders yet</strong><span>Share your shop link to start selling.</span></div>
      </section>
      <StoreHealth profile={profile} productCount={count} logo={logo}/>
    </div>
  </DashboardShell>
}

export function DashboardProductsPage(){
  const {profile,products}=useStoreSnapshot()
  const [showForm,setShowForm]=useState(()=>new URLSearchParams(window.location.search).get('add')==='1')
  const [image,setImage]=useState('')
  const [error,setError]=useState('')
  const inputRef=useRef<HTMLInputElement>(null)

  const openForm=()=>{setShowForm(true);setError('');window.history.replaceState({},'', '/dashboard/products?add=1')}
  const closeForm=()=>{setShowForm(false);setImage('');setError('');window.history.replaceState({},'', '/dashboard/products')}

  const pickImage=async(file?:File)=>{
    if(!file)return
    if(!file.type.startsWith('image/')){setError('Choose a PNG, JPG or WEBP image.');return}
    if(file.size>1_500_000){setError('Product image must be smaller than 1.5 MB.');return}
    setImage(await fileToDataUrl(file))
    setError('')
  }

  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    if(products.length>=30){setError('Free plan supports up to 30 active products.');return}
    const form=new FormData(e.currentTarget)
    const name=String(form.get('name')||'').trim()
    const category=String(form.get('category')||'').trim()
    const price=Number(form.get('price')||0)
    const stock=Number(form.get('stock')||0)
    const description=String(form.get('description')||'').trim()
    if(!name || !category || price<=0){setError('Add a product name, category and valid price.');return}

    addSellerProduct({
      shopSlug:profile.slug,
      shopName:profile.businessName || 'Your shop',
      name,
      category,
      price,
      currency:'UGX',
      image,
      description,
      stock:Math.max(0,stock),
    })
    closeForm()
  }

  return <DashboardShell title="Products" subtitle="Manage what customers see in your shop." action={<button className="primary-button" onClick={openForm}><Plus size={17}/>Add product</button>}>
    {showForm && <section className="dash-card premium-card product-editor-card">
      <div className="dash-card-head"><div><span className="section-kicker">New product</span><h2>Add a product</h2><p>Products you save appear in your storefront preview.</p></div><button className="icon-button" onClick={closeForm} aria-label="Close"><X size={18}/></button></div>
      <form className="product-editor-form" onSubmit={submit}>
        <div className="product-image-editor">
          <button type="button" className="product-image-drop" onClick={()=>inputRef.current?.click()}>
            {image?<img src={image} alt="Product preview"/>:<><ImagePlus size={28}/><strong>Add product image</strong><span>PNG, JPG or WEBP</span></>}
          </button>
          <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e:ChangeEvent<HTMLInputElement>)=>pickImage(e.target.files?.[0])}/>
        </div>
        <div className="form-grid product-form-grid">
          <label className="wide"><span>Product name</span><input name="name" required placeholder="e.g. Classic leather bag"/></label>
          <label><span>Category</span><input name="category" required placeholder="e.g. Fashion"/></label>
          <label><span>Price (UGX)</span><input name="price" required type="number" min="1" placeholder="85000"/></label>
          <label><span>Stock</span><input name="stock" type="number" min="0" defaultValue="1"/></label>
          <label className="wide"><span>Description</span><textarea name="description" placeholder="Tell customers about this product"/></label>
        </div>
        {error&&<p className="form-error">{error}</p>}
        <div className="editor-actions"><button type="button" className="soft-button" onClick={closeForm}>Cancel</button><button className="primary-button" type="submit"><CheckCircle2 size={17}/>Save product</button></div>
      </form>
    </section>}

    <section className="dash-card premium-card">
      <div className="product-toolbar"><label className="dashboard-search"><Search size={17}/><input placeholder="Search products"/></label><span>{products.length} / 30 active on Free</span></div>
      {products.length ? <div className="inventory-grid">
        {products.map(p=><article className="inventory-card" key={p.id}>
          <div className="inventory-image">{p.image?<img src={p.image} alt={p.name}/>:<PackagePlus size={28}/>}</div>
          <div className="inventory-body"><div><small>{p.category}</small><strong>{p.name}</strong></div><button aria-label="Product options"><MoreHorizontal size={18}/></button><span>UGX {money(p.price)}</span><em>{p.stock} in stock</em></div>
          <button className="inventory-delete" onClick={()=>deleteSellerProduct(p.id)}><Trash2 size={14}/> Remove</button>
        </article>)}
        {products.length<30&&<button className="add-product-card" onClick={openForm}><PackagePlus size={26}/><strong>Add product</strong><span>{30-products.length} slots left on Free</span></button>}
      </div> : <button className="add-product-card empty-add-product" onClick={openForm}><PackagePlus size={30}/><strong>Add your first product</strong><span>30 product slots available on Free</span></button>}
    </section>
  </DashboardShell>
}

export function DashboardOrdersPage(){
  return <DashboardShell title="Orders" subtitle="Track and manage customer orders.">
    <section className="dash-card premium-card">
      <div className="dashboard-tabs"><button className="active">All <span>0</span></button><button>New <span>0</span></button><button>Confirmed</button><button>Delivering</button><button>Completed</button></div>
      <div className="dashboard-empty-large"><ShoppingBag size={28}/><h3>No orders yet</h3><p>Orders will appear here when customers buy from your storefront.</p></div>
    </section>
  </DashboardShell>
}

export function DashboardCustomersPage(){
  return <DashboardShell title="Customers" subtitle="People who have ordered from your shop.">
    <section className="dash-card premium-card">
      <div className="product-toolbar"><label className="dashboard-search"><Search size={17}/><input placeholder="Search customers"/></label><span>0 customers</span></div>
      <div className="dashboard-empty-large"><Users size={28}/><h3>No customers yet</h3><p>Your customer list will build automatically from orders.</p></div>
    </section>
  </DashboardShell>
}

export function DashboardAnalyticsPage(){
  return <DashboardShell title="Analytics" subtitle="Understand what’s working.">
    <section className="metric-grid premium-metrics"><article><span className="metric-icon"><BarChart3 size={20}/></span><div><small>Conversion</small><strong>0%</strong><em>No data yet</em></div></article><article><span className="metric-icon"><Eye size={20}/></span><div><small>Views</small><strong>0</strong><em>No data yet</em></div></article><article><span className="metric-icon"><ShoppingBag size={20}/></span><div><small>Orders</small><strong>0</strong><em>No data yet</em></div></article><article><span className="metric-icon"><TrendingUp size={20}/></span><div><small>Revenue</small><strong>UGX 0</strong><em>No data yet</em></div></article></section>
    <section className="dash-card premium-card analytics-card"><div className="dash-card-head"><div><h2>Sales trend</h2><p>Analytics starts when your shop receives traffic.</p></div></div><div className="analytics-empty"><BarChart3 size={30}/><span>No activity to chart yet</span></div></section>
  </DashboardShell>
}

export function DashboardStorePage(){
  const [profile,setProfile]=useState(()=>getStoreProfile())
  const [saved,setSaved]=useState(false)
  const [coverError,setCoverError]=useState('')
  const coverInput=useRef<HTMLInputElement>(null)

  const update=(key:keyof StoreProfile,value:string)=>{
    setProfile(current=>{
      const next={...current,[key]:value} as StoreProfile
      if(key==='businessName' && (current.slug==='my-shop' || !current.slug)) next.slug=slugifyStoreName(value)
      return next
    })
    setSaved(false)
  }

  const persist=(next=profile)=>{
    saveStoreProfile(next)
    setSaved(true)
    window.setTimeout(()=>setSaved(false),2400)
  }

  const chooseAccent=(accent:AccentName)=>{
    const next={...profile,accent}
    setProfile(next)
    saveStoreProfile(next)
    setSaved(true)
    window.setTimeout(()=>setSaved(false),1600)
  }

  const pickCover=async(file?:File)=>{
    if(!file)return
    if(!file.type.startsWith('image/')){setCoverError('Choose a PNG, JPG or WEBP image.');return}
    if(file.size>1_500_000){setCoverError('Cover image must be smaller than 1.5 MB.');return}
    const cover=await fileToDataUrl(file)
    const next={...profile,cover}
    setProfile(next)
    saveStoreProfile(next)
    setCoverError('')
    setSaved(true)
  }

  const previewHref=profile.businessName?`/shop/${profile.slug}`:'/dashboard/store'

  return <DashboardShell title="Store" subtitle="Customize how your business appears." action={<a className="soft-button" href={previewHref}><Eye size={17}/> Preview shop</a>}>
    <div className="dashboard-two-col store-editor-layout">
      <section className="dash-card premium-card form-card">
        <div className="store-card-title"><div><h2>Store profile</h2><p>These details appear on your storefront.</p></div>{saved&&<span className="save-success"><Check size={14}/> Saved</span>}</div>
        <ShopLogoUpload/>
        <div className="form-grid">
          <label className="wide"><span>Business name</span><input value={profile.businessName} onChange={e=>update('businessName',e.target.value)} placeholder="Your business name"/></label>
          <label><span>Category</span><input value={profile.category} onChange={e=>update('category',e.target.value)} placeholder="Business category"/></label>
          <label><span>Location</span><input value={profile.location} onChange={e=>update('location',e.target.value)} placeholder="Town, city or area"/></label>
          <label className="wide"><span>Shop link</span><div className="slug-input"><span>/shop/</span><input value={profile.slug} onChange={e=>update('slug',slugifyStoreName(e.target.value))}/></div></label>
          <label className="wide"><span>Description</span><textarea value={profile.description} onChange={e=>update('description',e.target.value)} placeholder="Describe your business"/></label>
          <label className="wide"><span>WhatsApp</span><input value={profile.whatsapp} onChange={e=>update('whatsapp',e.target.value)} placeholder="+256..."/></label>
          <label className="wide"><span>Google Maps / Plus Code</span><input value={profile.mapsLink} onChange={e=>update('mapsLink',e.target.value)} placeholder="Paste link or code"/></label>
          <label><span>TikTok</span><input value={profile.tiktok} onChange={e=>update('tiktok',e.target.value)} placeholder="@yourbusiness"/></label>
          <label><span>Instagram</span><input value={profile.instagram} onChange={e=>update('instagram',e.target.value)} placeholder="@yourbusiness"/></label>
          <label className="wide"><span>Delivery information</span><textarea value={profile.deliveryInfo} onChange={e=>update('deliveryInfo',e.target.value)} placeholder="Delivery areas, fees and pickup information"/></label>
        </div>
        <button className="primary-button" onClick={()=>persist()}><CheckCircle2 size={17}/> Save changes</button>
      </section>

      <aside className="dash-card premium-card brand-panel">
        <h2>Brand style</h2><p className="muted">Choose the accent customers see on your storefront.</p>
        <div className="accent-picker">
          {(Object.keys(accentColors) as AccentName[]).map(accent=><button
            key={accent}
            aria-label={accent}
            className={profile.accent===accent?`accent ${accent} active`:`accent ${accent}`}
            onClick={()=>chooseAccent(accent)}
          />)}
        </div>
        <div className="brand-preview-strip" style={{background:`linear-gradient(135deg,${accentColors[profile.accent]}, color-mix(in srgb, ${accentColors[profile.accent]} 32%, white))`}}>
          <span>Store accent preview</span>
        </div>
        <h3>Shop cover</h3>
        <button className={profile.cover?'upload-box cover-upload has-cover':'upload-box cover-upload'} onClick={()=>coverInput.current?.click()}>
          {profile.cover?<img src={profile.cover} alt="Shop cover preview"/>:<><Plus size={22}/><span>Add cover image</span></>}
        </button>
        <input ref={coverInput} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(e:ChangeEvent<HTMLInputElement>)=>pickCover(e.target.files?.[0])}/>
        {profile.cover&&<button className="text-danger-button" onClick={()=>{const next={...profile,cover:''};setProfile(next);saveStoreProfile(next)}}>Remove cover</button>}
        {coverError&&<p className="form-error">{coverError}</p>}
        <div className="brand-tip"><Sparkles size={17}/><div><strong>Tip</strong><span>Use a wide, clean image that represents your business.</span></div></div>
      </aside>
    </div>
  </DashboardShell>
}

export function DashboardSettingsPage(){
  const {products}=useStoreSnapshot()
  return <DashboardShell title="Settings" subtitle="Account, plan and business preferences.">
    <div className="settings-stack">
      <section className="dash-card premium-card settings-row"><div><h2>Current plan</h2><p>Free · {products.length} of 30 products active · unlimited orders</p></div><span className="current-plan-pill">Free</span></section>
      <section className="dash-card premium-card dashboard-pricing-wrap"><div className="dash-card-head"><div><h2>Plans & billing</h2><p>Upgrade when you need more products, maps or AI tools.</p></div></div><PricingSection compact/></section>
      <section className="dash-card premium-card settings-row"><div><h2>Login & security</h2><p>Authentication setup will connect here.</p></div><button className="soft-button">Manage</button></section>
      <section className="dash-card premium-card settings-row"><div><h2>Notifications</h2><p>Order alerts and business updates.</p></div><button className="soft-button">Configure</button></section>
    </div>
  </DashboardShell>
}
