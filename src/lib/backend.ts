import { createClient } from '@supabase/supabase-js'

const apiUrl = import.meta.env.VITE_API_URL || 'https://example.supabase.co'
const publicToken = import.meta.env.VITE_PUBLIC_TOKEN || 'public-placeholder'

export const backend = createClient(apiUrl, publicToken)

export const backendConfigured =
  Boolean(import.meta.env.VITE_API_URL) &&
  Boolean(import.meta.env.VITE_PUBLIC_TOKEN)
