export type CheckoutProduct = { id: string; name: string; stock: number; shopSlug: string }

export function stockIssue(name: string, quantity: number, product?: CheckoutProduct): string | null {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return `${name}: choose a quantity between 1 and 99.`
  if (!product) return `${name} is no longer available. Remove it from your cart to continue.`
  if (product.stock < 1) return `${name} is out of stock. Remove it from your cart to continue.`
  if (quantity > product.stock) return `${name}: only ${product.stock} available. Reduce the quantity in your cart to continue.`
  return null
}

export function checkoutErrorMessage(error: unknown): string {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : ''
  if (/does not have enough stock$/.test(message)) return message + '. Reduce its quantity in your cart and try again.'
  if (/^A product in this order is unavailable$/.test(message)) return 'A product is no longer available. Review your cart before trying again.'
  if (/^Shop (not found|is unavailable)$/.test(message)) return 'This shop is currently unavailable. Your cart is saved.'
  if (/^Customer (name|phone) is required$/.test(message)) return message + '.'
  if (/^.+: (only \d+ available\.|choose a quantity between 1 and 99\.)/.test(message) || /^.+ is (out of stock|no longer available)\./.test(message)) return message
  if (message === 'Could not check current stock. Your cart is saved. Please try again.') return message
  return 'Could not place your order. Your cart is saved. Please try again.'
}
