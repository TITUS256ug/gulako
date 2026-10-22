export type PlanId = 'free' | 'pro' | 'business'
export type BillingCurrency = 'UGX' | 'USD'

export const planOrder: PlanId[] = ['free', 'pro', 'business']
export const planNames: Record<PlanId, string> = { free: 'Free', pro: 'Pro', business: 'Business' }
export const planPrices: Record<PlanId, Record<BillingCurrency, number>> = {
  free: { UGX: 0, USD: 0 },
  pro: { UGX: 20000, USD: 6 },
  business: { UGX: 50000, USD: 15 },
}
export const planBenefits: Record<PlanId, string[]> = {
  free: ['Up to 100 active products', 'Unlimited orders', 'WhatsApp ordering', 'Your own shop link and location'],
  pro: ['Everything in Free', 'Unlimited products', 'Maps and directions', 'Shop analytics and customization'],
  business: ['Everything in Pro', 'Unlimited products and orders', 'AI product descriptions', 'Up to 20 AI drafts per day', 'Verified location badge after review'],
}

export function planDirection(current: PlanId, target: PlanId): 'current' | 'upgrade' | 'downgrade' {
  const difference = planOrder.indexOf(target) - planOrder.indexOf(current)
  return difference === 0 ? 'current' : difference > 0 ? 'upgrade' : 'downgrade'
}

export function formatPlanPrice(plan: PlanId, currency: BillingCurrency) {
  const amount = planPrices[plan][currency]
  return currency === 'UGX' ? 'UGX ' + new Intl.NumberFormat('en-UG').format(amount) : '$' + amount
}
