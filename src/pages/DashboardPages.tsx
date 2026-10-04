import { ArrowUpRight, BarChart3, Boxes, Eye, MessageCircle, MoreHorizontal, PackagePlus, Plus, Search, Settings2, ShoppingBag, Sparkles, TrendingUp, Users } from 'lucide-react'
import { DashboardShell } from '../components/DashboardShell'
import { PricingSection } from '../components/PricingSection'
import { ShopLogoUpload } from '../components/ShopLogoUpload'
import { customers, orders, products } from '../data/mock'

const money=(n:number)=>new Intl.NumberFormat('en-UG').format(n)
const ActionButton=({label='Add product'}:{label?:string})=><a className="primary-button" href="/dashboard/products"><Plus size={17}/>{label}</a>

export function DashboardHomePage(){
  return <DashboardShell title="Overview" subtitle="A quick look at your shop today." action={<ActionButton/>}>
    <section className="dashboard-welcome">
      <div>
        <span className="dashboard-kicker"><Sparkles size={15}/> Free plan</span>
        <h2>Your shop is moving.</h2>
        <p>0 of 30 products active · unlimited orders.</p>
      </div>
      <div className="plan-usage">
        <div className="plan-usage-row"><span>Product capacity</span><strong>0 / 30</strong></div>
        <div className="plan-progress"><span style={{width:'0%'}}/></div>
        <a href="/dashboard/settings">View plans <ArrowUpRight size={14}/></a>
      </div>
    </section>

    <section className="metric-grid premium-metrics">
      <article><span className="metric-icon"><ShoppingBag size={20}/></span><div><small>Orders</small><strong>0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><TrendingUp size={20}/></span><div><small>Sales</small><strong>UGX 0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><Eye size={20}/></span><div><small>Shop views</small><strong>0</strong><em>No data yet</em></div></article>
      <article><span className="metric-icon"><Users size={20}/></span><div><small>Customers</small><strong>0</strong><em>No data yet</em></div></article>
    </section>

    <div className="dashboard-two-col">
      <section className="dash-card premium-card">
        <div className="dash-card-head"><div><h2>Recent orders</h2><p>Latest activity from your shop.</p></div><a href="/dashboard/orders">View all</a></div>
        <div className="order-table">{orders.map(o=><div className="order-row" key={o.id}><div><strong>{o.id}</strong><small>{o.customer}</small></div><span>UGX {money(o.total)}</span><span className={`status-pill ${o.status.toLowerCase()}`}>{o.status}</span><small>{o.time}</small></div>)}</div>
      </section>
      <aside className="dash-card premium-card shop-performance">
        <div className="dash-card-head"><div><h2>Store health</h2><p>Keep your shop ready to sell.</p></div></div>
        <div className="health-score"><strong>0</strong><span>/100</span></div>
        <div className="health-item"><span>Business profile</span><b>Start</b></div>
        <div className="health-item"><span>Add more products</span><b>+8 pts</b></div>
        <div className="health-item"><span>Delivery details</span><b>+5 pts</b></div>
        <a className="soft-button full-width" href="/dashboard/store"><Settings2 size={17}/> Improve store</a>
      </aside>
    </div>
  </DashboardShell>
}

export function DashboardProductsPage(){
  return <DashboardShell title="Products" subtitle="Manage what customers see in your shop." action={<ActionButton/>}>
    <section className="dash-card premium-card">
      <div className="product-toolbar"><label className="dashboard-search"><Search size={17}/><input placeholder="Search products"/></label><span>0 / 30 active on Free</span></div>
      <div className="inventory-grid">
        {products.filter(p=>p.shopSlug==='nile-ai-solutions').map(p=><article className="inventory-card" key={p.id}><img src={p.image} alt={p.name}/><div className="inventory-body"><div><small>{p.category}</small><strong>{p.name}</strong></div><button><MoreHorizontal size={18}/></button><span>UGX {money(p.price)}</span><em>{p.stock} in stock</em></div></article>)}
        <button className="add-product-card"><PackagePlus size={26}/><strong>Add product</strong><span>30 slots left on Free</span></button>
      </div>
    </section>
  </DashboardShell>
}

export function DashboardOrdersPage(){
  return <DashboardShell title="Orders" subtitle="Track and manage customer orders.">
    <section className="dash-card premium-card">
      <div className="dashboard-tabs"><button className="active">All <span>0</span></button><button>New <span>0</span></button><button>Confirmed</button><button>Delivering</button><button>Completed</button></div>
      <div className="order-table roomy">{orders.concat(orders).map((o,i)=><div className="order-row" key={`${o.id}-${i}`}><div><strong>{o.id}</strong><small>{o.customer}</small></div><span>UGX {money(o.total)}</span><span className={`status-pill ${o.status.toLowerCase()}`}>{o.status}</span><small>{o.time}</small><button className="table-action"><ArrowUpRight size={16}/></button></div>)}</div>
    </section>
  </DashboardShell>
}

export function DashboardCustomersPage(){
  return <DashboardShell title="Customers" subtitle="People who have ordered from your shop.">
    <section className="dash-card premium-card">
      <div className="product-toolbar"><label className="dashboard-search"><Search size={17}/><input placeholder="Search customers"/></label><span>0 customers</span></div>
      <div className="customer-list">{customers.map(c=><div className="customer-row" key={c.name}><span className="customer-avatar">{c.name[0]}</span><div><strong>{c.name}</strong><small>Last order: {c.last}</small></div><span>{c.orders} orders</span><strong>UGX {money(c.spent)}</strong><button className="table-action"><MessageCircle size={16}/></button></div>)}</div>
    </section>
  </DashboardShell>
}

export function DashboardAnalyticsPage(){
  return <DashboardShell title="Analytics" subtitle="Understand what’s working.">
    <section className="metric-grid premium-metrics"><article><span className="metric-icon"><BarChart3 size={20}/></span><div><small>Conversion</small><strong>0%</strong><em>No data yet</em></div></article><article><span className="metric-icon"><Eye size={20}/></span><div><small>Views</small><strong>0</strong><em>No data yet</em></div></article><article><span className="metric-icon"><ShoppingBag size={20}/></span><div><small>Orders</small><strong>0</strong><em>No data yet</em></div></article><article><span className="metric-icon"><TrendingUp size={20}/></span><div><small>Revenue</small><strong>UGX 0</strong><em>No data yet</em></div></article></section>
    <section className="dash-card premium-card analytics-card"><div className="dash-card-head"><div><h2>Sales trend</h2><p>Last 7 days</p></div></div><div className="fake-chart">{[36,58,48,72,62,88,76].map((h,i)=><div key={i}><span style={{height:`${h}%`}}/><small>{['M','T','W','T','F','S','S'][i]}</small></div>)}</div></section>
  </DashboardShell>
}

export function DashboardStorePage(){
  return <DashboardShell title="Store" subtitle="Customize how your business appears." action={<a className="soft-button" href="/dashboard/store"><Eye size={17}/> Preview shop</a>}>
    <div className="dashboard-two-col">
      <section className="dash-card premium-card form-card">
        <h2>Store profile</h2>
        <ShopLogoUpload/>
        <div className="form-grid">
          <label className="wide"><span>Business name</span><input placeholder="Your business name"/></label>
          <label><span>Category</span><input placeholder="Business category"/></label>
          <label><span>Location</span><input placeholder="Town, city or area"/></label>
          <label className="wide"><span>Description</span><textarea placeholder="Describe your business"/></label>
          <label className="wide"><span>WhatsApp</span><input placeholder="+256..."/></label>
          <label className="wide"><span>Google Maps / Plus Code</span><input placeholder="Paste link or code"/></label>
          <label><span>TikTok</span><input placeholder="@yourbusiness"/></label>
          <label><span>Instagram</span><input placeholder="@yourbusiness"/></label>
        </div>
        <button className="primary-button">Save changes</button>
      </section>
      <aside className="dash-card premium-card">
        <h2>Brand style</h2><p className="muted">Keep Gulako recognizable while giving your shop its own accent.</p>
        <div className="accent-picker"><button className="accent violet active"/><button className="accent indigo"/><button className="accent rose"/><button className="accent amber"/><button className="accent teal"/></div>
        <h3>Shop cover</h3><button className="upload-box"><Plus size={22}/><span>Add cover image</span></button>
      </aside>
    </div>
  </DashboardShell>
}

export function DashboardSettingsPage(){
  return <DashboardShell title="Settings" subtitle="Account, plan and business preferences.">
    <div className="settings-stack">
      <section className="dash-card premium-card settings-row"><div><h2>Current plan</h2><p>Free · 0 of 30 products active · unlimited orders</p></div><span className="current-plan-pill">Free</span></section>
      <section className="dash-card premium-card dashboard-pricing-wrap"><div className="dash-card-head"><div><h2>Plans & billing</h2><p>Upgrade when you need more products, maps or AI tools.</p></div></div><PricingSection compact/></section>
      <section className="dash-card premium-card settings-row"><div><h2>Login & security</h2><p>Email, Google, TikTok and phone sign-in.</p></div><button className="soft-button">Manage</button></section>
      <section className="dash-card premium-card settings-row"><div><h2>Notifications</h2><p>Order alerts and business updates.</p></div><button className="soft-button">Configure</button></section>
    </div>
  </DashboardShell>
}
