import { ArrowLeft, Check, Copy, MessageCircle, Phone, ShieldCheck, ShoppingBag, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { cartDetails } from '../lib/cart'
import { fetchPublicShop } from '../lib/storeData'
import { orderWhatsappMessage, whatsappUrl } from '../lib/whatsapp'
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

  const openMoneyMenu=(network:'MTN MoMoPay'|'Airtel Money Pay')=>{
    const code=network==='MTN MoMoPay'?'*165*3#':'*185*9#'
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
      <p>Pay each seller directly using their MTN MoMoPay or Airtel Money Pay merchant code. Gulako shows the exact code and amount, then opens the correct payment menu on your phone.</p>
    </div>

    <div className="checkout-groups">
      {groups.map(([slug,group])=>{
        const payment=shops[slug]?.profile
        const subtotal=group.reduce((sum,line)=>sum+line.product.price*line.quantity,0)
        const shopName=payment?.businessName||group[0].product.shopName
        const whatsappHref=payment?.whatsapp ? whatsappUrl(payment.whatsapp,orderWhatsappMessage(group,shopName,slug)) : ''
        const mtnCode=payment?.mtnMerchantCode?.trim()??''
        const airtelCode=payment?.airtelMerchantCode?.trim()??''
        const fallbackNetwork=payment?.paymentNetwork??''
        const fallbackNumber=payment?.paymentNumber??''
        return <section className="checkout-seller-card" key={slug}>
          <div className="checkout-seller-head">
            <div><small>Paying</small><h2>{payment?.businessName||group[0].product.shopName}</h2><span>{group.reduce((sum,line)=>sum+line.quantity,0)} item{group.reduce((sum,line)=>sum+line.quantity,0)===1?'':'s'}</span></div>
            <strong>UGX {money(subtotal)}</strong>
          </div>

          <div className="checkout-item-list">
            {group.map(line=><div key={line.productId}><span>{line.quantity} × {line.product.name}</span><strong>UGX {money(line.product.price*line.quantity)}</strong></div>)}
          </div>

          {mtnCode||airtelCode?<div className="merchant-payment-options">
            <div className="merchant-payment-title"><div><strong>Choose how to pay</strong><span>Pay this seller directly using their verified business payment details.</span></div><b>UGX {money(subtotal)}</b></div>
            {mtnCode&&<div className="merchant-pay-card mtn-pay">
              <div className="merchant-pay-brand"><span><img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/MTN_2022_logo.svg" alt="MTN"/></span><div><small>MTN MoMoPay merchant code</small><strong>{mtnCode}</strong></div></div>
              <div className="merchant-pay-actions">
                <button onClick={()=>copy(mtnCode,slug+'mtn')}>{copied===slug+'mtn'?<Check size={16}/>:<Copy size={16}/>} {copied===slug+'mtn'?'Copied':'Copy code'}</button>
                <button onClick={()=>copy(String(subtotal),slug+'mtnamount')}>{copied===slug+'mtnamount'?<Check size={16}/>:<Copy size={16}/>} Copy amount</button>
              </div>
              <p>Dial <strong>*165*3#</strong>, enter merchant code <strong>{mtnCode}</strong>, enter UGX {money(subtotal)}, confirm the business name, then enter your PIN.</p>
              <button className="primary-button large full-width merchant-launch mtn-launch" onClick={()=>openMoneyMenu('MTN MoMoPay')}><Phone size={18}/> Pay with MTN MoMo</button>
            </div>}
            {airtelCode&&<div className="merchant-pay-card airtel-pay">
              <div className="merchant-pay-brand"><span><img src="https://upload.wikimedia.org/wikipedia/commons/1/18/Airtel_logo.svg" alt="Airtel"/></span><div><small>Airtel Money Pay merchant ID</small><strong>{airtelCode}</strong></div></div>
              <div className="merchant-pay-actions">
                <button onClick={()=>copy(airtelCode,slug+'airtel')}>{copied===slug+'airtel'?<Check size={16}/>:<Copy size={16}/>} {copied===slug+'airtel'?'Copied':'Copy ID'}</button>
                <button onClick={()=>copy(String(subtotal),slug+'airtelamount')}>{copied===slug+'airtelamount'?<Check size={16}/>:<Copy size={16}/>} Copy amount</button>
              </div>
              <p>Dial <strong>*185*9#</strong>, enter merchant ID <strong>{airtelCode}</strong>, follow the Airtel Money Pay prompts and confirm on your phone.</p>
              <button className="primary-button large full-width merchant-launch airtel-launch" onClick={()=>openMoneyMenu('Airtel Money Pay')}><Phone size={18}/> Pay with Airtel Money</button>
            </div>}
            <small className="payment-safety"><ShieldCheck size={14}/> Always confirm the displayed recipient/business before entering your Mobile Money PIN. Gulako never sees your PIN.</small>
          </div>:fallbackNetwork&&fallbackNumber?<div className="momo-payment-card">
            <div className="momo-card-head"><span><Smartphone size={20}/></span><div><small>{fallbackNetwork}</small><strong>{fallbackNumber}</strong></div></div>
            <p className="legacy-payment-note">This seller has not added a merchant code yet. Use the number above only after confirming it with the seller.</p>
          </div>:<div className="momo-missing">
            <Smartphone size={21}/><div><strong>Merchant payment details not added yet</strong><span>Contact the seller to arrange payment.</span></div>
          </div>}

          {whatsappHref&&<a className="soft-button full-width checkout-whatsapp premium-whatsapp-button" href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Confirm order on WhatsApp</a>}
        </section>
      })}
    </div>

    <p className="checkout-footnote">For now, Gulako facilitates direct seller payments. Automated payment confirmation will be added when a payment provider is connected.</p>
  </main><Footer/></div>
}
