import { Crown, Search, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { backend } from '../lib/backend'

type Row={
  id:string
  email:string
  full_name:string|null
  role:string
  plan:'free'|'pro'|'business'
}

export function FounderPage(){
  const [rows,setRows]=useState<Row[]>([])
  const [query,setQuery]=useState('')
  const [state,setState]=useState<'loading'|'denied'|'ready'>('loading')
  const [message,setMessage]=useState('')

  useEffect(()=>{
    void (async()=>{
      const {data:{user}}=await backend.auth.getUser()
      if(!user){window.location.replace('/signin');return}
      const {data:me}=await backend.from('profiles').select('role').eq('id',user.id).maybeSingle()
      if(me?.role!=='founder'&&me?.role!=='admin'){setState('denied');return}
      const {data}=await backend.from('profiles').select('id,email,full_name,role,plan').order('created_at',{ascending:false})
      setRows((data??[]) as Row[])
      setState('ready')
    })()
  },[])

  const visible=useMemo(()=>{
    const q=query.trim().toLowerCase()
    if(!q)return rows
    return rows.filter(row=>(row.email+' '+(row.full_name??'')+' '+row.plan).toLowerCase().includes(q))
  },[rows,query])

  const changePlan=async(id:string,plan:'free'|'pro'|'business')=>{
    setMessage('')
    const {error}=await backend.rpc('set_user_plan',{
      target_user:id,
      new_plan:plan,
      expires_at:null,
      reason:'Founder dashboard',
    })
    if(error){setMessage(error.message);return}
    setRows(current=>current.map(row=>row.id===id?{...row,plan}:row))
    setMessage('Plan updated.')
  }

  if(state==='loading')return null
  if(state==='denied')return <main className="founder-denied"><ShieldCheck size={34}/><h1>Founder access only</h1><a className="primary-button" href="/dashboard">Back to dashboard</a></main>

  return <main className="founder-page">
    <header className="founder-header"><div><span className="section-kicker"><Crown size={15}/> Founder</span><h1>Founder dashboard</h1><p>Manage seller plans and access.</p></div><a className="soft-button" href="/dashboard">Seller dashboard</a></header>
    <section className="founder-summary">
      <article><small>Users</small><strong>{rows.length}</strong></article>
      <article><small>Pro</small><strong>{rows.filter(row=>row.plan==='pro').length}</strong></article>
      <article><small>Business</small><strong>{rows.filter(row=>row.plan==='business').length}</strong></article>
      <article><small>Free</small><strong>{rows.filter(row=>row.plan==='free').length}</strong></article>
    </section>
    <section className="founder-card">
      <div className="founder-toolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name or email"/></label>{message&&<span>{message}</span>}</div>
      <div className="founder-users">
        {visible.map(row=><article key={row.id}>
          <div><strong>{row.full_name||'Seller'}</strong><small>{row.email}</small></div>
          <span className={'founder-role '+row.role}>{row.role}</span>
          <select value={row.plan} onChange={e=>void changePlan(row.id,e.target.value as 'free'|'pro'|'business')}>
            <option value="free">Free</option><option value="pro">Pro</option><option value="business">Business</option>
          </select>
        </article>)}
      </div>
    </section>
  </main>
}
