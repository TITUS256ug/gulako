export const GULAKO_SITE_URL='https://gulako.site'

export function siteUrl(path=''){
  const clean=path ? (path.startsWith('/')?path:'/'+path) : ''
  return GULAKO_SITE_URL+clean
}
