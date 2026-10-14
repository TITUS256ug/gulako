import type { StoreProfile } from '../lib/storeData'
import { WEEKDAYS } from '../lib/businessDetails'
export function BusinessDetails({profile}:{profile:StoreProfile}) {
  if(!profile.openingHours.length && !profile.faqs.length)return null
  return <section className="public-business-details">
    {profile.openingHours.length>0&&<div><h2>Opening hours</h2><p className="muted">Times in {profile.timezone.replaceAll('_',' ')}</p><dl className="business-hours">{WEEKDAYS.map(day=>{const hour=profile.openingHours.find(h=>h.day===day);return <div key={day}><dt>{day}</dt><dd>{!hour?'Not specified':hour.status==='closed'?'Closed':`${hour.opens} – ${hour.closes}${hour.closes<hour.opens?' (next day)':''}`}</dd></div>})}</dl></div>}
    {profile.faqs.length>0&&<div><h2>Frequently asked questions</h2><div className="business-faqs">{profile.faqs.map((faq,i)=><details key={i}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></div>}
  </section>
}
