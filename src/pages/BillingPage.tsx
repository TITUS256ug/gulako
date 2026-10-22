import { ArrowDownRight, Check, CheckCircle2, Copy, Globe2, Landmark, ShieldCheck, Smartphone } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import { backend } from '../lib/backend'
import { formatPlanPrice, planBenefits, planDirection, planNames, planOrder, planPrices } from '../lib/plans'
import type { BillingCurrency, PlanId } from '../lib/plans'

type Plan='pro'|'business'
type CurrentPlan=PlanId
type Currency=BillingCurrency
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

const planName=planNames

export function BillingPage(){
  const initialPlan=new URLSearchParams(window.location.search).get('plan')
  const [plan,setPlan]=useState<CurrentPlan|null>(null)
  const [currentPlan,setCurrentPlan]=useState<CurrentPlan|null>(null)
  const [planError,setPlanError]=useState(false)
  const [currency,setCurrency]=useState<Currency>('UGX')
  const [method,setMethod]=useState<Method>('mtn')
  const [settings,setSettings]=useState<BillingSettings>(blankSettings)
  const [requests,setRequests]=useState<UpgradeRequest[]>([])
  const [reference,setReference]=useState('')
  const [note,setNote]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const [copied,setCopied]=useState('')
  const changePanel=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    let active=true
    void (async()=>{
      try{
      const {data:{user}}=await backend.auth.getUser()
      if(!user)throw new Error('Please sign in again.')
      const [{data:billing},{data:history},{data:account,error:accountError}]=await Promise.all([
        backend.from('billing_settings').select('mtn_merchant_code,bank_name,bank_account_name,bank_account_number,bank_swift,bank_country,bank_branch,bank_currency').eq('id',true).maybeSingle(),
        backend.from('plan_upgrade_requests').select('id,requested_plan,payment_method,transaction_ref,status,created_at,currency,amount').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5),
        backend.from('profiles').select('plan').eq('id',user.id).maybeSingle(),
      ])
      if(!active)return
      if(accountError||!account||!planOrder.includes(account.plan))setPlanError(true)
      else{
        setCurrentPlan(account.plan as CurrentPlan)
        setPlan(planOrder.includes(initialPlan as PlanId)?initialPlan as PlanId:account.plan as PlanId)
      }
      if(billing)setSettings({...blankSettings,...billing})
      if(history)setRequests(history as UpgradeRequest[])
      }catch{if(active)setPlanError(true)}
    })()
    return()=>{active=false}
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

  const direction=currentPlan&&plan?planDirection(currentPlan,plan):null
  const amount=plan?planPrices[plan][currency]:0
  const amountLabel=plan?formatPlanPrice(plan,currency):''
  const pending=requests.some(item=>item.status==='pending'&&item.requested_plan===plan)

  const choosePlan=(next:CurrentPlan)=>{
    setPlan(next);setMessage('');setReference('');setNote('')
    window.requestAnimationFrame(()=>changePanel.current?.scrollIntoView({behavior:'smooth',block:'start'}))
  }

  const downgrade=async()=>{
    if(!currentPlan||!plan||direction!=='downgrade'||busy)return
    setBusy(true);setMessage('')
    try{
      const {data,error}=await backend.rpc('gulako_downgrade_plan',{target_plan:plan})
      if(error)throw error
      if(data!==plan)throw new Error('Could not confirm the plan change. Please refresh and try again.')
      setCurrentPlan(plan)
      setMessage('Your plan has changed to '+planName[plan]+'. Your products and orders are saved.')
      window.dispatchEvent(new Event('gulako-account'))
    }catch(error){setMessage(error instanceof Error?error.message:typeof error==='object'&&error&&'message' in error?String(error.message):'Could not change your plan. Please try again.')}
    finally{setBusy(false)}
  }

  const submit=async()=>{
    if(!plan||plan==='free'||direction!=='upgrade'||busy||pending)return
    if(currency==='UGX'&&!available.mtn){setMessage('Mobile Money payment details are not configured yet.');return}
    if(currency==='USD'&&!available.bank){setMessage('International bank details are not configured yet.');return}
    if(reference.trim().length<3){setMessage('Enter the transaction or payment reference after paying.');return}
    setBusy(true);setMessage('')
    try{
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
      const {data}=await backend.from('plan_upgrade_requests').select('id,requested_plan,payment_method,transaction_ref,status,created_at,currency,amount').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5)
      if(data)setRequests(data as UpgradeRequest[])
    }
    }catch{setMessage('Could not send your request. Please try again.')}
    finally{setBusy(false)}
  }

  return <DashboardShell title="Plans & billing" subtitle="Your plan, your benefits and room to grow.">
    <section className="dash-card premium-card billing-current-plan" aria-label="Current subscription plan">
      <div><span className="section-kicker">Your subscription</span><h2>Current plan</h2><p>{planError?'We could not load your subscription. Please refresh and try again.':currentPlan===null?'Checking your subscription…':currentPlan==='free'?'Your Free plan includes up to 100 active products and unlimited orders.':currentPlan==='pro'?'Your Pro plan includes unlimited products and orders.':'Your Business plan includes unlimited products and Business features, including eligibility for founder-reviewed location verification.'}</p></div>
      <span className="current-plan-pill">{planError?'Unavailable':currentPlan===null?'Loading…':planName[currentPlan]}</span>
    </section>
    <div className="billing-currency-toggle">
      <button className={currency==='UGX'?'active':''} onClick={()=>setCurrency('UGX')}><Smartphone size={16}/> Uganda · UGX</button>
      <button className={currency==='USD'?'active':''} onClick={()=>setCurrency('USD')}><Globe2 size={16}/> International · USD</button>
    </div>

    <section className="billing-plan-grid" aria-label="Compare subscription plans">
      {planOrder.map(id=>{
        const action=currentPlan?planDirection(currentPlan,id):null
        return <article key={id} data-plan={id} className={'billing-plan-card'+(action==='current'?' is-current':'')+(plan===id?' is-selected':'')}>
          <div className="billing-plan-card-heading"><h2>{planName[id]}</h2>{action==='current'?<span className="billing-plan-badge"><CheckCircle2 size={14}/> Current plan</span>:id==='pro'?<span className="billing-plan-caption">Room to grow</span>:null}</div>
          <p className="billing-plan-price">{formatPlanPrice(id,currency)}<small>{id==='free'?'Free forever':'/ month'}</small></p>
          <ul>{planBenefits[id].map(benefit=><li key={benefit}><Check size={16}/><span>{benefit}</span></li>)}</ul>
          <button type="button" className={(action==='upgrade'?'primary-button':'soft-button')+' full-width'} disabled={!action||action==='current'||busy} onClick={()=>choosePlan(id)}>
            {action==='current'?'Current plan':action==='upgrade'?'Upgrade to '+planName[id]:action==='downgrade'?'Downgrade to '+planName[id]:planError?'Plan unavailable':'Checking plan…'}
          </button>
        </article>
      })}
    </section>

    {message&&<p className="billing-feedback" role="status">{message}</p>}
    <div ref={changePanel} className="billing-change-panel">
    {direction==='current'&&<p className="billing-selection-note">You’re on {currentPlan?planName[currentPlan]:''}. Compare the benefits above and choose a different plan whenever you need.</p>}
    {direction==='downgrade'&&plan&&<section className="dash-card premium-card billing-downgrade" aria-labelledby="billing-downgrade-title">
      <span className="section-kicker"><ArrowDownRight size={16}/> Review your change</span>
      <h2 id="billing-downgrade-title">Downgrade to {planName[plan]}?</h2>
      <p>The change takes effect immediately. Your products and order history stay saved.{plan==='free'?' Free supports up to 100 active products. If you have more, reduce your active products before switching.':''}{currentPlan==='business'?' AI writing and the verified location badge will no longer be available.':''} Previous payments are not automatically refunded.</p>
      <div className="billing-downgrade-actions"><button type="button" className="soft-button" disabled={busy} onClick={()=>{setPlan(currentPlan);setMessage('')}}>Keep {currentPlan?planName[currentPlan]:''}</button><button type="button" className="primary-button" disabled={busy} onClick={()=>void downgrade()}>{busy?'Changing plan…':'Confirm downgrade to '+planName[plan]}</button></div>
    </section>}
    {direction==='upgrade'&&plan&&<>
    <div className="billing-upgrade-heading"><h2>Upgrade to {planName[plan]}</h2><p>Your current plan stays active until your payment is reviewed and approved.</p>{pending&&<p className="billing-feedback">You already have a pending request for this plan. Check its status below before sending another payment.</p>}</div>
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
        <button className="primary-button large full-width" onClick={()=>void submit()} disabled={busy||pending||(currency==='UGX'?!available.mtn:!available.bank)}>{busy?'Sending…':pending?'Upgrade pending':'Request '+planName[plan]+' upgrade'}</button>
        <small className="billing-safety"><ShieldCheck size={14}/> Gulako never asks for your Mobile Money PIN or online-banking password.</small>
      </section>
    </div>
    </>}
    </div>

    {requests.length>0&&<section className="dash-card premium-card billing-history">
      <div className="dash-card-head"><div><h2>Recent requests</h2><p>Your latest manual plan upgrade requests.</p></div></div>
      {requests.map(item=><div className="billing-history-row" key={item.id}><div><strong>{planName[item.requested_plan]}</strong><small>{new Date(item.created_at).toLocaleDateString()} · {item.currency} {item.amount??''} · {item.transaction_ref}</small></div><span className={'billing-status '+item.status}>{item.status}</span></div>)}
    </section>}
  </DashboardShell>
}
