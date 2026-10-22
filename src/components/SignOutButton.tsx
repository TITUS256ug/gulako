import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { backend } from '../lib/backend'
import { clearSellerLocalData } from '../lib/storeData'

export function SignOutButton({ className = 'soft-button', iconSize = 18 }: { className?: string; iconSize?: number }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const signOut = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const { error: authError } = await backend.auth.signOut({ scope: 'local' })
      if (authError) throw authError
      clearSellerLocalData()
      window.location.replace('/signin')
    } catch {
      setError('Could not sign out. Please try again.')
      setBusy(false)
    }
  }

  return <span className="signout-control">
    <button type="button" className={className} onClick={() => void signOut()} disabled={busy} aria-label={busy ? 'Signing out…' : 'Sign out'} title="Sign out">
      <LogOut size={iconSize} aria-hidden="true" /><span>{busy ? 'Signing out…' : 'Sign out'}</span>
    </button>
    {error && <span className="signout-error" role="alert">{error}</span>}
  </span>
}
