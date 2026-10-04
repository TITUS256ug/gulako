import { BarChart3, Bell, Boxes, Eye, LayoutDashboard, LogOut, Package, Palette, Settings, ShoppingBag, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getShopLogo } from '../lib/shopBrand'
import { getStoreProfile } from '../lib/storeData'
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

  useEffect(()=>{
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
  const previewHref = profile.businessName ? `/${profile.slug}` : '/dashboard/store'

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Logo />
        <div className="shop-switcher">
          {logo ? <img className="dash-logo-image" src={logo} alt="Shop logo"/> : <span className="dash-avatar">G</span>}
          <div><strong>{shopName}</strong><small>Free plan · 30 products</small></div>
        </div>
        <a className="sidebar-view-shop" href={previewHref}><Eye size={17}/><span>View shop</span></a>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className={(path === href) ? 'active' : ''}><Icon size={18} /> <span>{label}</span></a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href={previewHref}><Package size={18} /> <span>View shop</span></a>
          <a href="/signin"><LogOut size={18} /> <span>Sign out</span></a>
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
