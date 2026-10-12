// Public, allowlisted storefront data embedded in the server-rendered page.
export function readDiscoveryData<T>(kind: string, key?: string): T | null | undefined {
  if (typeof document === 'undefined') return undefined
  const element = document.getElementById('gulako-public-data')
  if (!element) return undefined
  try {
    const payload = JSON.parse(element.textContent || '')
    return payload.kind === kind && payload.key === key ? payload.data : undefined
  } catch { return undefined }
}
