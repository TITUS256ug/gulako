import { BarChart3, Bell, Boxes, LayoutDashboard, LogOut, Package, Palette, Settings, ShoppingBag, Users } from 'lucide-react'
import type { ReactNode } from 'react'
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
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Logo />
        <div className="shop-switcher"><span className="dash-avatar">N</span><div><strong>Nile AI Solutions</strong><small>Free plan</small></div></div>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <a key={href} href={href} className={(path === href) ? 'active' : ''}><Icon size={18} /> {label}</a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <a href="/shop/nile-ai-solutions"><Package size={18} /> View shop</a>
          <a href="/signin"><LogOut size={18} /> Sign out</a>
        </div>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div><p className="eyebrow">Seller workspace</p><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          <div className="dashboard-top-actions"><button className="icon-button"><Bell size={18} /></button>{action}</div>
        </header>
        {children}
      </main>
    </div>
  )
}
