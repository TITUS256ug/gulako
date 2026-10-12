import { useEffect,useState } from 'react'
import { Eye,ShoppingBag,TrendingUp,BarChart3 } from 'lucide-react'
import { DashboardShell } from '../components/DashboardShell'
import { fetchTrafficReport,type TrafficReport } from '../lib/traffic'
const labels:Record<string,string>={direct:'Direct / unknown',google:'Google',bing:'Bing',chatgpt:'ChatGPT',perplexity:'Perplexity',social:'Social',campaign:'Other campaign',referral:'Other referral'}
export function TrafficPage(){
  const [report,setReport]=useState<TrafficReport|null>(null),[error,setError]=useState('')
  useEffect(()=>{let active=true;void fetchTrafficReport().then(r=>{if(active)setReport(r)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[])
  const conversion=report?.sessions?100*report.convertedSessions/report.sessions:0
  return <DashboardShell title="Traffic & orders" subtitle="Measured visitor sessions and the orders they create · last 30 days.">
    {error?<section className="dash-card premium-card"><h2>Reporting is not available yet</h2><p role="alert">{error}</p></section>:!report?<p role="status">Loading measured activity…</p>:<>
      <section className="metric-grid premium-metrics">
        <article><span className="metric-icon"><Eye size={20}/></span><div><small>Visitor sessions</small><strong>{report.sessions}</strong><em>Owner previews excluded</em></div></article>
        <article><span className="metric-icon"><BarChart3 size={20}/></span><div><small>Session conversion</small><strong>{conversion.toFixed(1)}%</strong><em>{report.convertedSessions} sessions placed an order</em></div></article>
        <article><span className="metric-icon"><ShoppingBag size={20}/></span><div><small>Attributed orders</small><strong>{report.orders}</strong><em>Orders linked at checkout</em></div></article>
        <article><span className="metric-icon"><TrendingUp size={20}/></span><div><small>Completed order value</small><strong>UGX {new Intl.NumberFormat('en-UG').format(report.completedRevenue)}</strong><em>Attributed orders marked completed</em></div></article>
      </section>
      {!report.sessions&&<section className="dash-card premium-card"><h2>Your first visits will appear here</h2><p>Tracking starts with this release. Share your shop link to begin measuring visits and orders.</p></section>}
      <div className="discovery-layout"><section className="dash-card premium-card"><h2>Customer actions</h2><p>Sessions taking each action. Customers can skip steps, so these counts are not a strict funnel.</p><div className="traffic-actions">{[['Visited a shop or product',report.sessions],['Viewed a product',report.productSessions],['Added to cart',report.cartSessions],['Started checkout',report.checkoutSessions],['Clicked WhatsApp',report.whatsappSessions],['Placed an order',report.convertedSessions]].map(([label,count])=><div key={label}><span>{label}</span><strong>{count}</strong></div>)}</div></section>
      <section className="dash-card premium-card"><h2>Where visitors came from</h2><div className="traffic-table"><table><thead><tr><th>Source</th><th>Sessions</th><th>Orders</th></tr></thead><tbody>{report.sources.map(row=><tr key={row.source}><td>{labels[row.source]||row.source}</td><td>{row.sessions}</td><td>{row.orders}</td></tr>)}</tbody></table></div></section></div>
      <section className="dash-card premium-card traffic-notes"><h2>What these numbers mean</h2><p>A session ends after 30 minutes of inactivity in a browser tab. Attribution uses the first recognised referrer or UTM source for that shop session. It does not follow customers across devices.</p><p>Signed-in owner previews and browsers sending Do Not Track are excluded. Blocked tracking, missing referrers and purchases completed only on WhatsApp cannot be measured reliably. A WhatsApp click is an enquiry, not an order.</p><p>Orders and completed value refer to sessions beginning in this 30-day window. Old orders and the historical seeded view counter are excluded. Completed order value reflects seller status updates, not independently verified payments.</p></section>
    </>}
  </DashboardShell>
}
