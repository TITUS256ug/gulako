import { Plus, Trash2 } from 'lucide-react'
import type { StoreProfile } from '../lib/storeData'
import { WEEKDAYS, type BusinessHour } from '../lib/businessDetails'

export function BusinessDetailsEditor({profile,onChange}:{profile:StoreProfile;onChange:(next:StoreProfile)=>void}) {
  const updateHour=(day:BusinessHour['day'],update:Partial<BusinessHour>|null)=>{
    const existing=profile.openingHours.find(h=>h.day===day)
    const hours=profile.openingHours.filter(h=>h.day!==day)
    if(update)hours.push({day,status:'open',opens:'',closes:'',...existing,...update})
    onChange({...profile,openingHours:hours})
  }
  return <div className="business-details-editor wide">
    <h3>Opening hours</h3><p className="muted">Leave days unspecified if you have not set a schedule. Closing before opening means you close the next day.</p>
    <label><span>Business timezone</span><select value={profile.timezone} onChange={e=>onChange({...profile,timezone:e.target.value})}>{['Africa/Kampala','Africa/Nairobi','Africa/Kigali','Africa/Lagos','Africa/Johannesburg','Europe/London','America/New_York','UTC'].map(tz=><option key={tz}>{tz}</option>)}</select></label>
    <div className="hours-editor">{WEEKDAYS.map(day=>{const hour=profile.openingHours.find(h=>h.day===day);return <div className="hours-editor-row" key={day}>
      <strong>{day}</strong><select aria-label={day+' status'} value={hour?.status||''} onChange={e=>updateHour(day,e.target.value?{status:e.target.value as 'open'|'closed'}:null)}><option value="">Not set</option><option value="open">Open</option><option value="closed">Closed</option></select>
      {hour?.status==='open'&&<><input aria-label={day+' opens'} type="time" value={hour.opens} onChange={e=>updateHour(day,{opens:e.target.value})}/><input aria-label={day+' closes'} type="time" value={hour.closes} onChange={e=>updateHour(day,{closes:e.target.value})}/></>}
    </div>})}</div>
    <h3>Business FAQs</h3><p className="muted">Answer common questions about delivery, returns, sizes or how to order. Only publish policies your business actually follows.</p>
    {profile.faqs.map((faq,index)=><div className="faq-editor" key={index}>
      <label><span>Question {index+1}</span><input maxLength={200} value={faq.question} onChange={e=>onChange({...profile,faqs:profile.faqs.map((f,i)=>i===index?{...f,question:e.target.value}:f)})}/></label>
      <label><span>Answer</span><textarea maxLength={1500} value={faq.answer} onChange={e=>onChange({...profile,faqs:profile.faqs.map((f,i)=>i===index?{...f,answer:e.target.value}:f)})}/></label>
      <button type="button" className="text-danger-button" onClick={()=>onChange({...profile,faqs:profile.faqs.filter((_,i)=>i!==index)})}><Trash2 size={14}/> Remove FAQ</button>
    </div>)}
    {profile.faqs.length<10&&<button type="button" className="soft-button" onClick={()=>onChange({...profile,faqs:[...profile.faqs,{question:'',answer:''}]})}><Plus size={16}/> Add question</button>}
  </div>
}
