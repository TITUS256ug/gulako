import type { Product } from '../data/mock'
import { backend } from './backend'
import { getShopLogo } from './shopBrand'

export type AccentName = 'violet' | 'indigo' | 'rose' | 'amber' | 'teal'

export type StoreProfile = {
  businessName: string
  slug: string
  category: string
  location: string
  description: string
  whatsapp: string
  mapsLink: string
  tiktok: string
  instagram: string
  deliveryInfo: string
  accent: AccentName
  cover: string
}

const PROFILE_KEY = 'gulako_store_profile'
const PRODUCTS_KEY = 'gulako_seller_products'
const ANALYTICS_KEY = 'gulako_store_analytics'
const ANALYTICS_SESSION_KEY = 'gulako_viewed_shop_'
const LOGO_KEY = 'gulako_shop_logo'

export const BUSINESS_CATEGORIES = [
  'Fashion & clothing','Beauty & personal care','Food & beverages','Electronics & gadgets',
  'Home & living','Health & wellness','Baby & kids','Sports & fitness','Automotive',
  'Agriculture','Books & stationery','Jewellery & accessories','Phones & accessories',
  'Shoes & bags','Furniture','Services','Other',
]

const RESERVED_SLUGS = new Set([
  '','login','signin','signup','register','dashboard','cart','checkout','order','product',
  'pricing','explore','api','admin','settings','shop','demo','founder',
])

export const emptyStoreProfile: StoreProfile = {
  businessName:'', slug:'myshop', category:'', location:'', description:'', whatsapp:'',
  mapsLink:'', tiktok:'', instagram:'', deliveryInfo:'', accent:'violet', cover:'',
}

function safeParse<T>(key:string,fallback:T):T{
  if(typeof window==='undefined')return fallback
  try{
    const raw=window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  }catch{return fallback}
}

function cacheProfile(profile:StoreProfile){
  window.localStorage.setItem(PROFILE_KEY,JSON.stringify(profile))
  window.dispatchEvent(new Event('gulako-store'))
}

function cacheProducts(products:Product[]){
  window.localStorage.setItem(PRODUCTS_KEY,JSON.stringify(products))
  window.dispatchEvent(new Event('gulako-products'))
  window.dispatchEvent(new Event('gulako-store'))
}

export function slugifyStoreName(value:string){
  return value.toLowerCase().trim().replace(/[^a-z0-9]/g,'').slice(0,40)||'myshop'
}

export function validateStoreSlug(value:string,currentSlug?:string){
  const slug=slugifyStoreName(value)
  if(slug.length<3)return{valid:false,slug,message:'Use at least 3 letters or numbers.'}
  if(RESERVED_SLUGS.has(slug))return{valid:false,slug,message:'This shop link is reserved. Try another one.'}
  if(currentSlug===slug)return{valid:true,slug,message:'Shop link available.'}
  return{valid:true,slug,message:'Shop link format is valid.'}
}

export async function checkStoreSlugAvailability(value:string,currentSlug?:string){
  const basic=validateStoreSlug(value,currentSlug)
  if(!basic.valid||basic.slug===currentSlug)return basic
  const {data:{user}}=await backend.auth.getUser()
  let query=backend.from('shops').select('id').eq('slug',basic.slug).limit(1)
  if(user)query=query.neq('owner_id',user.id)
  const {data,error}=await query
  if(error)return{valid:false,slug:basic.slug,message:'Could not verify this link right now.'}
  if(data&&data.length)return{valid:false,slug:basic.slug,message:'This shop link is already in use.'}
  return{valid:true,slug:basic.slug,message:'Shop link available.'}
}

export function getStoreProfile():StoreProfile{
  return{...emptyStoreProfile,...safeParse<Partial<StoreProfile>>(PROFILE_KEY,{})}
}

export function getSellerProducts():Product[]{
  const value=safeParse<Product[]>(PRODUCTS_KEY,[])
  return Array.isArray(value)?value:[]
}

export function getStoreViews(){
  const data=safeParse<{views?:number}>(ANALYTICS_KEY,{})
  return Math.max(40,Number(data.views??40))
}

function rowToProfile(row:any):StoreProfile{
  return{
    businessName:row.business_name??'',
    slug:row.slug??'myshop',
    category:row.category??'',
    location:row.location??'',
    description:row.description??'',
    whatsapp:row.whatsapp??'',
    mapsLink:row.maps_link??'',
    tiktok:row.tiktok??'',
    instagram:row.instagram??'',
    deliveryInfo:row.delivery_info??'',
    accent:(row.accent??'violet') as AccentName,
    cover:row.cover_url??'',
  }
}

function rowToProduct(row:any,shopName:string,shopSlug:string):Product{
  return{
    id:row.id,
    shopSlug,
    shopName,
    name:row.name,
    category:row.category,
    price:Number(row.price),
    currency:row.currency??'UGX',
    image:row.image_url??'',
    description:row.description??'',
    stock:Number(row.stock??0),
    negotiable:Boolean(row.negotiable),
  }
}

export async function hydrateSellerData(){
  const {data:{user}}=await backend.auth.getUser()
  if(!user)return
  const {data:shop}=await backend.from('shops').select('*').eq('owner_id',user.id).maybeSingle()
  if(!shop)return
  const profile=rowToProfile(shop)
  cacheProfile(profile)
  window.localStorage.setItem(ANALYTICS_KEY,JSON.stringify({views:Number(shop.views??40)}))
  if(shop.logo_url){
    window.localStorage.setItem(LOGO_KEY,shop.logo_url)
    window.dispatchEvent(new Event('gulako-brand'))
  }
  const {data:rows}=await backend.from('products').select('*').eq('shop_id',shop.id).eq('owner_id',user.id).order('created_at',{ascending:false})
  cacheProducts((rows??[]).map((row:any)=>rowToProduct(row,profile.businessName,profile.slug)))
  window.dispatchEvent(new Event('gulako-analytics'))
}

export async function saveStoreProfile(profile:StoreProfile){
  cacheProfile(profile)
  const {data:{user}}=await backend.auth.getUser()
  if(!user)return
  const row={
    owner_id:user.id,
    business_name:profile.businessName,
    slug:profile.slug,
    category:profile.category,
    location:profile.location,
    description:profile.description,
    whatsapp:profile.whatsapp,
    maps_link:profile.mapsLink,
    tiktok:profile.tiktok,
    instagram:profile.instagram,
    delivery_info:profile.deliveryInfo,
    accent:profile.accent,
    logo_url:getShopLogo(),
    cover_url:profile.cover,
    published:Boolean(profile.businessName&&profile.slug),
    updated_at:new Date().toISOString(),
  }
  const {error}=await backend.from('shops').upsert(row,{onConflict:'owner_id'})
  if(error){
    window.dispatchEvent(new CustomEvent('gulako-store-error',{detail:error.message}))
    throw error
  }
  await hydrateSellerData()
}

export function saveSellerProducts(products:Product[]){
  cacheProducts(products)
}

async function getRemoteShopId(){
  const {data:{user}}=await backend.auth.getUser()
  if(!user)return null
  const {data}=await backend.from('shops').select('id').eq('owner_id',user.id).maybeSingle()
  return data?.id??null
}

export function addSellerProduct(product:Omit<Product,'id'>){
  const products=getSellerProducts()
  const id=crypto.randomUUID()
  const next=[{...product,id},...products]
  cacheProducts(next)
  void (async()=>{
    const {data:{user}}=await backend.auth.getUser()
    const shopId=await getRemoteShopId()
    if(!user||!shopId)return
    const {error}=await backend.from('products').insert({
      id,shop_id:shopId,owner_id:user.id,name:product.name,category:product.category,
      price:product.price,currency:product.currency,image_url:product.image,
      description:product.description,stock:product.stock,negotiable:Boolean(product.negotiable),active:true,
    })
    if(error)window.dispatchEvent(new CustomEvent('gulako-products-error',{detail:error.message}))
  })()
  return id
}

export function updateSellerProduct(id:string,updates:Partial<Omit<Product,'id'>>){
  cacheProducts(getSellerProducts().map(product=>product.id===id?{...product,...updates,id}:product))
  void backend.from('products').update({
    name:updates.name,category:updates.category,price:updates.price,currency:updates.currency,
    image_url:updates.image,description:updates.description,stock:updates.stock,
    negotiable:updates.negotiable,updated_at:new Date().toISOString(),
  }).eq('id',id)
}

export function duplicateSellerProduct(id:string){
  const source=getSellerProducts().find(product=>product.id===id)
  if(!source)return null
  const copyId=crypto.randomUUID()
  const copy:Product={...source,id:copyId,name:`${source.name} copy`}
  cacheProducts([copy,...getSellerProducts()])
  void (async()=>{
    const {data:{user}}=await backend.auth.getUser()
    const shopId=await getRemoteShopId()
    if(!user||!shopId)return
    await backend.from('products').insert({
      id:copyId,shop_id:shopId,owner_id:user.id,name:copy.name,category:copy.category,
      price:copy.price,currency:copy.currency,image_url:copy.image,description:copy.description,
      stock:copy.stock,negotiable:Boolean(copy.negotiable),active:true,
    })
  })()
  return copyId
}

export function deleteSellerProduct(id:string){
  cacheProducts(getSellerProducts().filter(product=>product.id!==id))
  void backend.from('products').delete().eq('id',id)
}

export async function uploadSellerAsset(file:File,kind:'logo'|'cover'|'product'){
  const {data:{user}}=await backend.auth.getUser()
  if(!user)throw new Error('Please sign in first.')
  const extension=(file.name.split('.').pop()||'jpg').toLowerCase()
  const path=`${user.id}/${kind}-${Date.now()}.${extension}`
  const {error}=await backend.storage.from('shop-assets').upload(path,file,{upsert:false,contentType:file.type})
  if(error)throw error
  const {data}=backend.storage.from('shop-assets').getPublicUrl(path)
  return data.publicUrl
}

export async function recordStoreView(slug:string){
  if(typeof window==='undefined')return 40
  const sessionKey=ANALYTICS_SESSION_KEY+slug
  if(window.sessionStorage.getItem(sessionKey))return getStoreViews()
  window.sessionStorage.setItem(sessionKey,'1')
  const {data}=await backend.rpc('increment_store_view',{shop_slug:slug})
  const next=Math.max(40,Number(data??40))
  window.localStorage.setItem(ANALYTICS_KEY,JSON.stringify({views:next}))
  window.dispatchEvent(new Event('gulako-analytics'))
  return next
}

export async function fetchPublicShop(slug:string){
  const {data:shop,error}=await backend.from('shops').select('*').eq('slug',slug).eq('published',true).maybeSingle()
  if(error||!shop)return null
  const {data:rows}=await backend.from('products').select('*').eq('shop_id',shop.id).eq('active',true).order('created_at',{ascending:false})
  const profile=rowToProfile(shop)
  return{
    profile,
    logo:shop.logo_url??'',
    views:Number(shop.views??40),
    products:(rows??[]).map((row:any)=>rowToProduct(row,profile.businessName,profile.slug)),
  }
}

export async function fetchPublicProduct(id:string){
  const {data:row,error}=await backend.from('products').select('*, shops!inner(*)').eq('id',id).eq('active',true).maybeSingle()
  if(error||!row)return null
  const shop=(row as any).shops
  if(!shop?.published)return null
  const profile=rowToProfile(shop)
  return{product:rowToProduct(row,profile.businessName,profile.slug),profile,logo:shop.logo_url??''}
}

export const accentColors:Record<AccentName,string>={
  violet:'#7c3aed',indigo:'#4f46e5',rose:'#e11d48',amber:'#d97706',teal:'#0d9488',
}
