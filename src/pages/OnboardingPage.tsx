import { ArrowLeft, ArrowRight, Building2, Check, Clock, Instagram, Link2, MapPin, MessageCircle, Upload } from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../components/Logo'

const steps = ['Business', 'Contact', 'Social', 'Finish']

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const next = () => step < 3 ? setStep(step + 1) : window.location.assign('/dashboard')
  return <div className="onboarding-page">
    <header className="onboarding-header"><Logo/><span>Set up your shop</span></header>
    <main className="onboarding-wrap">
      <div className="stepper">{steps.map((s,i)=><div className={i<=step?'step active':'step'} key={s}><span>{i<step?<Check size={15}/>:i+1}</span><small>{s}</small></div>)}</div>
      <section className="onboarding-card">
        {step===0 && <><span className="section-kicker">Step 1</span><h1>Tell us about your business.</h1><div className="form-grid"><label className="wide"><span>Business name</span><div className="input-shell"><Building2 size={18}/><input defaultValue="Nile AI Solutions"/></div></label><label><span>Category</span><select><option>Tech & gadgets</option><option>Fashion</option><option>Beauty</option><option>Food</option><option>Home & living</option><option>Services</option></select></label><label><span>Shop link</span><div className="slug-input"><span>gulako.app/shop/</span><input defaultValue="nile-ai-solutions"/></div></label><label className="wide"><span>Short description</span><textarea defaultValue="Everyday tech. Exceptional possibilities."/></label><button className="upload-box wide"><Upload size={22}/><span>Add logo or shop photo</span><small>PNG or JPG</small></button></div></>}
        {step===1 && <><span className="section-kicker">Step 2</span><h1>How can customers reach you?</h1><div className="form-grid"><label><span>WhatsApp number</span><div className="input-shell"><MessageCircle size={18}/><input defaultValue="+256 700 000 000"/></div></label><label><span>Phone number</span><div className="input-shell"><MessageCircle size={18}/><input placeholder="+256..."/></div></label><label className="wide"><span>Business location</span><div className="input-shell"><MapPin size={18}/><input defaultValue="Ntinda, Kampala"/></div></label><label className="wide"><span>Google Maps link / Plus Code</span><div className="input-shell"><Link2 size={18}/><input placeholder="Paste map link or Plus Code"/></div></label><label><span>Opening time</span><div className="input-shell"><Clock size={18}/><input defaultValue="08:00"/></div></label><label><span>Closing time</span><div className="input-shell"><Clock size={18}/><input defaultValue="18:00"/></div></label></div></>}
        {step===2 && <><span className="section-kicker">Step 3</span><h1>Connect your social channels.</h1><div className="form-grid"><label className="wide"><span>TikTok</span><div className="input-shell"><span className="mini-social">♪</span><input placeholder="@yourbusiness"/></div></label><label className="wide"><span>Instagram</span><div className="input-shell"><Instagram size={18}/><input placeholder="@yourbusiness"/></div></label><label className="wide"><span>Facebook</span><div className="input-shell"><span className="mini-social">f</span><input placeholder="Page username or link"/></div></label><label className="wide"><span>Delivery information</span><textarea placeholder="e.g. Same-day delivery in Kampala. Delivery fee depends on location."/></label></div></>}
        {step===3 && <div className="finish-step"><div className="success-orb"><Check size={34}/></div><span className="section-kicker">Ready to go</span><h1>Your Gulako shop is ready.</h1><p>Add your first products, preview the shop, then share your link everywhere.</p><div className="finish-preview"><span className="mini-avatar">N</span><div><strong>Nile AI Solutions</strong><small>gulako.app/shop/nile-ai-solutions</small></div></div></div>}
        <div className="onboarding-actions">{step>0?<button className="soft-button" onClick={()=>setStep(step-1)}><ArrowLeft size={17}/> Back</button>:<span/>}<button className="primary-button" onClick={next}>{step===3?'Go to dashboard':'Continue'} <ArrowRight size={17}/></button></div>
      </section>
    </main>
  </div>
}
