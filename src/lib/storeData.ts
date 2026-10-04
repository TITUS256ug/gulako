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

export const emptyStoreProfile: StoreProfile = {
  businessName: '',
  slug: 'my-shop',
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
    const parsed = JSON.parse(window.localStorage.getItem(key) || '')
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

export function slugifyStoreName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'my-shop'
}

export function getStoreProfile(): StoreProfile {
  return { ...emptyStoreProfile, ...safeParse<Partial<StoreProfile>>(PROFILE_KEY, {}) }
}

export function saveStoreProfile(profile: StoreProfile) {
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

export function deleteSellerProduct(id: string) {
  saveSellerProducts(getSellerProducts().filter(product => product.id !== id))
}

export const accentColors: Record<AccentName, string> = {
  violet: '#7c3aed',
  indigo: '#4f46e5',
  rose: '#e11d48',
  amber: '#d97706',
  teal: '#0d9488',
}
