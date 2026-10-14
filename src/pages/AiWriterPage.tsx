import { useEffect, useState } from 'react'
import { CheckCircle2, Copy, PackagePlus, Save, Sparkles } from 'lucide-react'
import { DashboardShell } from '../components/DashboardShell'
import { backend } from '../lib/backend'
import { getSellerProducts, hydrateSellerData } from '../lib/storeData'
import type { Product } from '../data/mock'

type Plan = 'free'|'pro'|'business'
const DRAFT_KEY='gulako_pending_ai_product_draft'

export function AiWriterPage() {
  const [products,setProducts]=useState<Product[]>([])
  const [plan,setPlan]=useState<Plan|null>(null)
  const [planExpiry,setPlanExpiry]=useState<string|null>(null)
  const [loaded,setLoaded]=useState(false)
  const [selection,setSelection]=useState('new')
  const [name,setName]=useState('')
  const [category,setCategory]=useState('')
  const [facts,setFacts]=useState('')
  const [description,setDescription]=useState('')
  const [draft,setDraft]=useState('')
  const [busy,setBusy]=useState(false)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')

  useEffect(()=>{
    let active=true
    void (async()=>{
      try{
        await hydrateSellerData()
        const {data:{user}}=await backend.auth.getUser()
        if(!user)throw new Error('Sign in to use AI Writer.')
        const {data,error:accountError}=await backend.from('profiles')
          .select('plan,plan_expires_at').eq('id',user.id).maybeSingle()
        if(accountError)throw accountError
        if(!active)return
        setProducts(getSellerProducts())
        setPlan((data?.plan??'free') as Plan)
        setPlanExpiry(data?.plan_expires_at??null)
      }catch(err){if(active)setError(err instanceof Error?err.message:'Could not load your products.')}
      finally{if(active)setLoaded(true)}
    })()
    return()=>{active=false}
  },[])

  const eligible=plan==='business'&&(!planExpiry||new Date(planExpiry).getTime()>Date.now())
  const selectProduct=(id:string)=>{
    setSelection(id);setDraft('');setNotice('');setError('')
    const p=products.find(item=>item.id===id)
    setName(p?.name??'');setCategory(p?.category??'');setDescription(p?.description??'')
  }

  const generate=async()=>{
    setError('');setNotice('')
    if(!name.trim()){setError('Enter the product name first.');return}
    if(!facts.trim()&&!description.trim()){setError('Provide accurate product details or an existing description first.');return}
    if(!eligible){setError('AI Writer is a Business-plan feature. You can upgrade from Billing.');return}
    setBusy(true)
    try{
      const {data:{session}}=await backend.auth.getSession()
      if(!session)throw new Error('Please sign in again.')
      const response=await fetch('/api/describe-product',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},
        body:JSON.stringify({name:name.trim(),category:category.trim(),description:description.trim(),facts:facts.trim()})
      })
      const payload=await response.json().catch(()=>({error:'The writing service returned an unexpected response.'}))
      if(!response.ok)throw new Error(payload.error||'Could not generate the draft.')
      if(typeof payload.description!=='string'||!payload.description.trim())throw new Error('The writing service returned an empty draft.')
      setDraft(payload.description)
      setNotice('Draft generated. Review every claim before saving or publishing.')
    }catch(err){setError(err instanceof Error?err.message:'Could not generate a draft.')}
    finally{setBusy(false)}
  }

  const saveExisting=async()=>{
    const product=products.find(item=>item.id===selection)
    if(!product||!draft.trim())return
    setSaving(true);setError('');setNotice('')
    try{
      const {data:{user}}=await backend.auth.getUser()
      if(!user)throw new Error('Please sign in again.')
      const {data,error:updateError}=await backend.from('products')
        .update({description:draft.trim(),updated_at:new Date().toISOString()})
        .eq('id',product.id).eq('owner_id',user.id).select('id').maybeSingle()
      if(updateError)throw updateError
      if(!data)throw new Error('The description could not be saved. Please try again.')
      setDescription(draft.trim())
      setProducts(current=>current.map(item=>item.id===product.id?{...item,description:draft.trim()}:item))
      await hydrateSellerData()
      setNotice('Description saved to '+product.name+'. Customers can now read it on your product page.')
    }catch(err){setError(err instanceof Error?err.message:'Could not save description.')}
    finally{setSaving(false)}
  }

  const continueNew=()=>{
    if(!draft.trim())return
    window.sessionStorage.setItem(DRAFT_KEY,JSON.stringify({name:name.trim(),category:category.trim(),description:draft.trim()}))
    window.location.assign('/dashboard/products?add=1&from=ai')
  }

  const copy=async()=>{
    if(!draft.trim())return
    try{await navigator.clipboard.writeText(draft);setNotice('Draft copied to clipboard.')}catch{setError('Clipboard unavailable. Select and copy your draft manually.')}
  }

  return <DashboardShell title="AI Writer" subtitle="Write product descriptions from verified facts, then review before publishing."
    action={<a className="soft-button" href="/dashboard/products?add=1"><PackagePlus size={16}/>Add product</a>}>
    <section className="dash-card premium-card seller-feature-intro">
      <span className="section-kicker"><Sparkles size={15}/> Business-plan tool</span>
      <h2>Write a better product description in minutes.</h2>
      <p>Select an existing product or start a new one, give the assistant factual details, and review its suggested wording. Nothing is published until you choose to save it.</p>
      {loaded&&!eligible&&<div className="seller-feature-plan-note" role="status">
        <strong>AI Writer requires an active Business plan.</strong>
        <span>You can still manage and write product descriptions manually on Free and Pro.</span>
        <a className="soft-button" href="/dashboard/billing?plan=business">View Business plan</a>
      </div>}
    </section>
    <section className="dash-card premium-card seller-feature-editor ai-writer-workspace">
      {!loaded?<p role="status">Loading AI Writer…</p>:<>
        <div className="seller-feature-form">
          <label><span>Choose a product</span><select value={selection} onChange={e=>selectProduct(e.target.value)}>
            <option value="new">New product description</option>
            {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
          <label><span>Product name</span><input value={name} onChange={e=>{setName(e.target.value);setDraft('')}} maxLength={200} placeholder="e.g. Leather crossbody bag"/></label>
          <label><span>Category</span><input value={category} onChange={e=>setCategory(e.target.value)} maxLength={100} placeholder="e.g. Fashion and accessories"/></label>
          <label><span>Current description (optional)</span><textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={3000} rows={3} placeholder="What have you already written?"/></label>
          <label><span>Facts to include</span><textarea value={facts} onChange={e=>{setFacts(e.target.value);setDraft('')}} maxLength={1200} rows={4} placeholder="Material, colour, dimensions, compatibility, sizes, known features…"/></label>
        </div>
        <button className="primary-button large" disabled={busy||!eligible} onClick={()=>void generate()}><Sparkles size={18}/>{busy?'Writing your draft…':'Generate AI description'}</button>
        <p className="seller-feature-small">Up to 20 requests daily per Business seller. Only include facts you know; check all claims before saving.</p>
        {draft&&<section className="ai-writer-draft" aria-label="AI draft">
          <h3>Review your draft</h3>
          <label><span>Edit the generated description</span><textarea value={draft} maxLength={3000} rows={7} onChange={e=>setDraft(e.target.value)}/></label>
          <div className="seller-feature-actions">
            {selection==='new'
              ?<button className="primary-button" onClick={continueNew}><PackagePlus size={17}/>Use in a new product</button>
              :<button className="primary-button" disabled={saving} onClick={()=>void saveExisting()}><Save size={17}/>{saving?'Saving…':'Save to this product'}</button>}
            <button className="soft-button" onClick={()=>void copy()}><Copy size={17}/>Copy description</button>
          </div>
        </section>}
        {error&&<p className="form-error" role="alert">{error}</p>}
        {notice&&<p className="seller-feature-success" role="status"><CheckCircle2 size={17}/>{notice}</p>}
      </>}
    </section>
  </DashboardShell>
}
