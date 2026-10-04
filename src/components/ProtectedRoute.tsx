import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { backend } from '../lib/backend'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const [allowed,setAllowed]=useState<boolean|null>(null)

  useEffect(()=>{
    let active=true
    backend.auth.getSession().then(({data})=>{
      if(!active)return
      if(data.session)setAllowed(true)
      else{
        const next=encodeURIComponent(window.location.pathname+window.location.search)
        window.location.replace('/signin?next='+next)
      }
    })
    const {data}=backend.auth.onAuthStateChange((_event,session)=>{
      if(active && !session)window.location.replace('/signin')
    })
    return()=>{active=false;data.subscription.unsubscribe()}
  },[])

  if(allowed!==true)return null
  return <>{children}</>
}
