import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { backend } from '../lib/backend'
export function AiDescription() {
  const [facts,setFacts]=useState(''),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const generate=async(form:HTMLFormElement|null)=>{
    if(!form)return
    setError('');setDraft('');setBusy(true)
    try{
      const values=new FormData(form)
      const {data:{session}}=await backend.auth.getSession()
      if(!session)throw new Error('Please sign in again.')
      const response=await fetch('/api/describe-product',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify({name:values.get('name'),category:values.get('category'),description:values.get('description'),facts})})
      const data=await response.json()
      if(!response.ok)throw new Error(data.error||'Could not generate a description.')
      setDraft(data.description)
    }catch(err){setError(err instanceof Error?err.message:'Please try again.')}finally{setBusy(false)}
  }
  return <div className="ai-description wide"><h3><Sparkles size={18}/> AI writing assistant</h3><p>Supply factual details such as material, size and colour. Review the draft before adding it to your product.</p>
    <label><span>Facts to include</span><textarea maxLength={1200} value={facts} onChange={e=>setFacts(e.target.value)} placeholder="e.g. Blue, cotton, sizes S–XL. Only include details you know."/></label>
    <button type="button" className="soft-button" disabled={busy} onClick={e=>void generate(e.currentTarget.closest('form'))}><Sparkles size={16}/>{busy?'Writing draft…':'Generate description'}</button>
    <small>Up to 20 generation requests per seller per day.</small>
    {error&&<p role="alert" className="form-error">{error}</p>}
    {draft&&<div className="ai-draft"><label><span>Review and edit this draft</span><textarea value={draft} onChange={e=>setDraft(e.target.value)}/></label><button className="primary-button" type="button" onClick={e=>{const field=e.currentTarget.closest('form')?.elements.namedItem('description') as HTMLTextAreaElement|null;if(field){field.value=draft;field.dispatchEvent(new Event('input',{bubbles:true}));setDraft('')}}}>Use this description</button><button className="text-button" type="button" onClick={()=>setDraft('')}>Discard</button></div>}
  </div>
}
