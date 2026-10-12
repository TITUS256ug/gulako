import test from 'node:test'
import assert from 'node:assert/strict'
import page from '../api/page.js'
import sitemap from '../api/sitemap.js'
import { productSchema, businessSchema, safeJson, renderDocument } from '../server/discovery.js'

process.env.VITE_API_URL = 'https://test.supabase.co'
process.env.VITE_PUBLIC_TOKEN = 'public-test-token'
const shop = {id:'shop1',slug:'sample',business_name:'Sample & Co',location:'Kampala',description:'Clothes made in Uganda',category:'Fashion',published:true,whatsapp:'+256700000000',delivery_info:'Pickup in Kampala. Delivery to Entebbe.',logo_url:'https://example.com/logo.png'}
const product = {id:'11111111-1111-4111-8111-111111111111',shop_id:'shop1',name:'Linen shirt',category:'Clothing',description:'A light linen shirt.',price:35000,currency:'UGX',stock:4,active:true,image_url:'https://example.com/shirt.jpg'}
function response() {
  return {headers:{},code:200,body:'',setHeader(k,v){this.headers[k]=v},status(code){this.code=code;return this},send(value){this.body=value;return this},end(){return this}}
}
function mockDatabase({published = true, active = true, failure = false, many = false} = {}) {
  const calls = []
  globalThis.fetch = async (input, options) => {
    const url = new URL(input); calls.push(url)
    assert.equal(options.headers.apikey, 'public-test-token')
    if (failure) return new Response('',{status:503})
    if (options.method === 'HEAD') return new Response(null,{headers:{'content-range':'0-0/' + (many ? 1201 : 1)}})
    if (url.pathname.endsWith('/shops')) {
      assert.equal(url.searchParams.get('published'), 'eq.true')
      return Response.json(published ? [shop] : [])
    }
    assert.equal(url.searchParams.get('active'), 'eq.true')
    return Response.json(active ? [product] : [])
  }
  return calls
}
test('shop response contains real content, unique metadata and public data without JavaScript', async () => {
  mockDatabase()
  const res = response()
  await page({method:'GET',url:'/sample',query:{path:'sample'}},res)
  assert.equal(res.code,200)
  assert.match(res.body, /Sample &amp; Co in Kampala \| Gulako/)
  assert.match(res.body, /rel="canonical" href="https:\/\/gulako.site\/sample"/)
  assert.match(res.body, /Linen shirt/)
  assert.match(res.body, /Pickup in Kampala/)
  assert.match(res.body, /application\/ld\+json/)
  assert.doesNotMatch(res.body, /owner_id|public-test-token/)
  assert.equal((res.body.match(/rel="canonical"/g) || []).length,1)
})
test('product response matches visible price and includes stock and seller data', async () => {
  mockDatabase()
  const res = response()
  await page({method:'GET',query:{path:'product/' + product.id}},res)
  assert.equal(res.code,200)
  assert.match(res.body, /35,000/)
  assert.match(res.body, /"price":35000/)
  assert.match(res.body, /https:\/\/schema.org\/InStock/)
  assert.match(res.body, /<h1>Linen shirt<\/h1>/)
})
test('unpublished shop and inactive product return 404 and cannot leak into HTML', async () => {
  for (const settings of [{published:false},{active:false}]) {
    mockDatabase(settings)
    const res = response()
    await page({method:'GET',query:{path:'product/' + product.id}},res)
    assert.equal(res.code,404)
    assert.equal(res.headers['X-Robots-Tag'],'noindex, follow')
    assert.doesNotMatch(res.body,/Linen shirt|Sample &amp; Co/)
  }
})
test('temporary database errors return 503 rather than a false not-found page', async () => {
  mockDatabase({failure:true})
  const res = response()
  await page({method:'GET',query:{path:'sample'}},res)
  assert.equal(res.code,503)
  assert.equal(res.headers['Retry-After'],'60')
})
test('private routes have noindex without database calls', async () => {
  globalThis.fetch = () => { throw new Error('Unexpected database query') }
  for (const path of ['dashboard/discovery','checkout','order/private-token','signin','demo']) {
    const res = response()
    await page({method:'GET',query:{path}},res)
    assert.equal(res.code,200)
    assert.match(res.body,/noindex,follow/)
    assert.doesNotMatch(res.body,/application\/ld\+json/)
  }
})
test('static homepage is rendered and has a single canonical', async () => {
  const res = response()
  await page({method:'GET',url:'/',query:{}},res)
  assert.equal(res.code,200)
  assert.match(res.body,/Take your shop online/)
  assert.equal((res.body.match(/rel="canonical"/g) || []).length,1)
})
test('sitemap index paginates beyond database limits and escapes query separators', async () => {
  mockDatabase({many:true})
  const res = response()
  await sitemap({method:'GET',query:{}},res)
  assert.equal(res.code,200)
  assert.match(res.body,/type=shops&amp;page=2/)
  assert.match(res.body,/type=products&amp;page=2/)
  assert.doesNotMatch(res.body,/dashboard|checkout/)
})
test('product sitemap filters unpublished parent shops and uses correct page offset', async () => {
  const calls = mockDatabase()
  const res = response()
  await sitemap({method:'GET',query:{type:'products',page:'2'}},res)
  assert.equal(res.code,200)
  assert.equal(calls[0].searchParams.get('shops.published'),'eq.true')
  assert.equal(calls[0].searchParams.get('offset'),'1000')
  assert.match(res.body,new RegExp('/product/' + product.id))
})
test('invalid sitemap inputs and database failures do not return successful empty sitemaps', async () => {
  const invalid = response()
  await sitemap({method:'GET',query:{type:'private'}},invalid)
  assert.equal(invalid.code,400)
  mockDatabase({failure:true})
  const unavailable = response()
  await sitemap({method:'GET',query:{}},unavailable)
  assert.equal(unavailable.code,503)
})
test('seller text cannot break out of scripts, attributes or replacement strings', () => {
  const attack = '</script><script>alert(1)</script>" $&'
  assert.ok(!safeJson({name:attack}).includes('</script>'))
  const html = renderDocument('<html><head></head><body><div id="root"></div></body></html>', {title:attack,description:attack,url:'https://gulako.site/sample',schema:{name:attack}}, '', {name:attack})
  assert.doesNotMatch(html, /<script>alert/)
  assert.match(html, /&lt;\/script&gt;/)
  assert.match(html, /\$&amp;/)
})
test('schema uses only real data, safe links, no invented reviews or stock', () => {
  const business = businessSchema({...shop,maps_link:'javascript:alert(1)'})
  assert.equal(business.hasMap,undefined)
  assert.equal(business.aggregateRating,undefined)
  const item = productSchema({...product,stock:0},shop)
  assert.equal(item.offers.availability,'https://schema.org/OutOfStock')
  assert.equal(item.offers.priceCurrency,'UGX')
})
