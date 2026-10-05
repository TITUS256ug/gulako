import { Camera, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getShopLogo, saveShopLogo } from '../lib/shopBrand'
import { getStoreProfile, saveStoreProfile, uploadSellerAsset, validateStoreSlug } from '../lib/storeData'

export function ShopLogoUpload({ compact = false }: { compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [logo, setLogo] = useState(() => getShopLogo())
  const [error, setError] = useState('')
  const [busy,setBusy]=useState(false)

  useEffect(()=>{
    const refresh=()=>setLogo(getShopLogo())
    window.addEventListener('gulako-brand',refresh)
    return()=>window.removeEventListener('gulako-brand',refresh)
  },[])

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

    try{
      setBusy(true)
      const value=await uploadSellerAsset(file,'logo')
      saveShopLogo(value)
      setLogo(value)
      const profile=getStoreProfile()
      if(profile.businessName && validateStoreSlug(profile.slug).valid) await saveStoreProfile(profile)
      setError('')
    }catch(err){
      setError(err instanceof Error?err.message:'Could not upload logo.')
    }finally{
      setBusy(false)
    }
  }

  return (
    <div className={compact ? 'shop-logo-uploader compact' : 'shop-logo-uploader'}>
      <button type="button" className="logo-preview-button" onClick={choose} disabled={busy}>
        {logo ? <img src={logo} alt="Shop logo preview" /> : <span className="logo-placeholder"><Camera size={24} /></span>}
        <span className="logo-edit-badge"><Upload size={14} /></span>
      </button>
      <div className="logo-upload-copy">
        <strong>{busy?'Uploading…':logo ? 'Change shop logo' : 'Add shop logo'}</strong>
        <small>PNG, JPG or WEBP · max 2.5 MB</small>
        {error && <em>{error}</em>}
      </div>
      <input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e => change(e.target.files?.[0])} />
    </div>
  )
}
