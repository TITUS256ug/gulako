import { ArrowLeft, PackageSearch } from 'lucide-react'
import { Header } from '../components/Header'

export function ProductPage({ id }: { id: string }) {
  return <div className="app-shell">
    <Header/>
    <main className="page-container product-page">
      <a className="back-link" href="/"><ArrowLeft size={17}/> Back to Gulako</a>
      <section className="empty-state product-empty">
        <PackageSearch size={30}/>
        <h2>Product unavailable</h2>
        <p>{id ? 'This product is not currently published.' : 'No product was selected.'}</p>
        <a className="primary-button" href="/">Back to Gulako</a>
      </section>
    </main>
  </div>
}
