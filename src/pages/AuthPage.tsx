import { ArrowRight, Eye, LockKeyhole, Mail, Music2, Smartphone } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Logo } from '../components/Logo'

export function AuthPage({ mode = 'signin' }: { mode?: 'signin'|'signup' }) {
  const [showPassword, setShowPassword] = useState(false)
  const isSignup = mode === 'signup'
  const continueDemo = () => { window.location.href = isSignup ? '/onboarding' : '/dashboard' }
  return <div className="auth-page">
    <section className="auth-panel">
      <Logo />
      <div className="auth-copy"><span className="section-kicker">{isSignup ? 'Open your shop' : 'Welcome back'}</span><h1>{isSignup ? 'Start selling on Gulako.' : 'Sign in to Gulako.'}</h1><p>{isSignup ? 'Create a beautiful storefront in minutes.' : 'Manage your shop, orders and customers.'}</p></div>
      <div className="social-auth-grid">
        <button className="social-auth google" onClick={continueDemo}><span className="social-letter">G</span> Continue with Google (Gmail)</button>
        <button className="social-auth tiktok" onClick={continueDemo}><Music2 size={19}/> Continue with TikTok</button>
        <button className="social-auth phone" onClick={continueDemo}><Smartphone size={19}/> Continue with phone</button>
      </div>
      <div className="auth-divider"><span>or use email</span></div>
      <form className="auth-form" onSubmit={(e: FormEvent)=>{e.preventDefault();continueDemo()}}>
        {isSignup && <label><span>Your name</span><div className="input-shell"><input required placeholder="e.g. Titus" /></div></label>}
        <label><span>Email</span><div className="input-shell"><Mail size={18}/><input type="email" required placeholder="you@example.com" /></div></label>
        <label><span>Password</span><div className="input-shell"><LockKeyhole size={18}/><input type={showPassword?'text':'password'} required placeholder="••••••••"/><button type="button" onClick={()=>setShowPassword(v=>!v)}><Eye size={17}/></button></div></label>
        {!isSignup && <div className="auth-options"><label className="check-row"><input type="checkbox"/> Remember me</label><a href="#">Forgot password?</a></div>}
        <button className="primary-button large full-width" type="submit">{isSignup ? 'Create account' : 'Sign in'} <ArrowRight size={18}/></button>
      </form>
      <p className="auth-switch">{isSignup ? 'Already have an account?' : 'New to Gulako?'} <a href={isSignup?'/signin':'/signup'}>{isSignup?'Sign in':'Create free account'}</a></p>
      <small className="auth-legal">By continuing, you agree to Gulako's terms and privacy policy.</small>
    </section>
    <aside className="auth-visual"><div className="auth-gradient"/><div className="auth-showcase-card"><div className="showcase-top"><span className="mini-avatar">N</span><div><strong>Nile AI Solutions</strong><small>gulako.shop/nile-ai-solutions</small></div></div><img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=86" alt="Product"/><div className="auth-card-bottom"><strong>Your shop. Your customers.</strong><span>Share anywhere →</span></div></div></aside>
  </div>
}
