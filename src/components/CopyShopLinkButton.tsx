import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { copyText } from '../lib/clipboard'
import { siteUrl } from '../lib/site'

export function CopyShopLinkButton({ slug, disabled = false }: { slug: string; disabled?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle')
  const url = siteUrl('/' + encodeURIComponent(slug))

  useEffect(() => { setStatus('idle') }, [url, disabled])
  useEffect(() => {
    if (status !== 'copied') return
    const timer = window.setTimeout(() => setStatus('idle'), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  const copy = async () => {
    setStatus('copying')
    try {
      await copyText(url)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }

  return <span className="copy-shop-link-control">
    <button type="button" className="soft-button copy-shop-link-button" disabled={disabled || !slug || status === 'copying'} onClick={() => void copy()}>
      {status === 'copied' ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
      <span aria-live="polite">{status === 'copied' ? 'Copied!' : status === 'copying' ? 'Copying…' : 'Copy shop link'}</span>
    </button>
    {status === 'error' && <span className="copy-shop-link-error" role="status">Couldn’t copy automatically. Select and copy this link:<input aria-label="Shop link to copy" value={url} readOnly onFocus={event => event.currentTarget.select()}/></span>}
  </span>
}
