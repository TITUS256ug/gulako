import { SITE, publicRows, escapeHtml } from '../server/discovery.js'
const SIZE = 500
export default async function handler(req, res) {
  if (!['GET','HEAD'].includes(req.method)) return res.status(405).end()
  res.setHeader('Content-Type','application/xml; charset=utf-8')
  res.setHeader('Cache-Control','public, max-age=0, s-maxage=300')
  try {
    const type = req.query?.type
    const filters = {
      shops: {select:'slug,updated_at',published:'eq.true',order:'id.asc'},
      products: {select:'id,updated_at,shops!inner(published)',active:'eq.true','shops.published':'eq.true',order:'id.asc'},
    }
    let xml
    if (type === undefined) {
      const counts = await Promise.all(Object.keys(filters).map(table => publicRows(table, filters[table], {count:true})))
      const links = [SITE + '/sitemap.xml?type=pages']
      Object.keys(filters).forEach((table,i) => { for(let page=0;page<Math.ceil(counts[i]/SIZE);page++) links.push(`${SITE}/sitemap.xml?type=${table}&page=${page}`) })
      xml = '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + links.map(url => `<sitemap><loc>${escapeHtml(url)}</loc></sitemap>`).join('') + '</sitemapindex>'
    } else {
      let rows
      if (type === 'pages') rows = ['/', '/terms', '/privacy'].map(path => ({url:SITE + path}))
      else if (Object.hasOwn(filters, type) && /^\d{1,6}$/.test(String(req.query.page ?? '0'))) {
        const data = await publicRows(type, {...filters[type], limit:SIZE, offset:Number(req.query.page || 0)*SIZE})
        rows = data.map(row => ({url:SITE + (type === 'shops' ? '/' + encodeURIComponent(row.slug) : '/product/' + row.id), updated:row.updated_at}))
      } else return res.status(400).end()
      xml = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + rows.map(row => `<url><loc>${escapeHtml(row.url)}</loc>${row.updated && Number.isFinite(Date.parse(row.updated)) ? `<lastmod>${new Date(row.updated).toISOString()}</lastmod>` : ''}</url>`).join('') + '</urlset>'
    }
    return res.status(200).send(req.method === 'HEAD' ? '' : '<?xml version="1.0" encoding="UTF-8"?>' + xml)
  } catch {
    res.setHeader('Cache-Control','no-store')
    res.setHeader('Retry-After','60')
    return res.status(503).end()
  }
}
