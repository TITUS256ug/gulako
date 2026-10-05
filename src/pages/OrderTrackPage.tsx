import { ArrowLeft, Check, Circle, MessageCircle, PackageSearch, RefreshCw, Store, Truck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { fetchPublicOrder, formatOrderStatus } from '../lib/orders'
import type { PublicOrder } from '../lib/orders'
import { fetchPublicShop } from '../lib/storeData'
import { whatsappUrl } from '../lib/whatsapp'

const money=(n:number)=>new Intl.NumberFormat('en-UG').format(n)
const steps=['new','confirmed','processing','delivering','completed'] as const

export function OrderTrackPage({ id }: { id: string }) {
  const [order,setOrder]=useState<PublicOrder|null>(null)
  const [sellerWhatsapp,setSellerWhatsapp]=useState('')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  const load=async()=>{
    try{
      const data=await fetchPublicOrder(id)
      setOrder(data)
      setError(data?'':'Order not found.')
      if(data?.shopSlug){
        const shop=await fetchPublicShop(data.shopSlug)
        setSellerWhatsapp(shop?.profile.whatsapp??'')
      }
    }catch(err){
      setError(err instanceof Error?err.message:'Could not load this order.')
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    void load()
    const timer=window.setInterval(()=>void load(),30000)
    return()=>window.clearInterval(timer)
  },[id])

  if(loading)return <div className="app-shell"><Header/><main className="page-container order-track-page"><section className="order-loading"><span className="save-spinner"/><strong>Loading your order…</strong></section></main></div>

  if(!order)return <div className="app-shell"><Header/><main className="page-container order-track-page">
    <a className="back-link" href="/"><ArrowLeft size={17}/> Back to Gulako</a>
    <section className="empty-state product-empty">
      <PackageSearch size={30}/>
      <h2>Order not found</h2>
      <p>{error||`No live order found for #${id}.`}</p>
      <a className="primary-button" href="/">Back to Gulako</a>
    </section>
  </main></div>

  const currentIndex=steps.indexOf(order.status as typeof steps[number])
  const message=whatsappUrl(sellerWhatsapp,`Hello ${order.shopName}, I am following up on my Gulako order ${order.publicRef}. Please assist me with the latest update. Thank you.`)

  return <div className="app-shell"><Header/><main className="page-container order-track-page live-order-page">
    <a className="back-link" href={'/'+order.shopSlug}><ArrowLeft size={17}/> Back to {order.shopName}</a>
    <section className="order-track-hero">
      <div><span className="section-kicker">Order tracking</span><h1>{order.publicRef}</h1><p>Placed with {order.shopName} on {new Date(order.createdAt).toLocaleString()}.</p></div>
      <div className="order-track-hero-actions"><span className={'status-pill '+order.status}>{formatOrderStatus(order.status)}</span><button className="soft-button" onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button></div>
    </section>

    {order.status==='cancelled'?<div className="order-cancelled-banner"><PackageSearch size={20}/><div><strong>This order was cancelled.</strong><span>Contact the seller if you need help or want to place another order.</span></div></div>:<section className="order-progress-card">
      <div className="order-progress-head"><div><h2>Order progress</h2><p>The seller updates this as your order moves forward.</p></div><Truck size={23}/></div>
      <div className="order-progress-steps">
        {steps.map((step,index)=>{
          const done=currentIndex>=index
          const active=currentIndex===index
          return <div className={done?'order-progress-step done':'order-progress-step'} key={step}><span>{done?<Check size={15}/>:<Circle size={13}/>}</span><div><strong>{formatOrderStatus(step)}</strong>{active&&<small>Current status</small>}</div></div>
        })}
      </div>
    </section>}

    <div className="order-track-grid live-order-grid">
      <section className="order-detail-card">
        <div className="order-detail-head"><div><span className="section-kicker">Items</span><h2>Your order</h2></div><strong>{order.currency} {money(order.total)}</strong></div>
        <div className="public-order-items">{order.items.map((item,index)=><div key={index}>{item.imageUrl?<img src={item.imageUrl} alt=""/>:<span className="public-order-placeholder"><PackageSearch size={18}/></span>}<div><strong>{item.name}</strong><small>{item.quantity} × {order.currency} {money(item.unitPrice)}</small></div><b>{order.currency} {money(item.lineTotal)}</b></div>)}</div>
        <div className="public-order-total"><span>Total</span><strong>{order.currency} {money(order.total)}</strong></div>
      </section>

      <aside className="order-detail-card order-help-card">
        <span className="order-help-icon"><Store size={22}/></span>
        <h2>{order.shopName}</h2>
        <p>Payment status: <strong>{order.paymentStatus==='confirmed'?'Confirmed by seller':order.paymentStatus==='reported'?'Reference submitted':'Not confirmed yet'}</strong></p>
        <p>Keep this page or order number so you can check for updates at any time.</p>
        {message&&<a className="primary-button full-width" href={message} target="_blank" rel="noreferrer"><MessageCircle size={17}/> Message seller</a>}
        <a className="soft-button full-width" href={'/'+order.shopSlug}>Visit shop</a>
      </aside>
    </div>
  </main></div>
}