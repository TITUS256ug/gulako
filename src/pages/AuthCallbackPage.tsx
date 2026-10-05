import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from '../components/Logo'
import { resolveAuthSessionFromUrl } from '../lib/authRedirect'

export function AuthCallbackPage() {
  const [failed,setFailed]=useState(false)

  useEffect(()=>{
    let active=true
    void resolveAuthSessionFromUrl().then(session=>{
      if(!active)return
      if(session) window.location.replace('/dashboard')
      else setFailed(true)
    }).catch(()=>{ if(active)setFailed(true) })
    return()=>{active=false}
  },[])

  if(failed){
    return <main className="auth-callback-page">
      <Logo/>
      <h1>We couldn’t finish signing you in.</h1>
      <p>Your email may already be confirmed. Sign in with your email and password.</p>
      <a className="primary-button" href="/signin">Go to sign in</a>
    </main>
  }

  return <main className="auth-callback-page">
    <Logo/>
    <span className="auth-callback-icon"><CheckCircle2 size={24}/></span>
    <h1>Confirming your account…</h1>
    <p>This should only take a moment.</p>
  </main>
}
