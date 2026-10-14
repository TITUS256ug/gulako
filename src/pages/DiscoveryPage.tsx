import { Check, ArrowUpRight, Search, Circle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DashboardShell } from '../components/DashboardShell'
import { getStoreProfile, getSellerProducts, hydrateSellerData } from '../lib/storeData'
import { backend } from '../lib/backend'

export function DiscoveryPage() {
  const [profile, setProfile] = useState(getStoreProfile)
  const [products, setProducts] = useState(getSellerProducts)
  const [published, setPublished] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    void (async () => {
      try {
        await hydrateSellerData()
        const { data: { user } } = await backend.auth.getUser()
        if (!active || !user) return
        setProfile(getStoreProfile()); setProducts(getSellerProducts())
        const {data, error: queryError} = await backend.from('shops').select('published').eq('owner_id', user.id).maybeSingle()
        if (queryError) throw queryError
        if (active) setPublished(Boolean(data?.published))
      } catch { if (active) setError('Could not confirm your shop status. Please reload to try again.') }
    })()
    return () => { active = false }
  }, [])
  const checks = [
    {title:'Publish your shop', text:'Give your shop a business name and a unique link, then save it.', done:published === true, href:'/dashboard/store'},
    {title:'Explain what you sell', text:'Use a clear business description with the products or services customers ask for.', done:Boolean(profile.description.trim()), href:'/dashboard/store'},
    {title:'Add your location', text:'Tell customers your town, area and where to find you.', done:Boolean(profile.location.trim()), href:'/dashboard/store'},
    {title:'Add directions', text:'A Google Maps link helps customers reach your business.', done:/^https?:\/\//.test(profile.mapsLink), href:'/dashboard/store'},
    {title:'Describe delivery and pickup', text:'List actual delivery areas, fees and pickup arrangements.', done:Boolean(profile.deliveryInfo.trim()), href:'/dashboard/store'},
    {title:'Answer common questions', text:'Add clear answers about buying from your business.', done:profile.faqs.length>0, href:'/dashboard/store'},
    {title:'Set your opening hours', text:'Confirm every day, including closed days, and your timezone.', done:profile.openingHours.length===7, href:'/dashboard/store'},
    {title:'Publish products with useful details', text:'Each product needs a name, photo and description. Keep prices and stock current.', done:products.length > 0 && products.every(p => p.name.trim() && p.description.trim() && (p.image || p.images?.length)), href:'/dashboard/products'},
    {title:'Connect a social profile', text:'Use consistent business details across your shop and social profiles.', done:Boolean(profile.instagram.trim() || profile.tiktok.trim()), href:'/dashboard/store'},
  ]
  const complete = checks.filter(check => check.done).length
  const title = profile.businessName ? profile.businessName + (profile.location ? ' in ' + profile.location : '') + ' | Gulako' : 'Your business name | Gulako'
  return <DashboardShell title="Get discovered" subtitle="Help customers understand your business and find your products.">
    <section className="discovery-intro dash-card premium-card">
      <div><span className="section-kicker">Search & AI visibility</span><h2>Make your shop easy to find.</h2><p>Clear business details help search engines and AI search understand what you sell, where you are and how to buy from you.</p></div>
      <span className="health-status-pill">{complete} of {checks.length} steps complete</span>
    </section>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="discovery-layout">
      <section className="dash-card premium-card"><h2>Your discovery checklist</h2><p className="muted">This checks your shop information. It is not a Google ranking or AI recommendation score.</p>
        <div className="discovery-checks">{checks.map(check => <a href={check.href} className="discovery-check" key={check.title}>
          <span className={check.done ? 'discovery-check-icon done' : 'discovery-check-icon'}>{check.done ? <Check size={19}/> : <Circle size={19}/>}</span>
          <div><strong>{check.title}</strong><p>{check.text}</p><small>{check.done ? 'Complete' : 'Needs attention'}</small></div><ArrowUpRight size={18}/>
        </a>)}</div>
      </section>
      <aside className="discovery-aside">
        <section className="dash-card premium-card"><span className="section-kicker"><Search size={14}/> Search preview</span><div className="search-preview"><small>gulako.site/{profile.slug || 'yourshop'}</small><h3>{title}</h3><p>{profile.description || 'Add a helpful description of your business to introduce your shop.'}</p></div><p className="muted">An illustrative preview. Search services may choose a different title or description.</p>{published && <a className="soft-button" href={'/' + profile.slug} target="_blank" rel="noreferrer">Open your shop <ArrowUpRight size={16}/></a>}</section>
        <section className="dash-card premium-card"><h2>Built into your shop</h2><p>Published shops and active products have their own search metadata, share previews, structured data and sitemap entries.</p><p>Updates appear when search services next crawl your pages. Inclusion and rankings are not guaranteed.</p></section>
        <section className="dash-card premium-card"><h2>Build trust beyond Gulako</h2><p>Share your shop link on your social profiles. If your business is eligible, use the same link and business details on Google Business Profile.</p><a href="https://www.google.com/business/" target="_blank" rel="noreferrer" className="soft-button">Google Business Profile <ArrowUpRight size={16}/></a></section>
      </aside>
    </div>
  </DashboardShell>
}
