import type { Product } from '../data/mock'

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
const CLAIMED_SLUGS_KEY = 'gulako_claimed_slugs'
const ANALYTICS_KEY = 'gulako_store_analytics'
const ANALYTICS_SESSION_KEY = 'gulako_viewed_shop_'

export const BUSINESS_CATEGORIES = [
  'Fashion & clothing',
  'Beauty & personal care',
  'Food & beverages',
  'Electronics & gadgets',
  'Home & living',
  'Health & wellness',
  'Baby & kids',
  'Sports & fitness',
  'Automotive',
  'Agriculture',
  'Books & stationery',
  'Jewellery & accessories',
  'Phones & accessories',
  'Shoes & bags',
  'Furniture',
  'Services',
  'Other',
]

const RESERVED_SLUGS = new Set([
  '',
  'login',
  'signin',
  'signup',
  'register',
  'dashboard',
  'cart',
  'checkout',
  'order',
  'product',
  'pricing',
  'explore',
  'api',
  'admin',
  'settings',
  'shop',
])

export const emptyStoreProfile: StoreProfile = {
  businessName: '',
  slug: 'myshop',
  category: '',
  location: '',
  description: '',
  whatsapp: '',
  mapsLink: '',
  tiktok: '',
  instagram: '',
  deliveryInfo: '',
  accent: 'violet',
  cover: '',
}

function safeParse<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function slugifyStoreName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40) || 'myshop'
}

export function validateStoreSlug(value: string, currentSlug?: string) {
  const slug = slugifyStoreName(value)
  if (slug.length < 3) return { valid: false, slug, message: 'Use at least 3 letters or numbers.' }
  if (RESERVED_SLUGS.has(slug)) return { valid: false, slug, message: 'This shop link is reserved. Try another one.' }

  const claimed = safeParse<string[]>(CLAIMED_SLUGS_KEY, [])
  const duplicate = claimed.some(item => item === slug && item !== currentSlug)
  if (duplicate) return { valid: false, slug, message: 'This shop link is already in use.' }

  return { valid: true, slug, message: 'Shop link available.' }
}

function claimStoreSlug(slug: string, previousSlug?: string) {
  const claimed = new Set(safeParse<string[]>(CLAIMED_SLUGS_KEY, []))
  if (previousSlug && previousSlug !== slug) claimed.delete(previousSlug)
  claimed.add(slug)
  window.localStorage.setItem(CLAIMED_SLUGS_KEY, JSON.stringify(Array.from(claimed)))
}

export function getStoreProfile(): StoreProfile {
  return { ...emptyStoreProfile, ...safeParse<Partial<StoreProfile>>(PROFILE_KEY, {}) }
}

export function saveStoreProfile(profile: StoreProfile) {
  const previous = getStoreProfile()
  claimStoreSlug(profile.slug, previous.slug)
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  window.dispatchEvent(new Event('gulako-store'))
}

export function getSellerProducts(): Product[] {
  const value = safeParse<Product[]>(PRODUCTS_KEY, [])
  return Array.isArray(value) ? value : []
}

export function saveSellerProducts(products: Product[]) {
  window.localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  window.dispatchEvent(new Event('gulako-products'))
  window.dispatchEvent(new Event('gulako-store'))
}

export function addSellerProduct(product: Omit<Product, 'id'>) {
  const products = getSellerProducts()
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `product-${Date.now()}`
  const next = [{ ...product, id }, ...products]
  saveSellerProducts(next)
  return id
}

export function duplicateSellerProduct(id: string) {
  const products = getSellerProducts()
  const source = products.find(product => product.id === id)
  if (!source) return null
  const copyId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `product-${Date.now()}`
  const copy: Product = {
    ...source,
    id: copyId,
    name: `${source.name} copy`,
  }
  saveSellerProducts([copy, ...products])
  return copyId
}

export function deleteSellerProduct(id: string) {
  saveSellerProducts(getSellerProducts().filter(product => product.id !== id))
}

export function getStoreViews() {
  const data = safeParse<{ views?: number }>(ANALYTICS_KEY, {})
  return Math.max(40, Number(data.views ?? 40))
}

export function recordStoreView(slug: string) {
  if (typeof window === 'undefined') return 40
  const sessionKey = ANALYTICS_SESSION_KEY + slug
  const current = getStoreViews()
  if (window.sessionStorage.getItem(sessionKey)) return current
  const next = current + 1
  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify({ views: next }))
  window.sessionStorage.setItem(sessionKey, '1')
  window.dispatchEvent(new Event('gulako-analytics'))
  return next
}

export const accentColors: Record<AccentName, string> = {
  violet: '#7c3aed',
  indigo: '#4f46e5',
  rose: '#e11d48',
  amber: '#d97706',
  teal: '#0d9488',
}
