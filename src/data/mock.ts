export type Product = {
  id: string
  shopSlug: string
  shopName: string
  name: string
  category: string
  price: number
  currency: string
  image: string
  description: string
  badge?: string
  stock: number
  negotiable?: boolean
}

export type Shop = {
  name: string
  slug: string
  initials: string
  location: string
  category: string
  description: string
  whatsapp: string
  mapUrl: string
  image: string
  accent: string
  rating: number
}

/**
 * Real marketplace data will come from Supabase.
 * Keep these empty until live seller/product records are connected.
 */
export const shops: Shop[] = []
export const products: Product[] = []
export const orders: Array<{ id:string; customer:string; total:number; status:string; time:string }> = []
export const customers: Array<{ name:string; orders:number; spent:number; last:string }> = []

export const pricing = [
  {
    name: 'Free',
    price: 'UGX 0',
    note: 'Start selling',
    featured: false,
    features: ['30 active products', 'Unlimited orders', 'WhatsApp ordering', 'Basic location & shop link'],
  },
  {
    name: 'Pro',
    price: 'UGX 20K',
    suffix: '/mo',
    note: 'Grow your shop',
    featured: true,
    features: ['Up to 250 products', 'Unlimited orders', 'Advanced maps', 'Analytics & customization'],
  },
  {
    name: 'Business',
    price: 'UGX 50K',
    suffix: '/mo',
    note: 'Scale with tools',
    featured: false,
    features: ['Unlimited products', 'Unlimited orders', 'Everything in Pro', 'AI business tools'],
  },
]
