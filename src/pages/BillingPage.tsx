import { CheckCircle2, Copy, Globe2, Landmark, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import { backend } from '../lib/backend'

type Plan='pro'|'business'
type Currency='UGX'|'USD'
type Method='mtn'|'bank'

type BillingSettings={
  mtn_merchant_code:string
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
  requested_plan:Plan
  payment_method:Method
  transaction_ref:string
  status:'pending'|'approved'|'rejected'
  created_at:string
  currency:Currency
  amount:number|null
}

const blankSettings:BillingSettings={
  mtn_merchant_code:'',
  bank_name:'',
  bank_account_name:'',
  bank_account_number:'',
  bank_swift:'',
  bank_country:'',
  bank_branch:'',
  bank_currency:'USD',
}

const prices:Record<Plan,Record<Currency,number>>={
  pro:{UGX:20000,USD:6},
  business:{UGX:50000,USD:15},
}
const planName:Record<Plan,string>={pro:'Pro',business:'Business'}

export function BillingPage(){
  const initialPlan=new URLSearchParams(window.location.search).get('plan')
  const [plan,setPlan]=useState<Plan>(initialPlan==='business'?'business':'pro')
  const [currency,setCurrency]=useState<Currency>('UGX')
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
        backend.from('billing_settings').select('mtn_merchant_code,bank_name,bank_account_name,bank_account_number,bank_swift,bank_country,bank_branch,bank_currency').eq('id',true).maybeSingle(),
        backend.from('plan_upgrade_requests').select('id,requested_plan,payment_method,transaction_ref,status,created_at,currency,amount').order('created_at',{ascending:false}).limit(5),
      ])
      if(billing)setSettings({...blankSettings,...billing})
      if(history)setRequests(history as UpgradeRequest[])
    })()
  },[])

  const available=useMemo(()=>({
    mtn:Boolean(settings.mtn_merchant_code),
    bank:Boolean(settings.bank_account_number&&settings.bank_name&&settings.bank_swift),
  }),[settings])

  useEffect(()=>{
    if(currency==='USD')setMethod('bank')
    else setMethod('mtn')
  },[currency])

  const copy=async(value:string,key:string)=>{
    await navigator.clipboard.writeText(value).catch(()=>undefined)
    setCopied(key)
    window.setTimeout(()=>setCopied(''),1200)
  }

  const amount=prices[plan][currency]
  const amountLabel=currency==='UGX'?'UGX '+new Intl.NumberFormat('en-UG').format(amount):'$'+amount

  const submit=async()=>{
    if(currency==='UGX'&&!available.mtn){setMessage('Mobile Money payment details are not configured yet.');return}
    if(currency==='USD'&&!available.bank){setMessage('International bank details are not configured yet.');return}
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
      currency,
      amount,
    })
    if(error)setMessage(error.message)
    else{
      setMessage('Upgrade request sent. Your payment will be reviewed before the plan changes.')
      setReference('')
      const {data}=await backend.from('plan_upgrade_requests').select('id,requested_plan,payment_method,transaction_ref,status,created_at,currency,amount').order('created_at',{ascending:false}).limit(5)
      if(data)setRequests(data as UpgradeRequest[])
    }
    setBusy(false)
  }

  return <DashboardShell title="Billing" subtitle="Choose local or international payment.">
    <div className="billing-currency-toggle">
      <button className={currency==='UGX'?'active':''} onClick={()=>setCurrency('UGX')}><Smartphone size={16}/> Uganda · UGX</button>
      <button className={currency==='USD'?'active':''} onClick={()=>setCurrency('USD')}><Globe2 size={16}/> International · USD</button>
    </div>

    <section className="billing-plan-switch">
      <button className={plan==='pro'?'active':''} onClick={()=>setPlan('pro')}><span>Pro</span><strong>{currency==='UGX'?'UGX 20,000':'$6'}</strong><small>/ month · unlimited products</small></button>
      <button className={plan==='business'?'active':''} onClick={()=>setPlan('business')}><span>Business</span><strong>{currency==='UGX'?'UGX 50,000':'$15'}</strong><small>/ month · unlimited + AI tools</small></button>
    </section>

    <div className="billing-layout">
      <section className="dash-card premium-card billing-payment-card">
        <div className="dash-card-head"><div><span className="section-kicker">Step 1</span><h2>{currency==='UGX'?'Pay with Mobile Money':'Pay by international bank transfer'}</h2><p>Pay {amountLabel}, then submit the transaction reference.</p></div></div>

        {currency==='UGX' ? (
          available.mtn ? <div className="billing-local-payment">
            <div className="billing-method active mtn"><span className="billing-method-icon"><Smartphone size={20}/></span><div><strong>Mobile Money merchant payment</strong><small>Merchant code {settings.mtn_merchant_code}</small></div><CheckCircle2 size={18}/></div>
            <div className="billing-pay-details">
              <div><span>Plan</span><strong>{planName[plan]}</strong></div>
              <div><span>Amount</span><strong>{amountLabel}</strong></div>
              <div><span>Merchant code</span><strong>{settings.mtn_merchant_code}</strong><button onClick={()=>copy(settings.mtn_merchant_code,'merchant')}><Copy size={14}/>{copied==='merchant'?'Copied':'Copy'}</button></div>
              <small>Use the merchant payment option on your Mobile Money menu, enter the code above, confirm the recipient/business name and amount, then enter your PIN.</small>
            </div>
          </div> : <div className="billing-empty"><ShieldCheck size={22}/><div><strong>Mobile Money details are being configured.</strong><span>Please try again shortly.</span></div></div>
        ) : (
          available.bank ? <div className="billing-bank-transfer">
            <div className="billing-method active bank"><span className="billing-method-icon"><Landmark size={20}/></span><div><strong>International bank transfer</strong><small>{settings.bank_name}</small></div><CheckCircle2 size={18}/></div>
            <div className="billing-pay-details">
              <div><span>Plan</span><strong>{planName[plan]}</strong></div>
              <div><span>Amount</span><strong>{amountLabel}</strong></div>
              <div><span>Bank</span><strong>{settings.bank_name}</strong></div>
              <div><span>Account name</span><strong>{settings.bank_account_name}</strong></div>
              <div><span>Account number</span><strong>{settings.bank_account_number}</strong><button onClick={()=>copy(settings.bank_account_number,'bank')}><Copy size={14}/>{copied==='bank'?'Copied':'Copy'}</button></div>
              <div><span>SWIFT / BIC</span><strong>{settings.bank_swift}</strong><button onClick={()=>copy(settings.bank_swift,'swift')}><Copy size={14}/>{copied==='swift'?'Copied':'Copy'}</button></div>
              {settings.bank_branch&&<div><span>Branch</span><strong>{settings.bank_branch}</strong></div>}
              {settings.bank_country&&<div><span>Bank country</span><strong>{settings.bank_country}</strong></div>}
              <small>Send in {settings.bank_currency||'USD'} unless your bank instructs otherwise. Your bank may charge an international transfer fee.</small>
            </div>
          </div> : <div className="billing-empty"><Landmark size={22}/><div><strong>International bank details are being configured.</strong><span>Please try again shortly.</span></div></div>
        )}
      </section>

      <section className="dash-card premium-card billing-reference-card">
        <span className="section-kicker">Step 2</span>
        <h2>Submit payment reference</h2>
        <p>After paying, enter the transaction ID/reference so the plan can be activated.</p>
        <div className="billing-reference-summary"><span>{planName[plan]}</span><strong>{amountLabel}</strong><small>{currency==='UGX'?'Mobile Money':'International bank transfer'}</small></div>
        <label><span>Transaction reference</span><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Payment / transaction reference"/></label>
        <label><span>Note (optional)</span><textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Anything we should know?"/></label>
        {message&&<p className={message.startsWith('Upgrade request sent')?'billing-message success':'billing-message'}>{message}</p>}
        <button className="primary-button large full-width" onClick={()=>void submit()} disabled={busy||(currency==='UGX'?!available.mtn:!available.bank)}>{busy?'Sending…':'Request '+planName[plan]+' activation'}</button>
        <small className="billing-safety"><ShieldCheck size={14}/> Gulako never asks for your Mobile Money PIN or online-banking password.</small>
      </section>
    </div>

    {requests.length>0&&<section className="dash-card premium-card billing-history">
      <div className="dash-card-head"><div><h2>Recent requests</h2><p>Your latest manual plan upgrade requests.</p></div></div>
      {requests.map(item=><div className="billing-history-row" key={item.id}><div><strong>{planName[item.requested_plan]}</strong><small>{new Date(item.created_at).toLocaleDateString()} · {item.currency} {item.amount??''} · {item.transaction_ref}</small></div><span className={'billing-status '+item.status}>{item.status}</span></div>)}
    </section>}
  </DashboardShell>
}
