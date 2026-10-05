import { CheckCircle2, Copy, Landmark, Phone, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import { backend } from '../lib/backend'

type Plan='pro'|'business'
type Method='mtn'|'airtel'|'bank'
type BillingSettings={
  mtn_merchant_code:string
  airtel_merchant_code:string
  bank_name:string
  bank_account_name:string
  bank_account_number:string
}
type UpgradeRequest={
  id:string
  requested_plan:Plan
  payment_method:Method
  transaction_ref:string
  status:'pending'|'approved'|'rejected'
  created_at:string
}

const blankSettings:BillingSettings={
  mtn_merchant_code:'',
  airtel_merchant_code:'',
  bank_name:'',
  bank_account_name:'',
  bank_account_number:'',
}

const planPrice:Record<Plan,number>={pro:20000,business:50000}
const planName:Record<Plan,string>={pro:'Pro',business:'Business'}

export function BillingPage(){
  const initialPlan=new URLSearchParams(window.location.search).get('plan')
  const [plan,setPlan]=useState<Plan>(initialPlan==='business'?'business':'pro')
  const [method,setMethod]=useState<Method>('mtn')
  const [settings,setSettings]=useState<BillingSettings>(blankSettings)
  const [requests,setRequests]=useState<UpgradeRequest[]>([])
  const [reference,setReference]=useState('')
  const [note,setNote]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const [copied,setCopied]=useState('')

  useEffect(()=>{
    void (async()=>{
      const [{data:billing},{data:history}]=await Promise.all([
        backend.from('billing_settings').select('mtn_merchant_code,airtel_merchant_code,bank_name,bank_account_name,bank_account_number').eq('id',true).maybeSingle(),
        backend.from('plan_upgrade_requests').select('id,requested_plan,payment_method,transaction_ref,status,created_at').order('created_at',{ascending:false}).limit(5),
      ])
      if(billing)setSettings({...blankSettings,...billing})
      if(history)setRequests(history as UpgradeRequest[])
    })()
  },[])

  const available=useMemo(()=>({
    mtn:Boolean(settings.mtn_merchant_code),
    airtel:Boolean(settings.airtel_merchant_code),
    bank:Boolean(settings.bank_account_number&&settings.bank_name),
  }),[settings])

  useEffect(()=>{
    if(available[method])return
    if(available.mtn)setMethod('mtn')
    else if(available.airtel)setMethod('airtel')
    else if(available.bank)setMethod('bank')
  },[available.mtn,available.airtel,available.bank])

  const copy=async(value:string,key:string)=>{
    await navigator.clipboard.writeText(value).catch(()=>undefined)
    setCopied(key)
    window.setTimeout(()=>setCopied(''),1200)
  }

  const submit=async()=>{
    if(!available[method]){setMessage('This payment method is not configured yet.');return}
    if(reference.trim().length<3){setMessage('Enter the transaction or payment reference after paying.');return}
    setBusy(true);setMessage('')
    const {data:{user}}=await backend.auth.getUser()
    if(!user){window.location.replace('/signin');return}
    const {error}=await backend.from('plan_upgrade_requests').insert({
      user_id:user.id,
      requested_plan:plan,
      payment_method:method,
      transaction_ref:reference.trim(),
      note:note.trim(),
    })
    if(error)setMessage(error.message)
    else{
      setMessage('Upgrade request sent. Your payment will be reviewed before the plan changes.')
      setReference('')
      const {data}=await backend.from('plan_upgrade_requests').select('id,requested_plan,payment_method,transaction_ref,status,created_at').order('created_at',{ascending:false}).limit(5)
      if(data)setRequests(data as UpgradeRequest[])
    }
    setBusy(false)
  }

  const amount=new Intl.NumberFormat('en-UG').format(planPrice[plan])
  const hasAnyMethod=available.mtn||available.airtel||available.bank

  return <DashboardShell title="Billing" subtitle="Upgrade using direct Mobile Money or bank transfer.">
    <section className="billing-plan-switch">
      <button className={plan==='pro'?'active':''} onClick={()=>setPlan('pro')}><span>Pro</span><strong>UGX 20,000</strong><small>/ month · unlimited products</small></button>
      <button className={plan==='business'?'active':''} onClick={()=>setPlan('business')}><span>Business</span><strong>UGX 50,000</strong><small>/ month · unlimited + AI tools</small></button>
    </section>

    <div className="billing-layout">
      <section className="dash-card premium-card billing-payment-card">
        <div className="dash-card-head"><div><span className="section-kicker">Step 1</span><h2>Choose how to pay</h2><p>Pay UGX {amount} directly, then submit the transaction reference.</p></div></div>

        {!hasAnyMethod&&<div className="billing-empty"><ShieldCheck size={22}/><div><strong>Payment details are being configured.</strong><span>You can keep using the Free plan meanwhile.</span></div></div>}

        <div className="billing-methods">
          {available.mtn&&<button className={method==='mtn'?'billing-method active mtn':'billing-method mtn'} onClick={()=>setMethod('mtn')}>
            <span className="billing-method-icon"><Smartphone size={20}/></span><div><strong>MTN MoMoPay</strong><small>Merchant code {settings.mtn_merchant_code}</small></div><CheckCircle2 size={18}/>
          </button>}
          {available.airtel&&<button className={method==='airtel'?'billing-method active airtel':'billing-method airtel'} onClick={()=>setMethod('airtel')}>
            <span className="billing-method-icon"><Phone size={20}/></span><div><strong>Airtel Money Pay</strong><small>Merchant ID {settings.airtel_merchant_code}</small></div><CheckCircle2 size={18}/>
          </button>}
          {available.bank&&<button className={method==='bank'?'billing-method active bank':'billing-method bank'} onClick={()=>setMethod('bank')}>
            <span className="billing-method-icon"><Landmark size={20}/></span><div><strong>Bank transfer</strong><small>{settings.bank_name}</small></div><CheckCircle2 size={18}/>
          </button>}
        </div>

        {hasAnyMethod&&<div className="billing-pay-details">
          <div><span>Plan</span><strong>{planName[plan]}</strong></div>
          <div><span>Amount</span><strong>UGX {amount}</strong></div>
          {method==='mtn'&&available.mtn&&<><div><span>MTN merchant code</span><strong>{settings.mtn_merchant_code}</strong><button onClick={()=>copy(settings.mtn_merchant_code,'mtn')}><Copy size={14}/>{copied==='mtn'?'Copied':'Copy'}</button></div><small>On MTN, use the merchant payment option and confirm the business name before entering your PIN.</small></>}
          {method==='airtel'&&available.airtel&&<><div><span>Airtel merchant ID</span><strong>{settings.airtel_merchant_code}</strong><button onClick={()=>copy(settings.airtel_merchant_code,'airtel')}><Copy size={14}/>{copied==='airtel'?'Copied':'Copy'}</button></div><small>On Airtel Money, use the merchant payment option and confirm the business name before entering your PIN.</small></>}
          {method==='bank'&&available.bank&&<><div><span>Bank</span><strong>{settings.bank_name}</strong></div><div><span>Account name</span><strong>{settings.bank_account_name}</strong></div><div><span>Account number</span><strong>{settings.bank_account_number}</strong><button onClick={()=>copy(settings.bank_account_number,'bank')}><Copy size={14}/>{copied==='bank'?'Copied':'Copy'}</button></div></>}
        </div>}
      </section>

      <section className="dash-card premium-card billing-reference-card">
        <span className="section-kicker">Step 2</span>
        <h2>Submit payment reference</h2>
        <p>After paying, enter the transaction ID/reference so the plan can be activated.</p>
        <label><span>Transaction reference</span><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="e.g. 1234567890"/></label>
        <label><span>Note (optional)</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Anything we should know?"/></label>
        {message&&<p className={message.startsWith('Upgrade request sent')?'billing-message success':'billing-message'}>{message}</p>}
        <button className="primary-button large full-width" onClick={()=>void submit()} disabled={busy||!hasAnyMethod}>{busy?'Sending…':'Request '+planName[plan]+' activation'}</button>
        <small className="billing-safety"><ShieldCheck size={14}/> Gulako never asks for your Mobile Money PIN or banking password.</small>
      </section>
    </div>

    {requests.length>0&&<section className="dash-card premium-card billing-history">
      <div className="dash-card-head"><div><h2>Recent requests</h2><p>Your latest manual plan upgrade requests.</p></div></div>
      {requests.map(item=><div className="billing-history-row" key={item.id}><div><strong>{planName[item.requested_plan]}</strong><small>{new Date(item.created_at).toLocaleDateString()} · {item.transaction_ref}</small></div><span className={'billing-status '+item.status}>{item.status}</span></div>)}
    </section>}
  </DashboardShell>
}
