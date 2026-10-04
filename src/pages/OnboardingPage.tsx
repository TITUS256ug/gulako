import { ArrowLeft, ArrowRight, Building2, Check, Clock, Instagram, Link2, MapPin, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../components/Logo'
import { ShopLogoUpload } from '../components/ShopLogoUpload'
import { BUSINESS_CATEGORIES } from '../lib/storeData'

const steps = ['Business', 'Contact', 'Social', 'Finish']

export function OnboardingPage() {
  const [step, setStep] = useState(0)

  const next = () => {
    if (step < 3) setStep(step + 1)
    else window.location.assign('/dashboard')
  }

  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <Logo />
        <span>Set up your shop</span>
      </header>

      <main className="onboarding-wrap">
        <div className="stepper">
          {steps.map((label, index) => (
            <div className={index <= step ? 'step active' : 'step'} key={label}>
              <span>{index < step ? <Check size={15} /> : index + 1}</span>
              <small>{label}</small>
            </div>
          ))}
        </div>

        <section className="onboarding-card">
          {step === 0 && (
            <>
              <span className="section-kicker">Step 1</span>
              <h1>Tell us about your business.</h1>
              <div className="form-grid">
                <label className="wide">
                  <span>Business name</span>
                  <div className="input-shell">
                    <Building2 size={18} />
                    <input placeholder="Your business name" />
                  </div>
                </label>

                <label>
                  <span>Category</span>
                  <select defaultValue="">
                    <option value="" disabled>Select category</option>
                    {BUSINESS_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>

                <label>
                  <span>Shop link</span>
                  <div className="slug-input">
                    <span>gulako.site/</span>
                    <input placeholder="yourshopname" />
                  </div>
                </label>

                <label className="wide">
                  <span>Short description</span>
                  <textarea placeholder="Tell customers what you sell" />
                </label>

                <div className="wide">
                  <ShopLogoUpload />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <span className="section-kicker">Step 2</span>
              <h1>How can customers reach you?</h1>
              <div className="form-grid">
                <label>
                  <span>WhatsApp number</span>
                  <div className="input-shell">
                    <MessageCircle size={18} />
                    <input placeholder="+256..." />
                  </div>
                </label>

                <label>
                  <span>Phone number</span>
                  <div className="input-shell">
                    <MessageCircle size={18} />
                    <input placeholder="+256..." />
                  </div>
                </label>

                <label className="wide">
                  <span>Business location</span>
                  <div className="input-shell">
                    <MapPin size={18} />
                    <input placeholder="Town, city or area" />
                  </div>
                </label>

                <label className="wide">
                  <span>Google Maps link / Plus Code</span>
                  <div className="input-shell">
                    <Link2 size={18} />
                    <input placeholder="Paste map link or Plus Code" />
                  </div>
                </label>

                <label>
                  <span>Opening time</span>
                  <div className="input-shell">
                    <Clock size={18} />
                    <input placeholder="08:00" />
                  </div>
                </label>

                <label>
                  <span>Closing time</span>
                  <div className="input-shell">
                    <Clock size={18} />
                    <input placeholder="18:00" />
                  </div>
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <span className="section-kicker">Step 3</span>
              <h1>Connect your social channels.</h1>
              <div className="form-grid">
                <label className="wide">
                  <span>TikTok</span>
                  <div className="input-shell">
                    <span className="mini-social">♪</span>
                    <input placeholder="@yourbusiness" />
                  </div>
                </label>

                <label className="wide">
                  <span>Instagram</span>
                  <div className="input-shell">
                    <Instagram size={18} />
                    <input placeholder="@yourbusiness" />
                  </div>
                </label>

                <label className="wide">
                  <span>Facebook</span>
                  <div className="input-shell">
                    <span className="mini-social">f</span>
                    <input placeholder="Page username or link" />
                  </div>
                </label>

                <label className="wide">
                  <span>Delivery information</span>
                  <textarea placeholder="e.g. Same-day delivery in Kampala. Delivery fee depends on location." />
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="finish-step">
              <div className="success-orb">
                <Check size={34} />
              </div>
              <span className="section-kicker">Ready to go</span>
              <h1>Your Gulako shop is ready.</h1>
              <p>Add your first products, preview the shop, then share your link everywhere.</p>
              <div className="finish-preview">
                <span className="mini-avatar">G</span>
                <div>
                  <strong>Your shop</strong>
                  <small>Your Gulako link will appear here</small>
                </div>
              </div>
            </div>
          )}

          <div className="onboarding-actions">
            {step > 0 ? (
              <button className="soft-button" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={17} /> Back
              </button>
            ) : (
              <span />
            )}

            <button className="primary-button" onClick={next}>
              {step === 3 ? 'Go to dashboard' : 'Continue'} <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
