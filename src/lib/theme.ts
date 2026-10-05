export type GulakoTheme='light'|'dark'

const KEY='gulako_theme'

export function getTheme():GulakoTheme{
  if(typeof window==='undefined')return 'light'
  const saved=window.localStorage.getItem(KEY)
  if(saved==='dark'||saved==='light')return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'
}

export function applyTheme(theme:GulakoTheme){
  if(typeof document!=='undefined'){
    document.documentElement.dataset.theme=theme
    document.documentElement.style.colorScheme=theme
  }
  if(typeof window!=='undefined')window.localStorage.setItem(KEY,theme)
}

export function toggleTheme(theme:GulakoTheme):GulakoTheme{
  const next=theme==='dark'?'light':'dark'
  applyTheme(next)
  return next
}
