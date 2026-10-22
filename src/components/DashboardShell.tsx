import { BarChart3, Bell, Boxes, Clock3, CreditCard, Crown, Eye, LayoutDashboard, Menu, Moon, Palette, Search, Settings, Sparkles, ShoppingBag, Sun, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { getShopLogo } from '../lib/shopBrand'
import { getStoreAccent, getStoreProfile, hydrateSellerData } from '../lib/storeData'
import { backend } from '../lib/backend'
import { applyTheme, getTheme } from '../lib/theme'
import { Logo } from './Logo'
import { InstallAppButton } from './InstallAppButton'
import { SignOutButton } from './SignOutButton'
import { fetchSellerNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/orders'
import type { SellerNotification } from '../lib/orders'

const links = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/products', label: 'Products', icon: Boxes },
  { href: '/dashboard/ai-writer', label: 'AI Writer', icon: Sparkles },
  { href: '/dashboard/business-details', label: 'FAQs & Hours', icon: Clock3 },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/discovery', label: 'Get discovered', icon: Search },
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
  const [mobileMenuOpen,setMobileMenuOpen]=useState(false)

  useEffect(()=>{
    if(!mobileMenuOpen)return
    const dismiss=(event:KeyboardEvent)=>{if(event.key==='Escape')setMobileMenuOpen(false)}
    window.addEventListener('keydown',dismiss)
    return()=>window.removeEventListener('keydown',dismiss)
  },[mobileMenuOpen])

  useEffect(()=>{
    applyTheme(dark?'dark':'light')
  },[dark])

  useEffect(()=>{
    let active=true
    void hydrateSellerData()
    const loadAccount=async()=>{
      const {data:{user}}=await backend.auth.getUser()
      if(!user)return
      const {data}=await backend.from('profiles').select('role,plan').eq('id',user.id).maybeSingle()
      if(active&&data){setRole(data.role);setPlan(data.plan)}
    }
    const refreshAccount=()=>void loadAccount().catch(()=>undefined)
    refreshAccount()
    window.addEventListener('gulako-account',refreshAccount)
    window.addEventListener('focus',refreshAccount)
    const refresh=()=>{
      setLogo(getShopLogo())
      setProfile(getStoreProfile())
    }
    window.addEventListener('gulako-brand',refresh)
    window.addEventListener('gulako-store',refresh)
    return()=>{
      active=false
      window.removeEventListener('gulako-account',refreshAccount)
      window.removeEventListener('focus',refreshAccount)
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
        </nav>
        <div className="sidebar-bottom">
          {(role==='founder'||role==='admin')&&<a className="sidebar-founder" href="/founder" title="Founder dashboard" aria-label="Founder dashboard"><Crown size={18}/><span>Founder dashboard</span></a>}
          <SignOutButton className="sidebar-signout" />
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="eyebrow">Seller workspace</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          <div className="dashboard-top-actions">
            {(role==='founder'||role==='admin')&&<a className="soft-button dashboard-founder-link" href="/founder"><Crown size={17}/> Founder</a>}
            <SignOutButton className="soft-button dashboard-signout" />
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
      <nav className="mobile-dashboard-nav" aria-label="Seller mobile navigation">
        <a className={path==='/dashboard'?'active':''} href="/dashboard"><LayoutDashboard size={20}/><span>Home</span></a>
        <a className={path==='/dashboard/products'?'active':''} href="/dashboard/products"><Boxes size={20}/><span>Products</span></a>
        <a className={path==='/dashboard/orders'?'active':''} href="/dashboard/orders"><ShoppingBag size={20}/><span>Orders</span></a>
        <a className={path==='/dashboard/billing'?'active':''} href="/dashboard/billing"><CreditCard size={20}/><span>Billing</span></a>
        <button type="button" className={mobileMenuOpen?'active':''} aria-expanded={mobileMenuOpen} aria-controls="gulako-seller-more" onClick={()=>setMobileMenuOpen(v=>!v)}>{mobileMenuOpen?<X size={20}/>:<Menu size={20}/>}<span>More</span></button>
      </nav>
      {mobileMenuOpen&&<>
        <button className="mobile-dashboard-scrim" aria-label="Close seller menu" onClick={()=>setMobileMenuOpen(false)}/>
        <div className="mobile-dashboard-drawer" id="gulako-seller-more" role="dialog" aria-label="Seller navigation">
          <div className="mobile-dashboard-drawer-head"><strong>Seller menu</strong><button type="button" aria-label="Close menu" onClick={()=>setMobileMenuOpen(false)}><X size={19}/></button></div>
          <nav aria-label="All seller pages">
            {links.map(({href,label,icon:Icon})=><a key={href} href={href} className={path===href?'active':''}><Icon size={19}/>{label}</a>)}
            <a href={previewHref} target={hasPublishedShop?'_blank':undefined} rel={hasPublishedShop?'noreferrer':undefined}><Eye size={19}/>{hasPublishedShop?'View shop':'Set up shop'}</a>
            {(role==='founder'||role==='admin')&&<a href="/founder"><Settings size={19}/>Founder</a>}
          </nav>
          <SignOutButton className="mobile-dashboard-signout" iconSize={19}/>
        </div>
      </>}
    </div>
  )
}
