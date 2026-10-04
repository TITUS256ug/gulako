import { Download } from 'lucide-react'
import { useEffect, useState } from 'react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallAppButton({ compact = false }: { compact?: boolean }) {
  const [promptEvent,setPromptEvent]=useState<InstallPromptEvent|null>(null)
  const [installed,setInstalled]=useState(false)

  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches
    setInstalled(standalone)
    const handler=(event:Event)=>{
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
    }
    const installedHandler=()=>setInstalled(true)
    window.addEventListener('beforeinstallprompt',handler)
    window.addEventListener('appinstalled',installedHandler)
    return()=>{
      window.removeEventListener('beforeinstallprompt',handler)
      window.removeEventListener('appinstalled',installedHandler)
    }
  },[])

  const install=async()=>{
    if(installed)return
    if(promptEvent){
      await promptEvent.prompt()
      await promptEvent.userChoice
      setPromptEvent(null)
      return
    }
    window.alert('Use your browser menu and choose "Install app" or "Add to Home Screen".')
  }

  if(installed)return null
  return <button className={compact?'install-app-button compact':'install-app-button'} type="button" onClick={install}><Download size={17}/> Install Gulako</button>
}
