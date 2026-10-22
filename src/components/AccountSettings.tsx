import { Crown, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { backend } from '../lib/backend'
import { SignOutButton } from './SignOutButton'

export function AccountSettings() {
  const [account, setAccount] = useState<{ email: string; role: string } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const { data: { user }, error: authError } = await backend.auth.getUser()
        if (authError || !user) throw authError
        const { data, error: profileError } = await backend.from('profiles').select('role').eq('id', user.id).single()
        if (profileError || !data) throw profileError
        if (active) setAccount({ email: user.email || '', role: data.role })
      } catch {
        if (active) setError(true)
      }
    })()
    return () => { active = false }
  }, [])

  const founder = account?.role === 'founder' || account?.role === 'admin'
  return <>
    <section className="dash-card premium-card settings-row settings-account" aria-label="Signed-in account">
      <div><span className="section-kicker"><ShieldCheck size={15} /> Your account</span><h2>{account?.email || (error ? 'Account unavailable' : 'Loading your account…')}</h2>
        <p>{account ? `Account role: ${founder ? (account.role === 'founder' ? 'Founder' : 'Admin') : 'Seller'}. Your subscription plan is managed separately below.` : error ? 'Please refresh to load your account details.' : 'Checking your access…'}</p></div>
      {founder && <a className="primary-button" href="/founder"><Crown size={17} /> Founder dashboard</a>}
    </section>
    <section className="dash-card premium-card settings-row" aria-label="Sign out of Gulako">
      <div><h2>Sign out</h2><p>Sign out of this device. Your saved shop, products and orders stay in your account.</p></div>
      <SignOutButton />
    </section>
  </>
}
