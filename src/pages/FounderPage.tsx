import { BadgeCheck, Check, Crown, Landmark, MapPin, Save, Search, ShieldCheck, Smartphone, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { backend } from '../lib/backend'
import { SignOutButton } from '../components/SignOutButton'

type Row={
  id:string
  email:string
  full_name:string|null
  role:string
  plan:'free'|'pro'|'business'
}
type VerifiedShopRow={
  shop_id:string
  owner_id:string
  business_name:string
  slug:string
  location:string
  maps_link:string
  plan:'free'|'pro'|'business'
  is_verified:boolean
  verified_at:string|null
}
type BillingSettings={
  mtn_merchant_code:string
  airtel_merchant_code:string
  bank_name:string
  bank_account_name:string
  bank_account_number:string
  bank_swift:string
  bank_country:string
  bank_branch:string
  bank_currency:string
}
type UpgradeRequest={
  id:string
  user_id:string
  requested_plan:'pro'|'business'
  payment_method:'mtn'|'airtel'|'bank'
  transaction_ref:string
  note:string
  status:'pending'|'approved'|'rejected'
  created_at:string
  currency:string
  amount:number|null
}

const blankBilling:BillingSettings={mtn_merchant_code:'',airtel_merchant_code:'',bank_name:'',bank_account_name:'',bank_account_number:'',bank_swift:'',bank_country:'',bank_branch:'',bank_currency:'USD'}

export function FounderPage(){
  const [rows,setRows]=useState<Row[]>([])
  const [requests,setRequests]=useState<UpgradeRequest[]>([])
  const [shops,setShops]=useState<VerifiedShopRow[]>([])
  const [reviewingShop,setReviewingShop]=useState<string|null>(null)
  const [billing,setBilling]=useState<BillingSettings>(blankBilling)
  const [query,setQuery]=useState('')
  const [state,setState]=useState<'loading'|'denied'|'ready'>('loading')
  const [message,setMessage]=useState('')
  const [savingBilling,setSavingBilling]=useState(false)

  const load=async()=>{
    const {data:{user}}=await backend.auth.getUser()
    if(!user){window.location.replace('/signin');return}
    const {data:me}=await backend.from('profiles').select('role').eq('id',user.id).maybeSingle()
    if(me?.role!=='founder'&&me?.role!=='admin'){setState('denied');return}
    const [{data:profiles},{data:settings},{data:upgradeRows},{data:verifiedShops,error:shopsError}]=await Promise.all([
      backend.from('profiles').select('id,email,full_name,role,plan').order('created_at',{ascending:false}),
      backend.from('billing_settings').select('mtn_merchant_code,airtel_merchant_code,bank_name,bank_account_name,bank_account_number,bank_swift,bank_country,bank_branch,bank_currency').eq('id',true).maybeSingle(),
      backend.from('plan_upgrade_requests').select('id,user_id,requested_plan,payment_method,transaction_ref,note,status,created_at,currency,amount').order('created_at',{ascending:false}).limit(30),
      backend.rpc('gulako_founder_shops_for_verification'),
    ])
    setRows((profiles??[]) as Row[])
    if(settings)setBilling({...blankBilling,...settings})
    setRequests((upgradeRows??[]) as UpgradeRequest[])
    if(!shopsError)setShops((verifiedShops??[]) as VerifiedShopRow[])
    else setMessage('Verification list unavailable: '+shopsError.message)
    setState('ready')
  }

  useEffect(()=>{void load()},[])

  const visible=useMemo(()=>{
    const q=query.trim().toLowerCase()
    if(!q)return rows
    return rows.filter(row=>(row.email+' '+(row.full_name??'')+' '+row.plan).toLowerCase().includes(q))
  },[rows,query])

  const changePlan=async(id:string,plan:'free'|'pro'|'business',reason='Founder dashboard')=>{
    setMessage('')
    const {error}=await backend.rpc('set_user_plan',{target_user:id,new_plan:plan,expires_at:null,reason})
    if(error){setMessage(error.message);return false}
    setRows(current=>current.map(row=>row.id===id?{...row,plan}:row))
    setMessage('Plan updated.')
    return true
  }

  const saveBilling=async()=>{
    setSavingBilling(true);setMessage('')
    const {data:{user}}=await backend.auth.getUser()
    if(!user)return
    const {error}=await backend.from('billing_settings').upsert({id:true,...billing,updated_by:user.id,updated_at:new Date().toISOString()})
    setMessage(error?error.message:'Billing payment details saved.')
    setSavingBilling(false)
  }

  const review=async(request:UpgradeRequest,status:'approved'|'rejected')=>{
    setMessage('')
    if(status==='approved'){
      const ok=await changePlan(request.user_id,request.requested_plan,'Approved manual billing request '+request.transaction_ref)
      if(!ok)return
    }
    const {data:{user}}=await backend.auth.getUser()
    const {error}=await backend.from('plan_upgrade_requests').update({
      status,reviewed_at:new Date().toISOString(),reviewed_by:user?.id??null,
    }).eq('id',request.id)
    if(error){setMessage(error.message);return}
    setRequests(current=>current.map(item=>item.id===request.id?{...item,status}:item))
    setMessage(status==='approved'?'Payment approved and plan activated.':'Upgrade request rejected.')
  }

  const reviewLocation=async(shop:VerifiedShopRow,verify:boolean)=>{
    if(verify && (shop.plan!=='business'||!shop.location.trim()||!shop.maps_link.trim())){
      setMessage('Only Business-plan shops with a location and Maps link / Plus Code can be verified.')
      return
    }
    const verb=verify?'verify':'revoke verification for'
    const note=window.prompt('Reason for '+verb+' '+shop.business_name+' (minimum 8 characters). Record how you checked its location:')
    if(note===null)return
    if(note.trim().length<8){setMessage('Please enter at least 8 characters explaining your decision.');return}
    if(!window.confirm((verify?'Confirm this Business plan is paid and you personally checked the exact physical location of ':'Revoke the verified location badge for ')+shop.business_name+'?'))return
    setReviewingShop(shop.shop_id);setMessage('')
    try{
      const {error}=await backend.rpc('gulako_set_shop_verified',{p_shop_id:shop.shop_id,p_verified:verify,p_review_note:note.trim()})
      if(error)throw error
      setMessage(verify?'Business location verified.':'Business location verification revoked.')
      await load()
    }catch(err){setMessage(err instanceof Error?err.message:'Could not change verification.')}
    finally{setReviewingShop(null)}
  }

  const userLabel=(id:string)=>{
    const row=rows.find(item=>item.id===id)
    return row ? (row.full_name||row.email) : 'Seller'
  }

  if(state==='loading')return null
  if(state==='denied')return <main className="founder-denied"><ShieldCheck size={34}/><h1>Founder access only</h1><p>Sign in with your founder account to manage Gulako.</p><a className="primary-button" href="/dashboard">Back to dashboard</a><SignOutButton /></main>

  return <main className="founder-page">
    <header className="founder-header"><div><span className="section-kicker"><Crown size={15}/> Founder</span><h1>Founder dashboard</h1><p>Manage seller plans, billing and access.</p></div><div className="founder-account-actions"><a className="soft-button" href="/dashboard">Seller dashboard</a><SignOutButton /></div></header>

    <section className="founder-summary">
      <article><small>Users</small><strong>{rows.length}</strong></article>
      <article><small>Pro</small><strong>{rows.filter(row=>row.plan==='pro').length}</strong></article>
      <article><small>Business</small><strong>{rows.filter(row=>row.plan==='business').length}</strong></article>
      <article><small>Pending upgrades</small><strong>{requests.filter(row=>row.status==='pending').length}</strong></article>
    </section>

    <section className="founder-card founder-billing-settings">
      <div className="founder-card-title"><div><span className="section-kicker"><Smartphone size={14}/> Manual billing</span><h2>How sellers pay Gulako</h2><p>Use direct Mobile Money merchant codes or a bank account. No gateway integration is required.</p></div><button className="primary-button" onClick={()=>void saveBilling()} disabled={savingBilling}><Save size={16}/>{savingBilling?'Saving…':'Save payment details'}</button></div>
      <div className="founder-billing-grid">
        <label><span>Uganda merchant code</span><input value={billing.mtn_merchant_code} onChange={e=>setBilling({...billing,mtn_merchant_code:e.target.value.replace(/\D/g,'')})} placeholder="7111441"/></label>
        <label><span>Bank name</span><input value={billing.bank_name} onChange={e=>setBilling({...billing,bank_name:e.target.value})} placeholder="Centenary Bank"/></label>
        <label><span>Account name</span><input value={billing.bank_account_name} onChange={e=>setBilling({...billing,bank_account_name:e.target.value})} placeholder="Account name"/></label>
        <label><span>Account number</span><input value={billing.bank_account_number} onChange={e=>setBilling({...billing,bank_account_number:e.target.value})} placeholder="Account number"/></label>
        <label><span>SWIFT / BIC</span><input value={billing.bank_swift} onChange={e=>setBilling({...billing,bank_swift:e.target.value.toUpperCase()})} placeholder="CERBUGKA"/></label>
        <label><span>Bank country</span><input value={billing.bank_country} onChange={e=>setBilling({...billing,bank_country:e.target.value})} placeholder="Uganda"/></label>
        <label><span>Branch</span><input value={billing.bank_branch} onChange={e=>setBilling({...billing,bank_branch:e.target.value})} placeholder="Mapeera"/></label>
        <label><span>Receiving currency</span><select value={billing.bank_currency} onChange={e=>setBilling({...billing,bank_currency:e.target.value})}><option value="USD">USD</option><option value="UGX">UGX</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></label>
      </div>
      {message&&<p className="founder-message">{message}</p>}
    </section>

    <section className="founder-card">
      <div className="founder-card-title"><div><span className="section-kicker"><Landmark size={14}/> Upgrade requests</span><h2>Payments awaiting review</h2></div></div>
      <div className="founder-requests">
        {requests.filter(item=>item.status==='pending').length===0?<div className="founder-empty">No pending upgrade requests.</div>:requests.filter(item=>item.status==='pending').map(item=><article key={item.id}>
          <div><strong>{userLabel(item.user_id)}</strong><small>{item.requested_plan.toUpperCase()} · {item.currency} {item.amount??''} · {item.payment_method.toUpperCase()} · {item.transaction_ref}</small>{item.note&&<em>{item.note}</em>}</div>
          <div className="founder-request-actions"><button className="approve" onClick={()=>void review(item,'approved')}><Check size={15}/> Approve</button><button className="reject" onClick={()=>void review(item,'rejected')}><X size={15}/> Reject</button></div>
        </article>)}
      </div>
    </section>

    <section className="founder-card">
      <div className="founder-card-title"><div><span className="section-kicker"><BadgeCheck size={14}/> Business plan feature</span><h2>Verified business locations</h2><p>Only mark a Business-plan shop verified after checking its physical location and directions. Changing the location or downgrading removes the badge automatically.</p></div></div>
      <div className="founder-verification-list">
        {shops.length===0?<div className="founder-empty">No shops available for location verification.</div>:shops.map(shop=><article className="founder-verification-row" key={shop.shop_id}>
          <div className="founder-verification-info"><strong>{shop.business_name||'Unnamed business'} {shop.is_verified&&<BadgeCheck size={18} className="founder-verified-blue" aria-label="Verified location"/>}</strong><small>{shop.plan.toUpperCase()} · {userLabel(shop.owner_id)} · gulako.site/{shop.slug}</small><span><MapPin size={15}/>{shop.location||'Location missing'}</span><span>{shop.maps_link?(/^https:\/\//i.test(shop.maps_link)?<a href={shop.maps_link} target="_blank" rel="noreferrer">View supplied map</a>:<em>Plus Code: {shop.maps_link}</em>):'Map link / Plus Code missing'}</span><small>{shop.is_verified&&shop.verified_at?'Verified '+new Date(shop.verified_at).toLocaleDateString():'Not verified'}</small></div>
          <div className="founder-verification-actions"><button type="button" disabled={reviewingShop===shop.shop_id||(!shop.is_verified&&(shop.plan!=='business'||!shop.location.trim()||!shop.maps_link.trim()))} className={shop.is_verified?'soft-button':'primary-button'} onClick={()=>void reviewLocation(shop,!shop.is_verified)}>{shop.is_verified?<><X size={16}/> Revoke</>:<><BadgeCheck size={17}/> Verify</>}</button></div>
        </article>)}
      </div>
    </section>

    <section className="founder-card">
      <div className="founder-toolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or email"/></label></div>
      <div className="founder-users">
        {visible.map(row=><article key={row.id}>
          <div><strong>{row.full_name||'Seller'}</strong><small>{row.email}</small></div>
          <span className={'founder-role '+row.role}>{row.role}</span>
          <select value={row.plan} onChange={e=>void changePlan(row.id,e.target.value as 'free'|'pro'|'business')}>
            <option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option>
          </select>
        </article>)}
      </div>
    </section>
  </main>
}
