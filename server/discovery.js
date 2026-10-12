export const SITE = 'https://gulako.site'
export const SHOP_FIELDS = 'id,business_name,slug,category,location,description,whatsapp,maps_link,tiktok,instagram,delivery_info,accent,accent_color,logo_url,cover_url,published,faqs,opening_hours,timezone'
export const PRODUCT_FIELDS = 'id,shop_id,name,category,price,currency,image_url,product_images,description,stock,negotiable,active'
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))
export const safeJson = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
export const cleanText = value => String(value || '').replace(/\s+/g, ' ').trim()
export const safeUrl = value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined } catch { return undefined }
}

// Always query as an anonymous visitor. Never bypass RLS with a service role.
export async function publicRows(table, params, options = {}) {
  const origin = process.env.VITE_API_URL
  const key = process.env.VITE_PUBLIC_TOKEN
  if (!origin || !key) throw new Error('Public storefront connection is not configured')
  const url = new URL('/rest/v1/' + table, origin)
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, String(value))
  const response = await fetch(url, {
    method: options.count ? 'HEAD' : 'GET',
    headers: { apikey: key, Authorization: 'Bearer ' + key, ...(options.count ? { Prefer: 'count=exact' } : {}) },
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error('Public storefront query failed')
  if (options.count) {
    const count = Number(response.headers.get('content-range')?.split('/')[1])
    if (!Number.isFinite(count)) throw new Error('Missing sitemap count')
    return count
  }
  return response.json()
}

export async function allShopProducts(shopId) {
  const result = []
  for (let offset = 0; ; offset += 500) {
    const rows = await publicRows('products', {select: PRODUCT_FIELDS, shop_id:'eq.' + shopId, active:'eq.true', order:'created_at.desc,id.asc', limit:500, offset})
    result.push(...rows)
    if (rows.length < 500) return result
  }
}

export function businessSchema(shop) {
  const url = SITE + '/' + encodeURIComponent(shop.slug)
  const sameAs = []
  for (const [network, raw] of [['instagram', shop.instagram], ['tiktok', shop.tiktok]]) {
    const handle = cleanText(raw).replace(/^@/, '')
    if (/^[\w.]+$/.test(handle)) sameAs.push('https://www.' + network + '.com/' + (network === 'tiktok' ? '@' : '') + handle)
  }
  return {
    '@context':'https://schema.org', '@type': shop.location ? 'LocalBusiness' : 'OnlineStore',
    '@id':url + '#business', name:shop.business_name, url,
    description:cleanText(shop.description) || undefined,
    openingHoursSpecification:(shop.opening_hours||[]).map(h=>({'@type':'OpeningHoursSpecification',dayOfWeek:'https://schema.org/'+h.day,opens:h.status==='closed'?'00:00':h.opens,closes:h.status==='closed'?'00:00':h.closes})),
    address:cleanText(shop.location) || undefined,
    telephone:/^\+?[\d\s()-]{7,}$/.test(shop.whatsapp || '') ? shop.whatsapp : undefined,
    image:safeUrl(shop.cover_url) || safeUrl(shop.logo_url), logo:safeUrl(shop.logo_url),
    hasMap:safeUrl(shop.maps_link), sameAs:sameAs.length ? sameAs : undefined,
  }
}

export function productSchema(product, shop) {
  const price = Number(product.price)
  const images = (Array.isArray(product.product_images) && product.product_images.length ? product.product_images : [product.image_url]).map(safeUrl).filter(Boolean)
  return {
    '@context':'https://schema.org', '@type':'Product', '@id':SITE + '/product/' + product.id + '#product',
    name:product.name, description:cleanText(product.description) || undefined,
    image:images.length ? images : undefined, category:product.category || undefined,
    offers:Number.isFinite(price) && price >= 0 ? {
      '@type':'Offer', url:SITE + '/product/' + product.id, price,
      priceCurrency:product.currency || 'UGX',
      availability:Number(product.stock) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller:{'@type':'Organization', '@id':SITE + '/' + encodeURIComponent(shop.slug) + '#business', name:shop.business_name},
    } : undefined,
  }
}

export function pageHead({title, description, url, image, schema, noindex = false}) {
  return `<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large'}">
<link rel="canonical" href="${escapeHtml(url)}">
<meta property="og:site_name" content="Gulako">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}"><meta name="twitter:image" content="${escapeHtml(image)}">` : ''}
${schema ? `<script type="application/ld+json">${safeJson(schema)}</script>` : ''}`
}

export function renderDocument(template, meta, body = '', payload) {
  return template.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b(?=[^>]*(?:name="(?:description|robots|twitter:[^"]+)"|property="og:[^"]+"))[^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*rel="canonical")[^>]*>/gi, '')
    .replace('</head>', () => pageHead(meta) + '</head>')
    .replace('<div id="root"></div>', () => `<div id="root">${body}</div>${payload ? `<script id="gulako-public-data" type="application/json">${safeJson(payload)}</script>` : ''}`)
}
