import { ArrowRight, Eye, LockKeyhole, Mail, Music2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { InstallAppButton } from '../components/InstallAppButton'
import { Logo } from '../components/Logo'

export function AuthPage({ mode = 'signin' }: { mode?: 'signin'|'signup' }) {
  const [showPassword, setShowPassword] = useState(false)
  const isSignup = mode === 'signup'
  const continueDemo = () => { window.location.href = isSignup ? '/onboarding' : '/dashboard' }

  return <div className="auth-page">
    <section className="auth-panel">
      <Logo />
      <div className="auth-copy">
        <span className="section-kicker">{isSignup ? 'Open your shop' : 'Welcome back'}</span>
        <h1>{isSignup ? 'Start selling on Gulako.' : 'Sign in to Gulako.'}</h1>
        <p>{isSignup ? 'Create your storefront and start selling.' : 'Manage your shop, orders and customers.'}</p>
      </div>

      <form className="auth-form" onSubmit={(e: FormEvent)=>{e.preventDefault();continueDemo()}}>
        {isSignup && <label><span>Your name</span><div className="input-shell"><input required placeholder="Your name" /></div></label>}
        <label><span>Email</span><div className="input-shell"><Mail size={18}/><input type="email" required placeholder="you@example.com" /></div></label>
        <label><span>Password</span><div className="input-shell"><LockKeyhole size={18}/><input type={showPassword?'text':'password'} required placeholder="••••••••"/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}><Eye size={17}/></button></div></label>
        {!isSignup && <div className="auth-options"><label className="check-row"><input type="checkbox"/> Remember me</label><a href="#">Forgot password?</a></div>}
        <button className="primary-button large full-width" type="submit">{isSignup ? 'Create account' : 'Sign in'} <ArrowRight size={18}/></button>
      </form>

      <div className="auth-divider"><span>or continue with</span></div>

      <div className="social-auth-grid">
        <button className="social-auth google" onClick={continueDemo}><span className="social-letter">G</span> Continue with Google</button>
        <button className="social-auth tiktok" onClick={continueDemo}><Music2 size={19}/> Continue with TikTok</button>
      </div>

      <a className="demo-shop-link" href="/demo">View demo shop</a>
      <InstallAppButton />

      <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to Gulako?'} <a href={isSignup?'/signin':'/signup'}>{isSignup?'Sign in':'Create account'}</a></p>
      <small className="auth-legal">By continuing, you agree to Gulako's terms and privacy policy.</small>
    </section>

    <aside className="auth-visual">
      <div className="auth-gradient"/>
      <div className="auth-showcase-card clean-auth-card">
        <div className="brand-showcase-mark">g</div>
        <strong>Run your shop from one place.</strong>
        <span>Products · Orders · Customers</span>
      </div>
    </aside>
  </div>
}
