import { BarChart3, Bell, Boxes, CreditCard, Eye, LayoutDashboard, LogOut, Moon, Palette, Settings, ShoppingBag, Sun, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { getShopLogo } from '../lib/shopBrand'
import { clearSellerLocalData, getStoreAccent, getStoreProfile, hydrateSellerData } from '../lib/storeData'
import { backend } from '../lib/backend'
import { applyTheme, getTheme } from '../lib/theme'
import { Logo } from './Logo'
import { InstallAppButton } from './InstallAppButton'
import { fetchSellerNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/orders'
import type { SellerNotification } from '../lib/orders'

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Boxes },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/store', label: 'Store', icon: Palette },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function DashboardShell({ children, title, subtitle, action }: { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const path = window.location.pathname
  const [logo,setLogo]=useState(()=>getShopLogo())
  const [profile,setProfile]=useState(()=>getStoreProfile())
  const [role,setRole]=useState('seller')
  const [plan,setPlan]=useState('free')
  const [dark,setDark]=useState(()=>getTheme()==='dark')
  const [notifications,setNotifications]=useState<SellerNotification[]>([])
  const [notificationsOpen,setNotificationsOpen]=useState(false)

  useEffect(()=>{
    applyTheme(dark?'dark':'light')
  },[dark])

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


  useEffect(()=>{
    let active=true
    const load=async()=>{
      try{
        const next=await fetchSellerNotifications()
        if(active)setNotifications(next)
      }catch{/* notifications should never block the seller workspace */}
    }
    void load()
    const refresh=()=>void load()
    window.addEventListener('gulako-orders',refresh)
    const timer=window.setInterval(refresh,30000)
    return()=>{
      active=false
      window.removeEventListener('gulako-orders',refresh)
      window.clearInterval(timer)
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
          <div className="dashboard-top-actions">
            <span className="dashboard-install"><InstallAppButton compact/></span>
            <button className="icon-button dashboard-theme-toggle" onClick={()=>setDark(value=>!value)} aria-label={dark?'Use light mode':'Use dark mode'} title={dark?'Use light mode':'Use dark mode'}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
            <div className="notification-wrap">
              <button className="icon-button dashboard-notification-button" onClick={()=>setNotificationsOpen(value=>!value)} aria-label="Notifications"><Bell size={18}/>{notifications.some(item=>!item.readAt)&&<span className="notification-badge">{notifications.filter(item=>!item.readAt).length}</span>}</button>
              {notificationsOpen&&<div className="notification-panel">
                <div className="notification-panel-head"><div><strong>Notifications</strong><small>{notifications.filter(item=>!item.readAt).length} unread</small></div>{notifications.some(item=>!item.readAt)&&<button onClick={async()=>{await markAllNotificationsRead();setNotifications(items=>items.map(item=>({...item,readAt:item.readAt||new Date().toISOString()})))}}>Mark all read</button>}</div>
                <div className="notification-list">{notifications.length?notifications.map(item=><a className={item.readAt?'notification-item':'notification-item unread'} key={item.id} href={item.href} onClick={()=>{if(!item.readAt)void markNotificationRead(item.id)}}><span/><div><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div></a>):<div className="notification-empty">You’re all caught up.</div>}</div>
              </div>}
            </div>
            {action}
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
