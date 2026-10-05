import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { backend } from '../lib/backend'
import { resolveAuthSessionFromUrl } from '../lib/authRedirect'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [allowed,setAllowed]=useState<boolean|null>(null)

  useEffect(()=>{
    let active=true

    void resolveAuthSessionFromUrl().then(session=>{
      if(!active)return
      if(session){
        setAllowed(true)
        return
      }

      window.setTimeout(()=>{
        if(!active)return
        const next=encodeURIComponent(window.location.pathname+window.location.search)
        window.location.replace('/signin?next='+next)
      },350)
    }).catch(()=>{
      if(!active)return
      const next=encodeURIComponent(window.location.pathname+window.location.search)
      window.location.replace('/signin?next='+next)
    })

    const {data}=backend.auth.onAuthStateChange((event,session)=>{
      if(!active)return
      if(session)setAllowed(true)
      else if(event==='SIGNED_OUT')window.location.replace('/signin')
    })

    return()=>{active=false;data.subscription.unsubscribe()}
  },[])

  if(allowed!==true)return null
  return <>{children}</>
}
