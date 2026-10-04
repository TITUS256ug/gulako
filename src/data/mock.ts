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

export const shops: Shop[] = [
  {
    name: 'Nile AI Solutions',
    slug: 'nile-ai-solutions',
    initials: 'N',
    location: 'Ntinda, Kampala',
    category: 'Tech & gadgets',
    description: 'Thoughtfully selected tech essentials for work, life and everything between.',
    whatsapp: '256700000000',
    mapUrl: 'https://maps.google.com/?q=Ntinda,Kampala',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=86',
    accent: 'violet',
    rating: 4.9,
  },
  {
    name: 'Kampala Studio',
    slug: 'kampala-studio',
    initials: 'K',
    location: 'Kololo, Kampala',
    category: 'Fashion',
    description: 'Modern local fashion, everyday pieces and statement essentials.',
    whatsapp: '256700000001',
    mapUrl: 'https://maps.google.com/?q=Kololo,Kampala',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=86',
    accent: 'rose',
    rating: 4.8,
  },
  {
    name: 'Sunday Home',
    slug: 'sunday-home',
    initials: 'S',
    location: 'Bugolobi, Kampala',
    category: 'Home & living',
    description: 'Calm, useful home pieces selected for modern Ugandan spaces.',
    whatsapp: '256700000002',
    mapUrl: 'https://maps.google.com/?q=Bugolobi,Kampala',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=86',
    accent: 'amber',
    rating: 4.7,
  },
]

export const shop = shops[0]

export const products: Product[] = [
  {
    id: 'studio-headphones',
    shopSlug: 'nile-ai-solutions',
    shopName: 'Nile AI Solutions',
    name: 'Studio Wireless Headphones',
    category: 'Audio',
    price: 285000,
    currency: 'UGX',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=86',
    description: 'Rich sound, soft cushions and reliable all-day battery life.',
    badge: 'Popular',
    stock: 12,
  },
  {
    id: 'minimal-watch',
    shopSlug: 'nile-ai-solutions',
    shopName: 'Nile AI Solutions',
    name: 'Minimal Smart Watch',
    category: 'Accessories',
    price: 210000,
    currency: 'UGX',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=86',
    description: 'A simple everyday smartwatch with activity and notification essentials.',
    badge: 'New',
    stock: 8,
  },
  {
    id: 'smart-speaker',
    shopSlug: 'nile-ai-solutions',
    shopName: 'Nile AI Solutions',
    name: 'Compact Smart Speaker',
    category: 'Audio',
    price: 175000,
    currency: 'UGX',
    image: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=1200&q=86',
    description: 'Room-filling audio in a compact design made for modern spaces.',
    stock: 16,
  },
  {
    id: 'wireless-mouse',
    shopSlug: 'nile-ai-solutions',
    shopName: 'Nile AI Solutions',
    name: 'Silent Wireless Mouse',
    category: 'Accessories',
    price: 65000,
    currency: 'UGX',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=86',
    description: 'Comfortable, quiet and designed for focused work anywhere.',
    stock: 24,
  },
  {
    id: 'linen-shirt',
    shopSlug: 'kampala-studio',
    shopName: 'Kampala Studio',
    name: 'Relaxed Linen Shirt',
    category: 'Fashion',
    price: 95000,
    currency: 'UGX',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=1200&q=86',
    description: 'A breathable everyday shirt with a clean relaxed fit.',
    badge: 'Trending',
    stock: 9,
  },
  {
    id: 'ceramic-set',
    shopSlug: 'sunday-home',
    shopName: 'Sunday Home',
    name: 'Ceramic Coffee Set',
    category: 'Home',
    price: 118000,
    currency: 'UGX',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1200&q=86',
    description: 'A calm four-piece ceramic set for slow mornings and guests.',
    stock: 6,
  },
]

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

export const orders = [
  { id: 'GLK-2418', customer: 'Amina K.', total: 285000, status: 'New', time: '8 min ago' },
  { id: 'GLK-2417', customer: 'Brian O.', total: 210000, status: 'Confirmed', time: '42 min ago' },
  { id: 'GLK-2416', customer: 'Sarah N.', total: 350000, status: 'Delivering', time: '2 hrs ago' },
  { id: 'GLK-2415', customer: 'Joel M.', total: 65000, status: 'Completed', time: 'Yesterday' },
]

export const customers = [
  { name: 'Amina K.', orders: 3, spent: 635000, last: 'Today' },
  { name: 'Brian O.', orders: 2, spent: 385000, last: 'Today' },
  { name: 'Sarah N.', orders: 5, spent: 1200000, last: 'Yesterday' },
  { name: 'Joel M.', orders: 1, spent: 65000, last: 'Yesterday' },
]
