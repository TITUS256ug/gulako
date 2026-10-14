import { renderToString } from 'react-dom/server'
import { ShopPage, type PublicShopData } from '../src/pages/ShopPage'
import { ProductPage, type ProductData } from '../src/pages/ProductPage'
import { HomePage } from '../src/pages/HomePage'
import { PricingPage } from '../src/pages/PricingPage'
import { PrivacyPage, TermsPage } from '../src/pages/LegalPages'
import { rowToProduct, rowToProfile } from '../src/lib/storeData'

export { rowToProduct, rowToProfile }
export function renderShop(slug: string, data: PublicShopData | null) {
  return renderToString(<ShopPage slug={slug} initialData={data} />)
}
export function renderProduct(id: string, data: ProductData | null) {
  return renderToString(<ProductPage id={id} initialData={data} />)
}
export function renderStatic(path: string) {
  return renderToString(path === '/terms' ? <TermsPage /> : path === '/privacy' ? <PrivacyPage /> : path === '/pricing' ? <PricingPage /> : <HomePage />)
}
