import type { Product } from '../data/mock'
import { getSellerProducts } from './storeData'

export type CartLine = { productId: string; quantity: number; product?: Product }
const KEY = 'gulako_cart'

export function getCart(): CartLine[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

export function saveCart(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines))
  window.dispatchEvent(new Event('gulako-cart'))
}

export function addToCart(product: string | Product) {
  const productId=typeof product==='string'?product:product.id
  const lines = getCart()
  const existing = lines.find((line) => line.productId === productId)
  if (existing) {
    existing.quantity += 1
    if(typeof product!=='string') existing.product=product
  } else {
    lines.push({ productId, quantity: 1, product:typeof product==='string'?undefined:product })
  }
  saveCart(lines)
}

export function updateCart(productId: string, quantity: number) {
  const lines = getCart()
    .map((line) => line.productId === productId ? { ...line, quantity } : line)
    .filter((line) => line.quantity > 0)
  saveCart(lines)
}

export function clearCart() { saveCart([]) }
export function cartCount() { return getCart().reduce((sum, line) => sum + line.quantity, 0) }

export function cartDetails() {
  const sellerProducts=getSellerProducts()
  return getCart()
    .map((line) => {
      const product=line.product??sellerProducts.find((item) => item.id === line.productId)
      return product ? { ...line, product } : null
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line))
}
