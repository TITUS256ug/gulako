import { ArrowLeft, Check, Copy, MessageCircle, Phone, ShieldCheck, ShoppingBag, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { cartDetails } from '../lib/cart'
import { fetchPublicShop } from '../lib/storeData'
import type { StoreProfile } from '../lib/storeData'

type ShopPayment = {
  slug:string
  profile:StoreProfile
}

export function CheckoutPage() {
  const lines = cartDetails()
  const [shops,setShops]=useState<Record<string,ShopPayment>>({})
  const [copied,setCopied]=useState('')

  const groups=useMemo(()=>{
    const map=new Map<string,typeof lines>()
    for(const line of lines){
      const slug=line.product.shopSlug
      const current=map.get(slug)??[]
      current.push(line)
      map.set(slug,current)
    }
    return Array.from(map.entries())
  },[lines])

  useEffect(()=>{
    let active=true
    void Promise.all(groups.map(async([slug])=>{
      const data=await fetchPublicShop(slug)
      return data?{slug,profile:data.profile}:null
    })).then(results=>{
      if(!active)return
      const next:Record<string,ShopPayment>={}
      for(const item of results)if(item)next[item.slug]=item
      setShops(next)
    })
    return()=>{active=false}
  },[groups.length])

  const money=(n:number)=>new Intl.NumberFormat('en-UG').format(n)

  const copy=async(value:string,key:string)=>{
    await navigator.clipboard.writeText(value).catch(()=>undefined)
    setCopied(key)
    window.setTimeout(()=>setCopied(''),1200)
  }

  const openMoneyMenu=(network:string)=>{
    const code=network==='MTN MoMo'?'*165#':network==='Airtel Money'?'*185#':''
    if(!code)return
    window.location.href='tel:'+encodeURIComponent(code)
  }

  if (!lines.length) {
    return <div className="app-shell"><Header/><main className="page-container checkout-page">
      <a className="back-link" href="/cart"><ArrowLeft size={17}/> Back to cart</a>
      <section className="empty-state product-empty">
        <ShoppingBag size={30}/>
        <h2>Your cart is empty</h2>
        <p>Add a product before continuing to checkout.</p>
        <a className="primary-button" href="/demo">View demo shop</a>
      </section>
    </main><Footer/></div>
  }

  return <div className="app-shell premium-checkout-page"><Header/><main className="page-container checkout-page">
    <a className="back-link" href="/cart"><ArrowLeft size={17}/> Back to cart</a>
    <div className="checkout-heading premium-checkout-heading">
      <span className="section-kicker">Mobile Money checkout</span>
      <h1>Complete your payment</h1>
      <p>Pay each seller directly. Gulako shows the exact number and amount, then opens your network's Mobile Money menu for you to confirm on your phone.</p>
    </div>

    <div className="checkout-groups">
      {groups.map(([slug,group])=>{
        const payment=shops[slug]?.profile
        const subtotal=group.reduce((sum,line)=>sum+line.product.price*line.quantity,0)
        const whatsapp=payment?.whatsapp.replace(/\D/g,'')??''
        const summary=group.map(line=>`${line.quantity}x ${line.product.name}`).join(', ')
        const message=encodeURIComponent(`Hello ${payment?.businessName||group[0].product.shopName}, I want to pay UGX ${money(subtotal)} for ${summary}.`)
        const network=payment?.paymentNetwork??''
        const number=payment?.paymentNumber??''
        return <section className="checkout-seller-card" key={slug}>
          <div className="checkout-seller-head">
            <div><small>Paying</small><h2>{payment?.businessName||group[0].product.shopName}</h2><span>{group.reduce((sum,line)=>sum+line.quantity,0)} item{group.reduce((sum,line)=>sum+line.quantity,0)===1?'':'s'}</span></div>
            <strong>UGX {money(subtotal)}</strong>
          </div>

          <div className="checkout-item-list">
            {group.map(line=><div key={line.productId}><span>{line.quantity} × {line.product.name}</span><strong>UGX {money(line.product.price*line.quantity)}</strong></div>)}
          </div>

          {network&&number?<div className="momo-payment-card">
            <div className="momo-card-head"><span><Smartphone size={20}/></span><div><small>{network}</small><strong>{number}</strong></div></div>
            <div className="momo-copy-actions">
              <button onClick={()=>copy(number,slug+'number')}>{copied===slug+'number'?<Check size={16}/>:<Copy size={16}/>} {copied===slug+'number'?'Copied':'Copy number'}</button>
              <button onClick={()=>copy(String(subtotal),slug+'amount')}>{copied===slug+'amount'?<Check size={16}/>:<Copy size={16}/>} {copied===slug+'amount'?'Copied':'Copy amount'}</button>
            </div>
            <ol>
              <li>Tap <strong>Open {network}</strong>.</li>
              <li>Choose Send Money and enter <strong>{number}</strong>.</li>
              <li>Enter <strong>UGX {money(subtotal)}</strong> and confirm the recipient before entering your PIN.</li>
            </ol>
            <button className="primary-button large full-width momo-open-button" onClick={()=>openMoneyMenu(network)}><Phone size={18}/> Open {network} menu</button>
            <small className="payment-safety"><ShieldCheck size={14}/> Gulako never asks for your Mobile Money PIN. Your network handles confirmation.</small>
          </div>:<div className="momo-missing">
            <Smartphone size={21}/><div><strong>Mobile Money details not added yet</strong><span>Contact the seller to arrange payment.</span></div>
          </div>}

          {whatsapp&&<a className="soft-button full-width checkout-whatsapp" href={'https://wa.me/'+whatsapp+'?text='+message} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Confirm order with seller</a>}
        </section>
      })}
    </div>

    <p className="checkout-footnote">For now, Gulako facilitates direct seller payments. Automated payment confirmation will be added when a payment provider is connected.</p>
  </main><Footer/></div>
}
