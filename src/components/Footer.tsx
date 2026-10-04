import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="main-footer page-container">
      <div><Logo /><p>Uganda's modern storefront for local commerce.</p></div>
      <div className="footer-links">
        <a href="/explore">Explore</a>
        <a href="/#pricing">Pricing</a>
        <a href="/signin">Sign in</a>
        <a href="/signup">Sell on Gulako</a>
      </div>
      <small>© 2026 Gulako</small>
    </footer>
  )
}
