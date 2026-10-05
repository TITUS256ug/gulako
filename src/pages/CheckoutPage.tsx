import { ArrowLeft, Check, Copy, Phone, ShieldCheck, ShoppingBag, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Footer } from '../components/Footer'
import { Header } from '../components/Header'
import { cartDetails, getCart, saveCart } from '../lib/cart'
import { placePublicOrder } from '../lib/orders'
import { fetchPublicShop } from '../lib/storeData'
import type { StoreProfile } from '../lib/storeData'

type ShopPayment = {
  slug:string
  profile:StoreProfile
}

type BuyerDetails={
  name:string
  phone:string
  location:string
  note:string
}

export function CheckoutPage() {
  const lines = cartDetails()
  const [shops,setShops]=useState<Record<string,ShopPayment>>({})
  const [copied,setCopied]=useState('')
  const [buyer,setBuyer]=useState<BuyerDetails>({name:'',phone:'+256',location:'',note:''})
  const [methods,setMethods]=useState<Record<string,'mtn'|'airtel'|'other'>>({})
  const [references,setReferences]=useState<Record<string,string>>({})
  const [placing,setPlacing]=useState('')
  const [error,setError]=useState('')

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
      const defaults:Record<string,'mtn'|'airtel'|'other'>={}
      for(const item of results){
        if(!item)continue
        next[item.slug]=item
        defaults[item.slug]=item.profile.mtnMerchantCode?'mtn':item.profile.airtelMerchantCode?'airtel':'other'
      }
      setShops(next)
      setMethods(current=>({...defaults,...current}))
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

  const place=async(slug:string,group:typeof lines)=>{
    setError('')
    if(!buyer.name.trim()){setError('Enter your name before placing the order.');return}
    if(buyer.phone.replace(/\D/g,'').length<7){setError('Enter a valid phone or WhatsApp number.');return}
    if(!buyer.location.trim()){setError('Enter your delivery or pickup location.');return}
    if(slug==='demo'){setError('The demo shop is for testing the cart only. Open a real Gulako seller shop to place an order.');return}

    setPlacing(slug)
    try{
      const result=await placePublicOrder({
        shopSlug:slug,
        customerName:buyer.name,
        customerPhone:buyer.phone,
        deliveryLocation:buyer.location,
        note:buyer.note,
        paymentMethod:methods[slug]??'other',
        paymentReference:references[slug]??'',
        items:group.map(line=>({productId:line.productId,quantity:line.quantity})),
      })
      const ids=new Set(group.map(line=>line.productId))
      saveCart(getCart().filter(line=>!ids.has(line.productId)))
      window.location.assign('/order/'+encodeURIComponent(result.publicRef))
    }catch(err){
      setError(err instanceof Error?err.message:'Could not place your order. Please try again.')
      setPlacing('')
    }
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
      <span className="section-kicker">Direct seller checkout</span>
      <h1>Place your order</h1>
      <p>Pay the seller directly, then create a Gulako order so the seller can confirm, process and update your delivery status.</p>
    </div>

    <section className="checkout-customer-card">
      <div><span className="section-kicker">Your details</span><h2>Where should the seller reach you?</h2><p>Your details are shared only with the seller handling this order.</p></div>
      <div className="checkout-customer-grid">
        <label><span>Name</span><input value={buyer.name} onChange={e=>setBuyer(current=>({...current,name:e.target.value}))} placeholder="Your name" autoComplete="name"/></label>
        <label><span>Phone / WhatsApp</span><input value={buyer.phone} onChange={e=>setBuyer(current=>({...current,phone:e.target.value}))} placeholder="+256..." inputMode="tel" autoComplete="tel"/></label>
        <label className="wide"><span>Delivery / pickup location</span><input value={buyer.location} onChange={e=>setBuyer(current=>({...current,location:e.target.value}))} placeholder="Area, landmark or pickup preference"/></label>
        <label className="wide"><span>Order note (optional)</span><textarea value={buyer.note} onChange={e=>setBuyer(current=>({...current,note:e.target.value}))} placeholder="Size, colour, delivery instructions, etc."/></label>
      </div>
    </section>

    {error&&<p className="checkout-error">{error}</p>}

    <div className="checkout-groups">
      {groups.map(([slug,group])=>{
        const payment=shops[slug]?.profile
        const subtotal=group.reduce((sum,line)=>sum+line.product.price*line.quantity,0)
        const mtnCode=payment?.mtnMerchantCode?.trim()??''
        const airtelCode=payment?.airtelMerchantCode?.trim()??''
        const fallbackNetwork=payment?.paymentNetwork??''
        const fallbackNumber=payment?.paymentNumber??''
        const method=methods[slug]??(mtnCode?'mtn':airtelCode?'airtel':'other')
        return <section className="checkout-seller-card" key={slug}>
          <div className="checkout-seller-head">
            <div><small>Ordering from</small><h2>{payment?.businessName||group[0].product.shopName}</h2><span>{group.reduce((sum,line)=>sum+line.quantity,0)} item{group.reduce((sum,line)=>sum+line.quantity,0)===1?'':'s'}</span></div>
            <strong>UGX {money(subtotal)}</strong>
          </div>

          <div className="checkout-item-list">
            {group.map(line=><div key={line.productId}><span>{line.quantity} × {line.product.name}</span><strong>UGX {money(line.product.price*line.quantity)}</strong></div>)}
          </div>

          {mtnCode||airtelCode?<div className="merchant-payment-options">
            <div className="merchant-payment-title"><div><strong>Choose how to pay</strong><span>Pay this seller directly, then place the order below.</span></div><b>UGX {money(subtotal)}</b></div>
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
            <Smartphone size={21}/><div><strong>Merchant payment details not added yet</strong><span>You can still place the order and arrange payment with the seller.</span></div>
          </div>}

          <div className="order-payment-report">
            <label><span>Payment method</span><select value={method} onChange={e=>setMethods(current=>({...current,[slug]:e.target.value as 'mtn'|'airtel'|'other'}))}>{mtnCode&&<option value="mtn">MTN MoMo</option>}{airtelCode&&<option value="airtel">Airtel Money</option>}<option value="other">Arrange with seller</option></select></label>
            <label><span>Transaction ID / reference (optional)</span><input value={references[slug]??''} onChange={e=>setReferences(current=>({...current,[slug]:e.target.value}))} placeholder="Enter after payment if available"/></label>
          </div>

          <button className="primary-button large full-width place-order-button" disabled={placing===slug} onClick={()=>void place(slug,group)}>{placing===slug?'Creating order…':'Place order'}</button>
          <small className="checkout-order-note">After placing the order you’ll get a tracking page and can message the seller directly.</small>
        </section>
      })}
    </div>

    <p className="checkout-footnote">Gulako records the order and status, but the customer pays the seller directly. Automated payment confirmation will be added when a payment provider is connected.</p>
  </main><Footer/></div>
}