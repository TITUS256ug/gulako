import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="main-footer page-container">
      <div><Logo /><p>Your online storefront for selling directly to your customers.</p></div>
      <div className="footer-links">
        <a href="/signin">Sign in</a>
        <a href="/signup">Start selling</a>
      </div>
      <small>© 2026 Gulako</small>
    </footer>
  )
}
