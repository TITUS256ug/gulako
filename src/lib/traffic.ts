import { backend } from './backend'
type Visit = {id:string; started:number; touched:number; source:string; campaign:string}
type EventKind='shop_view'|'product_view'|'cart_add'|'checkout_start'|'whatsapp_click'
const TTL=30*60*1000
const seen=new Set<string>()
const pending=new Map<string,Promise<void>>()
export const trafficAllowed=()=>typeof window!=='undefined'&&navigator.doNotTrack!=='1'&&!navigator.webdriver
export function trafficSource(referrer:string,search:string,origin:string) {
  const params=new URLSearchParams(search)
  const campaign=(params.get('utm_campaign')||'').replace(/[^a-zA-Z0-9 _.-]/g,'').slice(0,80)
  const utm=(params.get('utm_source')||'').toLowerCase()
  let host=''
  try{const url=new URL(referrer);if(url.origin!==origin)host=url.hostname.toLowerCase()}catch{/* no referrer */}
  const source=utm||host
  if(/(^|\.)google\.[a-z.]+$/.test(host)||utm==='google')return{source:'google',campaign}
  if(host==='www.bing.com'||host==='bing.com'||utm==='bing')return{source:'bing',campaign}
  if(['chatgpt.com','chat.openai.com'].includes(host)||['chatgpt','openai'].includes(utm))return{source:'chatgpt',campaign}
  if(host==='perplexity.ai'||host.endsWith('.perplexity.ai')||utm==='perplexity')return{source:'perplexity',campaign}
  if(/(^|\.)(facebook\.com|instagram\.com|tiktok\.com|t\.co|whatsapp\.com)$/.test(source)||['facebook','instagram','tiktok','whatsapp','x'].includes(utm))return{source:'social',campaign}
  return{source:utm?'campaign':host?'referral':'direct',campaign}
}
export function getTrafficVisit(slug:string):Visit|null {
  try {
    if(!trafficAllowed()||slug==='demo')return null
    const key='gulako_visit_'+slug
    const existing=JSON.parse(sessionStorage.getItem(key)||'null') as Visit|null
    const now=Date.now()
    if(existing && now-existing.touched<TTL && now-existing.started<24*60*60*1000){existing.touched=now;sessionStorage.setItem(key,JSON.stringify(existing));return existing}
    const visit={id:crypto.randomUUID(),started:now,touched:now,...trafficSource(document.referrer,window.location.search,window.location.origin)}
    sessionStorage.setItem(key,JSON.stringify(visit));return visit
  }catch{return null}
}
export async function trackShopEvent(slug:string,kind:EventKind) {
  if(!trafficAllowed()||!slug||slug==='demo')return
  const visit=getTrafficVisit(slug)
  if(!visit)return
  const dedupe=visit.id+kind+window.location.pathname
  const once=['shop_view','product_view','checkout_start'].includes(kind)
  if(once&&pending.has(dedupe))return pending.get(dedupe)
  if(once&&seen.has(dedupe))return
  const request=(async()=>{
    try{
      const {error}=await backend.rpc('record_gulako_event',{shop_slug:slug,visit_token:visit.id,event_token:crypto.randomUUID(),event_kind:kind,traffic_source:visit.source,campaign_name:visit.campaign}).abortSignal(AbortSignal.timeout(4000))
      if(!error&&once)seen.add(dedupe)
    }catch{/* Tracking failure must not prevent checkout. */}
    finally{if(once)pending.delete(dedupe)}
  })()
  if(once)pending.set(dedupe,request)
  return request
}
export type TrafficReport={sessions:number;productSessions:number;cartSessions:number;checkoutSessions:number;whatsappSessions:number;convertedSessions:number;orders:number;completedRevenue:number;sources:Array<{source:string;sessions:number;orders:number}>;since:string}
export async function fetchTrafficReport():Promise<TrafficReport>{
  const {data,error}=await backend.rpc('gulako_traffic_report',{lookback_days:30})
  if(error)throw new Error('Measured reporting is awaiting backend setup or is temporarily unavailable. No estimated figures are shown.')
  return data as TrafficReport
}
