import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { backend } from '../lib/backend'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [allowed,setAllowed]=useState<boolean|null>(null)

  useEffect(()=>{
    let active=true

    const finish=(session:unknown)=>{
      if(!active)return
      if(session)setAllowed(true)
      else{
        const next=encodeURIComponent(window.location.pathname+window.location.search)
        window.location.replace('/signin?next='+next)
      }
    }

    const {data}=backend.auth.onAuthStateChange((event,session)=>{
      if(!active)return
      if(event==='INITIAL_SESSION'||event==='SIGNED_IN'||event==='TOKEN_REFRESHED')finish(session)
      if(event==='SIGNED_OUT')finish(null)
    })

    backend.auth.getSession().then(({data})=>{
      if(active&&data.session)setAllowed(true)
    })

    return()=>{active=false;data.subscription.unsubscribe()}
  },[])

  if(allowed!==true)return null
  return <>{children}</>
}
