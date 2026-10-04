import { Menu, Moon, Search, ShoppingBag, Store, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { cartCount } from '../lib/cart'
import { Logo } from './Logo'

type HeaderProps = { onSearch?: (value: string) => void; compact?: boolean }

export function Header({ onSearch, compact = false }: HeaderProps) {
  const [dark, setDark] = useState(false)
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem('gulako_theme') === 'dark'
    setDark(saved)
    const refresh = () => setCount(cartCount())
    refresh()
    window.addEventListener('gulako-cart', refresh)
    return () => window.removeEventListener('gulako-cart', refresh)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('gulako_theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />

        {!compact && (
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="/explore">Explore</a>
            <a href="/shop/nile-ai-solutions">Demo shop</a>
          </nav>
        )}

        {compact && (
          <label className="global-search" aria-label="Search Gulako">
            <Search size={18} />
            <input placeholder="Search this shop..." onChange={(e: ChangeEvent<HTMLInputElement>) => onSearch?.(e.target.value)} />
          </label>
        )}

        <div className="header-actions">
          <button className="icon-button subtle-icon" onClick={() => setDark(v => !v)} aria-label="Toggle theme">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <a className="cart-button" href="/cart" aria-label="Cart">
            <ShoppingBag size={18} />
            {count > 0 && <span>{count}</span>}
          </a>
          <a className="primary-button header-login" href="/signin">Login</a>
          <a className="soft-button header-cta" href="/signup"><Store size={17} /> Start selling</a>
          <button className="mobile-menu-button" onClick={() => setOpen(v => !v)} aria-label="Open menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mobile-menu">
          <a href="/explore">Explore</a>
          <a href="/shop/nile-ai-solutions">Demo shop</a>
          <a href="/signin">Sign in</a>
          <a href="/signup">Start selling</a>
        </div>
      )}
    </header>
  )
}
