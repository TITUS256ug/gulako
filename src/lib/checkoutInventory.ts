import { useEffect, useState } from 'react'
import { backend } from './backend'
import type { CheckoutProduct } from './checkoutValidation'

export async function fetchCheckoutInventory(ids: string[]): Promise<Record<string, CheckoutProduct>> {
  if (!ids.length) return {}
  const { data, error } = await backend.from('products')
    .select('id,name,stock,shops!inner(slug,published)')
    .in('id', [...new Set(ids)]).eq('active', true).eq('shops.published', true)
  if (error) throw new Error('Could not check current stock. Your cart is saved. Please try again.')
  return Object.fromEntries((data ?? []).map(row => {
    const shop = Array.isArray(row.shops) ? row.shops[0] : row.shops
    return [row.id, { id: row.id, name: row.name, stock: Number(row.stock), shopSlug: shop?.slug ?? '' }]
  }))
}

export function useCartInventory(ids: string[]) {
  const key = [...new Set(ids)].sort().join(',')
  const [version, setVersion] = useState(0)
  const [state, setState] = useState<{ key: string; products: Record<string, CheckoutProduct>; loading: boolean; error: string }>({ key: '', products: {}, loading: true, error: '' })
  useEffect(() => {
    let active = true
    setState(previous => ({ ...previous, key, loading: true, error: '' }))
    void fetchCheckoutInventory(key ? key.split(',') : []).then(products => {
      if (active) setState({ key, products, loading: false, error: '' })
    }).catch(() => {
      if (active) setState({ key, products: {}, loading: false, error: 'Could not check current stock. Your cart is saved. Please try again.' })
    })
    return () => { active = false }
  }, [key, version])
  useEffect(() => {
    const refresh = () => setVersion(value => value + 1)
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [])
  return { ...state, loading: state.loading || state.key !== key, refresh: () => setVersion(value => value + 1) }
}
