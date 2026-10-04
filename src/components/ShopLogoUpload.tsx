import { Camera, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { fileToDataUrl, getShopLogo, saveShopLogo } from '../lib/shopBrand'

export function ShopLogoUpload({ compact = false }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState(() => getShopLogo())
  const [error, setError] = useState('')

  const choose = () => inputRef.current?.click()
  const change = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose a PNG, JPG or WEBP image.')
      return
    }
    if (file.size > 2_500_000) {
      setError('Logo must be smaller than 2.5 MB.')
      return
    }
    const value = await fileToDataUrl(file)
    saveShopLogo(value)
    setLogo(value)
    setError('')
  }

  return (
    <div className={compact ? 'shop-logo-uploader compact' : 'shop-logo-uploader'}>
      <button type="button" className="logo-preview-button" onClick={choose}>
        {logo ? <img src={logo} alt="Shop logo preview" /> : <span className="logo-placeholder"><Camera size={24} /></span>}
        <span className="logo-edit-badge"><Upload size={14} /></span>
      </button>
      <div className="logo-upload-copy">
        <strong>{logo ? 'Change shop logo' : 'Add shop logo'}</strong>
        <small>PNG, JPG or WEBP · max 2.5 MB</small>
        {error && <em>{error}</em>}
      </div>
      <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e => change(e.target.files?.[0])} />
    </div>
  )
}
