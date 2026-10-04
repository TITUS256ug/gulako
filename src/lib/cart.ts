import { products } from '../data/mock'

export type CartLine = { productId: string; quantity: number }
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

export function addToCart(productId: string) {
  const lines = getCart()
  const existing = lines.find((line) => line.productId === productId)
  if (existing) existing.quantity += 1
  else lines.push({ productId, quantity: 1 })
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
  return getCart().map((line) => ({
    ...line,
    product: products.find((product) => product.id === line.productId) ?? products[0],
  }))
}
