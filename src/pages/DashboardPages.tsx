import { ArrowUpRight, BarChart3, Check, CheckCircle2, Copy, Eye, ImagePlus, Link2, MessageCircle, MoreHorizontal, PackagePlus, Pencil, Plus, Search, Settings2, ShoppingBag, Sparkles, Trash2, TrendingUp, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import { PricingSection } from '../components/PricingSection'
import { ShopLogoUpload } from '../components/ShopLogoUpload'
import { backend } from '../lib/backend'
import { getShopLogo } from '../lib/shopBrand'
import { BUSINESS_CATEGORIES, accentColors, addSellerProduct, checkStoreSlugAvailability, deleteSellerProduct, duplicateSellerProduct, getSellerProducts, getStoreProfile, getStoreViews, hydrateSellerData, saveStoreProfile, slugifyStoreName, updateSellerProduct, uploadSellerAsset, validateStoreSlug } from '../lib/storeData'
import type { AccentName, StoreProfile } from '../lib/storeData'

const money=(n:number)=>new Intl.NumberFormat('en-UG').format(n)

type Plan='free'|'pro'|'business'
function useAccountPlan(){
  const [plan,setPlan]=useState<Plan>('free')
  useEffect(()=>{
    void (async()=>{
      const {data:{user}}=await backend.auth.getUser()
      if(!user)return
      const {data}=await backend.from('profiles').select('plan').eq('id',user.id).maybeSingle()
      if(data?.plan)setPlan(data.plan as Plan)
    })()
  },[])
  const limit=plan==='free'?100:plan==='pro'?250:null
  return{plan,limit}
}

function useStoreSnapshot(){
  const [profile,setProfile]=useState(()=>getStoreProfile())
  const [products,setProducts]=useState(()=>getSellerProducts())
  const [logo,setLogo]=useState(()=>getShopLogo())
  const [views,setViews]=useState(()=>getStoreViews())

  useEffect(()=>{
    void hydrateSellerData()
    const refresh=()=>{
      setProfile(getStoreProfile())
      setProducts(getSellerProducts())
      setLogo(getShopLogo())
      setViews(getStoreViews())
    }
    window.addEventListener('gulako-store',refresh)
    window.addEventListener('gulako-products',refresh)
    window.addEventListener('gulako-brand',refresh)
    window.addEventListener('gulako-analytics',refresh)
    return()=>{
      window.removeEventListener('gulako-store',refresh)
      window.removeEventListener('gulako-products',refresh)
      window.removeEventListener('gulako-brand',refresh)
      window.removeEventListener('gulako-analytics',refresh)
    }
  },[])

  return {profile,products,logo,views}
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
  const {profile,products,logo,views}=useStoreSnapshot()
  const {plan,limit}=useAccountPlan()
  const count=products.length
  const usage=limit?Math.min(100,(count/limit)*100):100
  const planLabel=plan.charAt(0).toUpperCase()+plan.slice(1)

  return <DashboardShell title="Overview" subtitle="A quick look at your shop today." action={<a className="primary-button" href="/dashboard/products?add=1"><Plus size={17}/>Add product</a>}>
    <section className="dashboard-welcome">
      <div>
        <span className="dashboard-kicker"><Sparkles size={15}/> {planLabel} plan</span>
        <h2>{profile.businessName ? `Grow ${profile.businessName}.` : 'Build your shop.'}</h2>
        <p>{limit?`${count} of ${limit} products active`:`${count} products active · unlimited products`} · unlimited orders.</p>
      </div>
      <div className="plan-usage">
        <div className="plan-usage-row"><span>Product capacity</span><strong>{limit?`${count} / ${limit}`:`${count} / Unlimited`}</strong></div>
        <div className="plan-progress"><span style={{width:`${usage}%`}}/></div>
        <a href="/dashboard/settings">View plans <ArrowUpRight size={14}/></a>
      </div>
    </section>

    <section className="metric-grid premium-metrics">
      <article><span className="metric-icon"><ShoppingBag size={20}/></span><div><small>Orders</small><strong>0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><TrendingUp size={20}/></span><div><small>Sales</small><strong>UGX 0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><Eye size={20}/></span><div><small>Shop views</small><strong>{views}</strong><em>Total storefront visits</em></div></article>
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
  const {plan,limit}=useAccountPlan()
  const [showForm,setShowForm]=useState(()=>new URLSearchParams(window.location.search).get('add')==='1')
  const [editingId,setEditingId]=useState<string|null>(null)
  const [images,setImages]=useState<string[]>([])
  const [error,setError]=useState('')
  const inputRef=useRef<HTMLInputElement>(null)
  const editingProduct=editingId ? products.find(product=>product.id===editingId) : undefined

  const openForm=(productId?:string)=>{
    const product=productId ? products.find(item=>item.id===productId) : undefined
    setEditingId(product?.id ?? null)
    setImages(product?.images?.length ? product.images : (product?.image ? [product.image] : []))
    setShowForm(true)
    setError('')
    window.history.replaceState({},'', product ? '/dashboard/products?edit='+product.id : '/dashboard/products?add=1')
  }
  const closeForm=()=>{
    setShowForm(false)
    setEditingId(null)
    setImages([])
    setError('')
    window.history.replaceState({},'', '/dashboard/products')
  }

  const pickImages=async(files?:FileList|null)=>{
    if(!files?.length)return
    const incoming=Array.from(files)
    if(images.length+incoming.length>5){setError('You can add up to 5 photos per product.');return}
    if(incoming.some(file=>!file.type.startsWith('image/'))){setError('Choose PNG, JPG or WEBP images.');return}
    if(incoming.some(file=>file.size>1_500_000)){setError('Each product image must be smaller than 1.5 MB.');return}
    try{
      const uploaded=await Promise.all(incoming.map(file=>uploadSellerAsset(file,'product')))
      setImages(current=>[...current,...uploaded].slice(0,5))
      setError('')
    }catch(err){
      setError(err instanceof Error?err.message:'Could not upload product images.')
    }
  }

  const removeImage=(url:string)=>setImages(current=>current.filter(item=>item!==url))

  const submit=(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    if(!editingId && limit!==null && products.length>=limit){setError(`${plan.charAt(0).toUpperCase()+plan.slice(1)} plan supports up to ${limit} active products.`);return}
    const form=new FormData(e.currentTarget)
    const name=String(form.get('name')||'').trim()
    const category=String(form.get('category')||'').trim()
    const price=Number(form.get('price')||0)
    const stock=Number(form.get('stock')||0)
    const description=String(form.get('description')||'').trim()
    const negotiable=form.get('negotiable')==='on'
    if(!name || !category || price<=0){setError('Add a product name, category and valid price.');return}

    const payload={
      shopSlug:profile.slug,
      shopName:profile.businessName || 'Your shop',
      name,
      category,
      price,
      currency:'UGX',
      image:images[0]??'',
      images,
      description,
      stock:Math.max(0,stock),
      negotiable,
    }
    if(editingId) updateSellerProduct(editingId,payload)
    else addSellerProduct(payload)
    closeForm()
  }

  return <DashboardShell title="Products" subtitle="Manage what customers see in your shop." action={<button className="primary-button" onClick={()=>openForm()}><Plus size={17}/>Add product</button>}>
    {showForm && <section className="dash-card premium-card product-editor-card">
      <div className="dash-card-head"><div><span className="section-kicker">{editingId?'Edit product':'New product'}</span><h2>{editingId?'Edit product':'Add a product'}</h2><p>{editingId?'Update this product and save your changes.':'Products you save appear in your storefront preview.'}</p></div><button className="icon-button" onClick={closeForm} aria-label="Close"><X size={18}/></button></div>
      <form key={editingId ?? 'new-product'} className="product-editor-form" onSubmit={submit}>
        <div className="product-image-editor gallery-editor">
          <div className="product-gallery-editor">
            {images.map((url,index)=><div className="product-gallery-thumb" key={url}>
              <img src={url} alt={`Product photo ${index+1}`}/>
              {index===0&&<span>Main</span>}
              <button type="button" onClick={()=>removeImage(url)} aria-label="Remove image"><X size={14}/></button>
            </div>)}
            {images.length<5&&<button type="button" className="product-image-drop compact-drop" onClick={()=>inputRef.current?.click()}>
              <ImagePlus size={25}/><strong>{images.length?'Add another photo':'Add product photos'}</strong><span>{images.length}/5 photos · PNG, JPG or WEBP</span>
            </button>}
          </div>
          <input ref={inputRef} hidden multiple type="file" accept="image/png,image/jpeg,image/webp" onChange={(e:ChangeEvent<HTMLInputElement>)=>pickImages(e.target.files)}/>
        </div>
        <div className="form-grid product-form-grid">
          <label className="wide"><span>Product name</span><input name="name" required defaultValue={editingProduct?.name ?? ''} placeholder="e.g. Classic leather bag"/></label>
          <label><span>Category</span><input name="category" required defaultValue={editingProduct?.category ?? ''} placeholder="e.g. Fashion"/></label>
          <label><span>Price (UGX)</span><input name="price" required type="number" min="1" defaultValue={editingProduct?.price ?? ''} placeholder="85000"/></label>
          <label className="negotiable-option"><span>Price option</span><span className="check-row negotiable-check"><input name="negotiable" type="checkbox" defaultChecked={Boolean(editingProduct?.negotiable)}/> Slightly negotiable</span></label>
          <label><span>Stock</span><input name="stock" type="number" min="0" defaultValue={editingProduct?.stock ?? 1}/></label>
          <label className="wide"><span>Description</span><textarea name="description" defaultValue={editingProduct?.description ?? ''} placeholder="Tell customers about this product"/></label>
        </div>
        {error&&<p className="form-error">{error}</p>}
        <div className="editor-actions"><button type="button" className="soft-button" onClick={closeForm}>Cancel</button><button className="primary-button" type="submit"><CheckCircle2 size={17}/>{editingId?'Save changes':'Save product'}</button></div>
      </form>
    </section>}

    <section className="dash-card premium-card">
      <div className="product-toolbar"><label className="dashboard-search"><Search size={17}/><input placeholder="Search products"/></label><span>{limit?`${products.length} / ${limit} active on ${plan}`:`${products.length} active · unlimited on Business`}</span></div>
      {products.length ? <div className="inventory-grid">
        {products.map(p=><article className="inventory-card" key={p.id}>
          <div className="inventory-image">{p.image?<img src={p.image} alt={p.name}/>:<PackagePlus size={28}/>}</div>
          <div className="inventory-body"><div><small>{p.category}</small><strong>{p.name}</strong></div><button aria-label="Product options"><MoreHorizontal size={18}/></button><span>UGX {money(p.price)}</span><em>{p.negotiable?'Slightly negotiable':`${p.stock} in stock`}</em></div>
          <div className="inventory-card-actions"><div className="inventory-primary-actions"><button className="inventory-edit" onClick={()=>openForm(p.id)}><Pencil size={14}/> Edit</button><button className="inventory-duplicate" onClick={()=>duplicateSellerProduct(p.id)}><Copy size={14}/> Duplicate</button></div><button className="inventory-delete" onClick={()=>deleteSellerProduct(p.id)}><Trash2 size={14}/> Remove</button></div>
        </article>)}
        {(limit===null||products.length<limit)&&<button className="add-product-card" onClick={()=>openForm()}><PackagePlus size={26}/><strong>Add product</strong><span>{limit===null?'Unlimited product slots':`${limit-products.length} slots left on ${plan}`}</span></button>}
      </div> : <button className="add-product-card empty-add-product" onClick={()=>openForm()}><PackagePlus size={30}/><strong>Add your first product</strong><span>100 product slots available on Free</span></button>}
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
  const {views}=useStoreSnapshot()
  return <DashboardShell title="Analytics" subtitle="Understand what’s working.">
    <section className="metric-grid premium-metrics"><article><span className="metric-icon"><BarChart3 size={20}/></span><div><small>Conversion</small><strong>0%</strong><em>Orders not connected yet</em></div></article><article><span className="metric-icon"><Eye size={20}/></span><div><small>Store views</small><strong>{views}</strong><em>Total storefront visits</em></div></article><article><span className="metric-icon"><ShoppingBag size={20}/></span><div><small>Orders</small><strong>0</strong><em>No orders yet</em></div></article><article><span className="metric-icon"><TrendingUp size={20}/></span><div><small>Revenue</small><strong>UGX 0</strong><em>No sales yet</em></div></article></section>
    <section className="dash-card premium-card analytics-card"><div className="dash-card-head"><div><h2>Store visits</h2><p>Every storefront visit is counted, including your own previews.</p></div><span className="analytics-total">{views}</span></div><div className="analytics-view-visual"><div className="analytics-view-orb"><Eye size={28}/><strong>{views}</strong><span>Total storefront views</span></div><div className="analytics-view-copy"><strong>{views}</strong><span>total visits recorded</span><small>Views update whenever the storefront is opened or refreshed.</small></div></div></section>
  </DashboardShell>
}

export function DashboardStorePage(){
  const [profile,setProfile]=useState(()=>getStoreProfile())
  const [saved,setSaved]=useState(false)
  const [saving,setSaving]=useState(false)
  const [coverError,setCoverError]=useState('')
  const [storeError,setStoreError]=useState('')
  const [slugMessage,setSlugMessage]=useState(()=>validateStoreSlug(getStoreProfile().slug,getStoreProfile().slug))
  const coverInput=useRef<HTMLInputElement>(null)

  useEffect(()=>{
    void hydrateSellerData().then(()=>{
      const next=getStoreProfile()
      setProfile(next)
      setSlugMessage(validateStoreSlug(next.slug,next.slug))
    })
  },[])

  const update=(key:keyof StoreProfile,value:string)=>{
    setProfile(current=>{
      const next={...current,[key]:value} as StoreProfile
      if(key==='slug') setSlugMessage(validateStoreSlug(String(value),current.slug))
      return next
    })
    setSaved(false)
  }

  const persist=async(next=profile)=>{
    setStoreError('')
    setSaving(true)
    const checked=await checkStoreSlugAvailability(next.slug,getStoreProfile().slug)
    setSlugMessage(checked)
    if(!checked.valid){setSaving(false);return}
    const cleaned={...next,slug:checked.slug}
    setProfile(cleaned)
    try{
      await saveStoreProfile(cleaned)
      setSaved(true)
      window.setTimeout(()=>window.location.assign('/dashboard'),900)
    }catch(err){
      setSaving(false)
      setStoreError(err instanceof Error?err.message:'Could not save your store.')
    }
  }

  const chooseAccent=(accent:AccentName)=>{
    const next={...profile,accent}
    setProfile(next)
    void saveStoreProfile(next)
    setSaved(true)
    window.setTimeout(()=>setSaved(false),1600)
  }

  const pickCover=async(file?:File)=>{
    if(!file)return
    if(!file.type.startsWith('image/')){setCoverError('Choose a PNG, JPG or WEBP image.');return}
    if(file.size>1_500_000){setCoverError('Cover image must be smaller than 1.5 MB.');return}
    try{
      const cover=await uploadSellerAsset(file,'cover')
      const next={...profile,cover}
      setProfile(next)
      await saveStoreProfile(next)
      setCoverError('')
      setSaved(true)
    }catch(err){
      setCoverError(err instanceof Error?err.message:'Could not upload cover image.')
    }
  }

  const previewHref=profile.businessName&&slugMessage.valid?`/${profile.slug}`:'/dashboard/store'

  return <DashboardShell title="Store" subtitle="Customize how your business appears." action={<a className="soft-button" href={previewHref} target={profile.businessName&&slugMessage.valid?'_blank':undefined} rel={profile.businessName&&slugMessage.valid?'noreferrer':undefined}><Eye size={17}/> Preview shop</a>}>
    <div className="dashboard-two-col store-editor-layout">
      <section className="dash-card premium-card form-card">
        <div className="store-card-title"><div><h2>Store profile</h2><p>These details appear on your storefront.</p></div>{saved&&<span className="save-success"><Check size={14}/> Saved</span>}</div>
        <ShopLogoUpload/>
        <div className="form-grid">
          <label className="wide"><span>Business name</span><input value={profile.businessName} onChange={e=>update('businessName',e.target.value)} placeholder="Your business name"/></label>
          <label><span>Category</span><select value={profile.category} onChange={e=>update('category',e.target.value)}><option value="">Select category</option>{BUSINESS_CATEGORIES.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
          <label><span>Location</span><input value={profile.location} onChange={e=>update('location',e.target.value)} placeholder="Town, city or area"/></label>
          <label className="wide premium-link-field"><span>Shop link</span><div className={slugMessage.valid?'slug-input clean-shop-link premium valid':'slug-input clean-shop-link premium'}><span className="shop-link-prefix"><Link2 size={16}/><b>gulako.site</b><em>/</em></span><input value={profile.slug} onChange={e=>update('slug',slugifyStoreName(e.target.value))} inputMode="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="yourshop"/></div><small className={slugMessage.valid?'slug-status available':'slug-status unavailable'}>{slugMessage.valid?<><Check size={12}/> Nice — gulako.site/{profile.slug} is available.</>:<><X size={12}/> {slugMessage.message}</>}</small><small className="field-hint">Choose a clean shop link using only letters and numbers.</small></label>
          <label className="wide"><span>Description</span><textarea value={profile.description} onChange={e=>update('description',e.target.value)} placeholder="Describe your business"/></label>
          <label className="wide"><span>WhatsApp</span><input value={profile.whatsapp} onChange={e=>update('whatsapp',e.target.value)} placeholder="+256..."/></label>
          <div className="wide merchant-setup">
            <div className="merchant-setup-head"><div><span className="section-kicker">Get paid directly</span><h3>Merchant payment codes</h3><p>Add either or both. Customers pay your business directly from checkout.</p></div></div>
            <div className="merchant-code-grid">
              <label className="merchant-code-card mtn">
                <span className="merchant-brand"><img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/MTN_2022_logo.svg" alt="MTN"/><b>MTN MoMoPay</b></span>
                <input value={profile.mtnMerchantCode} onChange={e=>update('mtnMerchantCode',e.target.value.replace(/\D/g,'').slice(0,12))} inputMode="numeric" placeholder="6-digit merchant code"/>
                <small>Customers pay through *165*3# using this merchant code.</small>
              </label>
              <label className="merchant-code-card airtel">
                <span className="merchant-brand"><img src="https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg" alt="Airtel"/><b>Airtel Money Pay</b></span>
                <input value={profile.airtelMerchantCode} onChange={e=>update('airtelMerchantCode',e.target.value.replace(/[^a-zA-Z0-9]/g,'').slice(0,20))} inputMode="text" autoCapitalize="characters" placeholder="Merchant number / ID"/>
                <small>Customers pay through *185*9# using this merchant ID.</small>
              </label>
            </div>
            <small className="merchant-security-note">Gulako never asks you or your customers for a Mobile Money PIN.</small>
          </div>
          <label className="wide"><span>Google Maps / Plus Code</span><input value={profile.mapsLink} onChange={e=>update('mapsLink',e.target.value)} placeholder="Paste link or code"/></label>
          <label><span>TikTok</span><input value={profile.tiktok} onChange={e=>update('tiktok',e.target.value)} placeholder="@yourbusiness"/></label>
          <label><span>Instagram</span><input value={profile.instagram} onChange={e=>update('instagram',e.target.value)} placeholder="@yourbusiness"/></label>
          <label className="wide"><span>Delivery information</span><textarea value={profile.deliveryInfo} onChange={e=>update('deliveryInfo',e.target.value)} placeholder="Delivery areas, fees and pickup information"/></label>
        </div>
        {storeError&&<p className="form-error">{storeError}</p>}<button className={saving?'primary-button saving':'primary-button'} onClick={()=>void persist()} disabled={saving||!slugMessage.valid}>{saving?<span className="save-spinner"/>:<CheckCircle2 size={17}/>} {saving?'Saving your store…':'Save changes'}</button>
        {saved&&<div className="store-save-toast"><span><Check size={18}/></span><div><strong>Store saved</strong><small>Taking you back to Overview…</small></div></div>}
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
        {profile.cover&&<button className="text-danger-button" onClick={()=>{const next={...profile,cover:''};setProfile(next);void saveStoreProfile(next)}}>Remove cover</button>}
        {coverError&&<p className="form-error">{coverError}</p>}
        <div className="brand-tip"><Sparkles size={17}/><div><strong>Tip</strong><span>Use a wide, clean image that represents your business.</span></div></div>
      </aside>
    </div>
  </DashboardShell>
}

export function DashboardSettingsPage(){
  const {products}=useStoreSnapshot()
  const {plan,limit}=useAccountPlan()
  const planLabel=plan.charAt(0).toUpperCase()+plan.slice(1)
  return <DashboardShell title="Settings" subtitle="Account, plan and business preferences.">
    <div className="settings-stack">
      <section className="dash-card premium-card settings-row"><div><h2>Current plan</h2><p>{planLabel} · {limit?`${products.length} of ${limit} products active`:`${products.length} products active · unlimited products`} · unlimited orders</p></div><span className="current-plan-pill">{planLabel}</span></section>
      <section className="dash-card premium-card dashboard-pricing-wrap"><div className="dash-card-head"><div><h2>Plans & billing</h2><p>Upgrade when you need more products, maps or AI tools.</p></div></div><PricingSection compact/></section>
      <section className="dash-card premium-card settings-row"><div><h2>Login & security</h2><p>Authentication setup will connect here.</p></div><button className="soft-button">Manage</button></section>
      <section className="dash-card premium-card settings-row"><div><h2>Notifications</h2><p>Order alerts and business updates.</p></div><button className="soft-button">Configure</button></section>
    </div>
  </DashboardShell>
}
