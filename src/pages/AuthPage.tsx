import { ArrowRight, Eye, LockKeyhole, Mail, Music2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { InstallAppButton } from '../components/InstallAppButton'
import { Logo } from '../components/Logo'
import { backend, backendConfigured } from '../lib/backend'
import { clearSellerLocalData } from '../lib/storeData'

function authErrorMessage(message:string){
  const value=message.toLowerCase()
  if(value.includes('error sending confirmation email')||value.includes('confirmation email')) return 'We could not send your confirmation email right now. Please try again shortly.'
  if(value.includes('email not confirmed')) return 'Please confirm your email before signing in.'
  if(value.includes('invalid login credentials')) return 'Incorrect email or password.'
  return message
}

export function AuthPage({ mode = 'signin' }: { mode?: 'signin'|'signup' }) {
  const [showPassword, setShowPassword] = useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [pendingEmail,setPendingEmail]=useState('')
  const isSignup = mode === 'signup'

  const submit=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    if(!backendConfigured){setError('Authentication is being connected. Please try again shortly.');return}
    setBusy(true);setError('');setMessage('')
    const form=new FormData(e.currentTarget)
    const email=String(form.get('email')||'').trim()
    const password=String(form.get('password')||'')
    const fullName=String(form.get('fullName')||'').trim()

    if(isSignup){
      const {data,error}=await backend.auth.signUp({
        email,
        password,
        options:{
          data:{full_name:fullName},
          emailRedirectTo:window.location.origin+'/auth/callback',
        },
      })
      if(error){setError(authErrorMessage(error.message));setBusy(false);return}
      if(data.session){
        clearSellerLocalData(data.user?.id)
        window.location.replace('/dashboard')
      }
      else {
        setPendingEmail(email)
        setMessage('Verification email sent. Open it to activate your account.')
      }
    }else{
      const {data,error}=await backend.auth.signInWithPassword({email,password})
      if(error){setError(authErrorMessage(error.message));setBusy(false);return}
      clearSellerLocalData(data.user?.id)
      const next=new URLSearchParams(window.location.search).get('next')
      window.location.replace(next||'/dashboard')
    }
    setBusy(false)
  }

  const social=async(provider:'google'|'tiktok')=>{
    setError('')
    if(!backendConfigured){setError('Authentication is being connected. Please try again shortly.');return}
    const chosen=provider==='google'?'google':'custom:tiktok'
    const {error}=await backend.auth.signInWithOAuth({
      provider:chosen as never,
      options:{redirectTo:window.location.origin+'/auth/callback'},
    })
    if(error)setError(provider==='tiktok'?'TikTok sign-in will activate after provider credentials are connected.':error.message)
  }

  const resend=async()=>{
    if(!pendingEmail)return
    setError('');setMessage('')
    const {error}=await backend.auth.resend({
      type:'signup',
      email:pendingEmail,
      options:{emailRedirectTo:window.location.origin+'/auth/callback'},
    })
    if(error)setError(authErrorMessage(error.message))
    else setMessage('Verification email sent again.')
  }

  const reset=async()=>{
    if(!backendConfigured){setError('Authentication is being connected. Please try again shortly.');return}
    const email=window.prompt('Enter your email address')
    if(!email)return
    const {error}=await backend.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/signin'})
    setMessage(error?authErrorMessage(error.message):'Password reset email sent.')
  }

  return <div className="auth-page">
    <section className="auth-panel">
      <Logo />
      <div className="auth-copy">
        <span className="section-kicker">{isSignup ? 'Open your shop' : 'Welcome back'}</span>
        <h1>{isSignup ? 'Start selling on Gulako.' : 'Sign in to Gulako.'}</h1>
        <p>{isSignup ? 'Create your storefront and start selling.' : 'Manage your shop, orders and customers.'}</p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        {isSignup && <label><span>Your name</span><div className="input-shell"><input name="fullName" required placeholder="Your name" /></div></label>}
        <label><span>Email</span><div className="input-shell"><Mail size={18}/><input name="email" type="email" required placeholder="you@example.com" autoComplete="email" /></div></label>
        <label><span>Password</span><div className="input-shell"><LockKeyhole size={18}/><input name="password" type={showPassword?'text':'password'} required minLength={6} placeholder="••••••••" autoComplete={isSignup?'new-password':'current-password'}/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'}><Eye size={17}/></button></div></label>
        {!isSignup && <div className="auth-options"><label className="check-row"><input type="checkbox" defaultChecked/> Remember me</label><button className="link-button" type="button" onClick={reset}>Forgot password?</button></div>}
        {error&&<p className="auth-error">{error}</p>}
        {message&&<p className="auth-success">{message}</p>}
        {pendingEmail&&<button className="resend-verification" type="button" onClick={resend}>Resend verification email</button>}
        <button className="primary-button large full-width" type="submit" disabled={busy}>{busy?'Please wait…':isSignup ? 'Create account' : 'Sign in'} {!busy&&<ArrowRight size={18}/>}</button>
      </form>

      <div className="auth-divider"><span>or continue with</span></div>

      <div className="social-auth-grid">
        <button className="social-auth google" type="button" onClick={()=>social('google')}><span className="social-letter">G</span> Continue with Google</button>
        <button className="social-auth tiktok" type="button" onClick={()=>social('tiktok')}><Music2 size={19}/> Continue with TikTok</button>
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
