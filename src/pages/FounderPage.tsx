import { Check, Crown, Landmark, Save, Search, ShieldCheck, Smartphone, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { backend } from '../lib/backend'

type Row={
  id:string
  email:string
  full_name:string|null
  role:string
  plan:'free'|'pro'|'business'
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
    const [{data:profiles},{data:settings},{data:upgradeRows}]=await Promise.all([
      backend.from('profiles').select('id,email,full_name,role,plan').order('created_at',{ascending:false}),
      backend.from('billing_settings').select('mtn_merchant_code,airtel_merchant_code,bank_name,bank_account_name,bank_account_number').eq('id',true).maybeSingle(),
      backend.from('plan_upgrade_requests').select('id,user_id,requested_plan,payment_method,transaction_ref,note,status,created_at').order('created_at',{ascending:false}).limit(30),
    ])
    setRows((profiles??[]) as Row[])
    if(settings)setBilling({...blankBilling,...settings})
    setRequests((upgradeRows??[]) as UpgradeRequest[])
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

  const userLabel=(id:string)=>{
    const row=rows.find(item=>item.id===id)
    return row ? (row.full_name||row.email) : 'Seller'
  }

  if(state==='loading')return null
  if(state==='denied')return <main className="founder-denied"><ShieldCheck size={34}/><h1>Founder access only</h1><a className="primary-button" href="/dashboard">Back to dashboard</a></main>

  return <main className="founder-page">
    <header className="founder-header"><div><span className="section-kicker"><Crown size={15}/> Founder</span><h1>Founder dashboard</h1><p>Manage seller plans, billing and access.</p></div><a className="soft-button" href="/dashboard">Seller dashboard</a></header>

    <section className="founder-summary">
      <article><small>Users</small><strong>{rows.length}</strong></article>
      <article><small>Pro</small><strong>{rows.filter(row=>row.plan==='pro').length}</strong></article>
      <article><small>Business</small><strong>{rows.filter(row=>row.plan==='business').length}</strong></article>
      <article><small>Pending upgrades</small><strong>{requests.filter(row=>row.status==='pending').length}</strong></article>
    </section>

    <section className="founder-card founder-billing-settings">
      <div className="founder-card-title"><div><span className="section-kicker"><Smartphone size={14}/> Manual billing</span><h2>How sellers pay Gulako</h2><p>Use direct Mobile Money merchant codes or a bank account. No gateway integration is required.</p></div><button className="primary-button" onClick={()=>void saveBilling()} disabled={savingBilling}><Save size={16}/>{savingBilling?'Saving…':'Save payment details'}</button></div>
      <div className="founder-billing-grid">
        <label><span>MTN MoMoPay merchant code</span><input value={billing.mtn_merchant_code} onChange={e=>setBilling({...billing,mtn_merchant_code:e.target.value.replace(/\D/g,'')})} placeholder="Merchant code"/></label>
        <label><span>Airtel Money Pay merchant ID</span><input value={billing.airtel_merchant_code} onChange={e=>setBilling({...billing,airtel_merchant_code:e.target.value.replace(/[^a-zA-Z0-9]/g,'')})} placeholder="Merchant ID"/></label>
        <label><span>Bank name</span><input value={billing.bank_name} onChange={e=>setBilling({...billing,bank_name:e.target.value})} placeholder="e.g. Stanbic Bank"/></label>
        <label><span>Account name</span><input value={billing.bank_account_name} onChange={e=>setBilling({...billing,bank_account_name:e.target.value})} placeholder="Nile AI Solutions"/></label>
        <label className="wide"><span>Account number</span><input value={billing.bank_account_number} onChange={e=>setBilling({...billing,bank_account_number:e.target.value})} placeholder="Bank account number"/></label>
      </div>
      {message&&<p className="founder-message">{message}</p>}
    </section>

    <section className="founder-card">
      <div className="founder-card-title"><div><span className="section-kicker"><Landmark size={14}/> Upgrade requests</span><h2>Payments awaiting review</h2></div></div>
      <div className="founder-requests">
        {requests.filter(item=>item.status==='pending').length===0?<div className="founder-empty">No pending upgrade requests.</div>:requests.filter(item=>item.status==='pending').map(item=><article key={item.id}>
          <div><strong>{userLabel(item.user_id)}</strong><small>{item.requested_plan.toUpperCase()} · {item.payment_method.toUpperCase()} · {item.transaction_ref}</small>{item.note&&<em>{item.note}</em>}</div>
          <div className="founder-request-actions"><button className="approve" onClick={()=>void review(item,'approved')}><Check size={15}/> Approve</button><button className="reject" onClick={()=>void review(item,'rejected')}><X size={15}/> Reject</button></div>
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