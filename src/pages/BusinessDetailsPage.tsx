import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ExternalLink, HelpCircle, Save } from 'lucide-react'
import { DashboardShell } from '../components/DashboardShell'
import { BusinessDetailsEditor } from '../components/BusinessDetailsEditor'
import { backend } from '../lib/backend'
import { validateBusinessDetails } from '../lib/businessDetails'
import { getStoreProfile, hydrateSellerData, rowToProfile, type StoreProfile } from '../lib/storeData'

export function BusinessDetailsPage() {
  const [profile,setProfile]=useState<StoreProfile>(()=>getStoreProfile())
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [error,setError]=useState('')
  const [saved,setSaved]=useState(false)
  const [hasShop,setHasShop]=useState(false)

  useEffect(()=>{
    let active=true
    void (async()=>{
      try {
        const {data:{user}}=await backend.auth.getUser()
        if(!user)throw new Error('Sign in to manage your business.')
        const {data,error:loadError}=await backend.from('shops')
          .select('*').eq('owner_id',user.id).maybeSingle()
        if(loadError)throw loadError
        if(!active)return
        if(data){setProfile(rowToProfile(data));setHasShop(true)}
        else setError('Create your shop before setting opening hours and FAQs.')
      }catch(err){if(active)setError(err instanceof Error?err.message:'Could not load your shop.')}
      finally{if(active)setLoading(false)}
    })()
    return()=>{active=false}
  },[])

  const save=async()=>{
    setError('');setSaved(false)
    const validation=validateBusinessDetails(profile.openingHours,profile.faqs)
    if(validation){setError(validation);return}
    setSaving(true)
    try{
      const {data:{user}}=await backend.auth.getUser()
      if(!user)throw new Error('Please sign in again.')
      const {data,error:updateError}=await backend.from('shops')
        .update({faqs:profile.faqs,opening_hours:profile.openingHours,timezone:profile.timezone,updated_at:new Date().toISOString()})
        .eq('owner_id',user.id).select('id').maybeSingle()
      if(updateError)throw updateError
      if(!data)throw new Error('Your shop was not updated. Please refresh and try again.')
      await hydrateSellerData()
      setSaved(true)
    }catch(err){setError(err instanceof Error?err.message:'Could not save these details.')}
    finally{setSaving(false)}
  }

  return <DashboardShell title="FAQs & opening hours" subtitle="Help customers know when you are available and answer their common questions."
    action={hasShop&&profile.slug?<a className="soft-button" href={'/'+profile.slug} target="_blank" rel="noreferrer"><ExternalLink size={16}/>View shop</a>:undefined}>
    <section className="dash-card premium-card seller-feature-intro">
      <span className="section-kicker"><Clock3 size={15}/> Business profile</span>
      <h2>Make your shop easier to trust.</h2>
      <p>Set your opening hours and answer questions about pickup, payment, delivery or returns. These appear on your public shop page. Don't publish promises your business cannot fulfil.</p>
      <div className="seller-feature-summary">
        <span><Clock3 size={17}/> {profile.openingHours.length} days configured</span>
        <span><HelpCircle size={17}/> {profile.faqs.length} questions</span>
      </div>
    </section>
    <section className="dash-card premium-card seller-feature-editor">
      {loading?<p role="status">Loading business details…</p>:!hasShop?<div><p>{error||'Create your shop first.'}</p><a href="/onboarding" className="primary-button">Set up your shop</a></div>:<>
        <BusinessDetailsEditor profile={profile} onChange={next=>{setProfile(next);setSaved(false);setError('')}}/>
        {error&&<p className="form-error" role="alert">{error}</p>}
        {saved&&<p className="seller-feature-success" role="status"><CheckCircle2 size={18}/> Saved successfully. These details are now available on your storefront.</p>}
        <div className="seller-feature-actions">
          <button className="primary-button large" type="button" disabled={saving} onClick={()=>void save()}><Save size={18}/>{saving?'Saving…':'Save FAQs & hours'}</button>
          <a className="soft-button" href="/dashboard/store">Other business settings</a>
        </div>
      </>}
    </section>
  </DashboardShell>
}
