export const SHOP_LOGO_KEY = 'gulako_shop_logo'

export function getShopLogo() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(SHOP_LOGO_KEY) ?? ''
}

export function saveShopLogo(value: string) {
  window.localStorage.setItem(SHOP_LOGO_KEY, value)
  window.dispatchEvent(new Event('gulako-brand'))
}

export function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
