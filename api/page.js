import { readFile } from 'node:fs/promises'
import { renderShop, renderProduct, renderStatic, rowToProfile, rowToProduct } from '../.generated/render.js'
import { SITE, SHOP_FIELDS, PRODUCT_FIELDS, publicRows, allShopProducts, businessSchema, productSchema, cleanText, safeUrl, renderDocument } from '../server/discovery.js'

let template
const PRIVATE = new Set(['signin','login','signup','register','dashboard','cart','checkout','order','pricing','explore','demo','founder','onboarding','auth','admin','settings','shop'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).end()
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Do not serve stale public data after a seller unpublishes a shop/product.
  res.setHeader('Cache-Control', 'private, no-store')
  try {
    template ||= await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
    const rawPath = typeof req.query?.path === 'string' ? req.query.path : new URL(req.url, SITE).pathname
    const path = '/' + rawPath.replace(/^\/+|\/+$/g, '')
    const parts = path.split('/').filter(Boolean)
    let meta = {title:'Gulako — Take your shop online. Sell faster.', description:'Storefront, orders, and customers in one place.', url:SITE + path}
    let body = '', payload, status = 200
    if (path === '/' || path === '/terms' || path === '/privacy') {
      body = renderStatic(path)
      if (path !== '/') meta = {...meta, title:(path === '/terms' ? 'Terms of service' : 'Privacy policy') + ' | Gulako'}
      else meta.schema = {'@context':'https://schema.org','@type':'WebSite', name:'Gulako', url:SITE + '/'}
    } else if (PRIVATE.has(parts[0])) {
      meta.noindex = true
    } else if ((parts.length === 1 && /^[a-z0-9]{3,40}$/.test(parts[0])) || (parts.length === 2 && parts[0] === 'product' && UUID.test(parts[1]))) {
      const kind = parts[0] === 'product' ? 'product' : 'shop'
      const key = kind === 'product' ? parts[1] : parts[0]
      let shop, product, data = null
      if (kind === 'shop') [shop] = await publicRows('shops', {select:SHOP_FIELDS, slug:'eq.' + key, published:'eq.true', limit:1})
      else {
        [product] = await publicRows('products', {select:PRODUCT_FIELDS, id:'eq.' + key, active:'eq.true', limit:1})
        if (product) [shop] = await publicRows('shops', {select:SHOP_FIELDS, id:'eq.' + product.shop_id, published:'eq.true', limit:1})
      }
      if (shop) {
        const profile = rowToProfile(shop)
        const logo = safeUrl(shop.logo_url) || ''
        if (kind === 'shop') {
          const products = await allShopProducts(shop.id)
          data = {profile, logo, views:0, products:products.map(p => rowToProduct(p, profile.businessName, profile.slug))}
          meta = {...meta, title:shop.business_name + (shop.location ? ' in ' + cleanText(shop.location) : '') + ' | Gulako', description:(cleanText(shop.description) || `Browse ${shop.category || 'products'} from ${shop.business_name}. Order directly from the seller.`).slice(0,180), image:safeUrl(shop.cover_url) || logo || undefined, schema:businessSchema(shop)}
        } else {
          data = {profile, logo, product:rowToProduct(product, profile.businessName, profile.slug)}
          meta = {...meta, title:product.name + ' | ' + shop.business_name, description:(cleanText(product.description) || `${product.name} from ${shop.business_name}. ${product.currency || 'UGX'} ${product.price}.`).slice(0,180), image:safeUrl(product.product_images?.[0]) || safeUrl(product.image_url), schema:[businessSchema(shop), productSchema(product,shop)]}
        }
      } else {
        status = 404
        meta = {...meta, title:'Unavailable | Gulako', description:'This shop or product is not currently available.', noindex:true}
      }
      payload = {kind, key, data}
      body = kind === 'shop' ? renderShop(key, data) : renderProduct(key, data)
    } else {
      status = 404
      meta = {...meta, title:'Page not found | Gulako', description:'This page is not available.', noindex:true}
      body = '<main><h1>Page not found</h1><p><a href="/">Back to Gulako</a></p></main>'
    }
    if (meta.noindex) res.setHeader('X-Robots-Tag', 'noindex, follow')
    return res.status(status).send(req.method === 'HEAD' ? '' : renderDocument(template, meta, body, payload))
  } catch {
    res.setHeader('X-Robots-Tag', 'noindex')
    res.setHeader('Retry-After', '60')
    return res.status(503).send('<!doctype html><html lang="en"><title>Temporarily unavailable | Gulako</title><h1>We could not load this page</h1><p>Please try again shortly.</p></html>')
  }
}
