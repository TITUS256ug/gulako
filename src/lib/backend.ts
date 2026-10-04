import { createClient } from '@supabase/supabase-js'

export const backend = createClient(
  import.meta.env.VITE_API_URL,
  import.meta.env.VITE_PUBLIC_TOKEN,
)
