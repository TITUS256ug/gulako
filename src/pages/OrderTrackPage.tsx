import { ArrowLeft, PackageSearch } from 'lucide-react'
import { Header } from '../components/Header'

export function OrderTrackPage({ id }: { id: string }) {
  return <div className="app-shell"><Header/><main className="page-container order-track-page">
    <a className="back-link" href="/"><ArrowLeft size={17}/> Back to Gulako</a>
    <section className="empty-state product-empty">
      <PackageSearch size={30}/>
      <h2>Order tracking</h2>
      <p>{id ? `No live order found for #${id}.` : 'Enter a valid order link to track an order.'}</p>
      <a className="primary-button" href="/">Back to Gulako</a>
    </section>
  </main></div>
}
