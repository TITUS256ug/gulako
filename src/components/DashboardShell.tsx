import { BarChart3, Bell, Boxes, Eye, LayoutDashboard, LogOut, Palette, Settings, ShoppingBag, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { getShopLogo } from '../lib/shopBrand'
import { clearSellerLocalData, getStoreAccent, getStoreProfile, hydrateSellerData } from '../lib/storeData'
import { backend } from '../lib/backend'
import { Logo } from './Logo'

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Boxes },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/store', label: 'Store', icon: Palette },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardShell({ children, title, subtitle, action }: { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const path = window.location.pathname
  const [logo,setLogo]=useState(()=>getShopLogo())
  const [profile,setProfile]=useState(()=>getStoreProfile())
  const [role,setRole]=useState('seller')
  const [plan,setPlan]=useState('free')

  useEffect(()=>{
    void hydrateSellerData()
    void (async()=>{
      const {data:{user}}=await backend.auth.getUser()
      if(!user)return
      const {data}=await backend.from('profiles').select('role,plan').eq('id',user.id).maybeSingle()
      if(data){setRole(data.role);setPlan(data.plan)}
    })()
    const refresh=()=>{
      setLogo(getShopLogo())
      setProfile(getStoreProfile())
    }
    window.addEventListener('gulako-brand',refresh)
    window.addEventListener('gulako-store',refresh)
    return()=>{
      window.removeEventListener('gulako-brand',refresh)
      window.removeEventListener('gulako-store',refresh)
    }
  },[])

  const shopName = profile.businessName || 'Your shop'
  const hasPublishedShop = Boolean(profile.businessName && profile.slug)
  const previewHref = hasPublishedShop ? `/${profile.slug}` : '/dashboard/store'
  const sellerAccent=getStoreAccent(profile)
  const sellerTheme={
    '--purple':sellerAccent,
    '--purple-2':sellerAccent,
    '--purple-3':`color-mix(in srgb, ${sellerAccent} 78%, white)`,
    '--purple-4':`color-mix(in srgb, ${sellerAccent} 42%, white)`,
    '--purple-soft':`color-mix(in srgb, ${sellerAccent} 12%, white)`,
  } as CSSProperties

  return (
    <div className="dashboard-shell seller-themed" style={sellerTheme}>
      <aside className="dashboard-sidebar">
        <Logo />
        <div className="shop-switcher">
          {logo ? <img className="dash-logo-image" src={logo} alt="Shop logo"/> : <span className="dash-avatar">G</span>}
          <div><strong>{shopName}</strong><small>{plan.charAt(0).toUpperCase()+plan.slice(1)} plan · {plan==='free'?'100 products':'Unlimited products'}</small></div>
        </div>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className={(path === href) ? 'active' : ''}><Icon size={18} /> <span>{label}</span></a>
          ))}
          <a className={hasPublishedShop?'sidebar-view-shop':'sidebar-view-shop disabled'} href={previewHref} target={hasPublishedShop?'_blank':undefined} rel={hasPublishedShop?'noreferrer':undefined}><Eye size={18}/><span>{hasPublishedShop?'View shop':'Set up shop'}</span></a>
          {(role==='founder'||role==='admin')&&<a href="/founder"><Settings size={18}/><span>Founder</span></a>}
        </nav>
        <div className="sidebar-bottom">
          <button className="sidebar-signout" onClick={async()=>{clearSellerLocalData();await backend.auth.signOut();window.location.replace('/signin')}}><LogOut size={18} /> <span>Sign out</span></button>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="eyebrow">Seller workspace</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          <div className="dashboard-top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>{action}</div>
        </header>
        {children}
      </main>
    </div>
  )
}
