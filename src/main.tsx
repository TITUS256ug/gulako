import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'

const rootElement = document.getElementById('root')

async function startGulako() {
  if (!rootElement) throw new Error('Gulako could not find the #root element.')

  try {
    const { default: App } = await import('./App')
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  } catch (error) {
    console.error('Gulako failed to start:', error)
    const message = error instanceof Error ? error.message : String(error)
    rootElement.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#fbfaff;font-family:Arial,sans-serif;color:#19152a">
        <section style="max-width:640px;width:100%;padding:32px;border:1px solid #eae4f2;border-radius:24px;background:white;box-shadow:0 20px 60px rgba(54,31,91,.10)">
          <div style="width:48px;height:48px;border-radius:15px;background:linear-gradient(145deg,#6d28d9,#a855f7);color:white;display:grid;place-items:center;font-size:30px;font-weight:800;margin-bottom:18px">g</div>
          <h1 style="margin:0 0 10px;font-size:28px">Gulako could not start.</h1>
          <p style="margin:0 0 18px;color:#746e82;line-height:1.6">This build includes a startup diagnostic so you never get an unexplained white screen.</p>
          <pre style="white-space:pre-wrap;padding:14px;border-radius:14px;background:#f7f4fb;color:#5b5068;font-size:12px">${message}</pre>
          <p style="margin:18px 0 0;color:#746e82;font-size:13px">Stop the dev server, delete <b>node_modules</b> and <b>package-lock.json</b>, then run <b>npm install</b> and <b>npm run dev</b>.</p>
        </section>
      </main>`
  }
}

startGulako()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined))
}
