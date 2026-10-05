import { backend } from './backend'

function cleanAuthUrl() {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.delete('code')
  url.searchParams.delete('error')
  url.searchParams.delete('error_code')
  url.searchParams.delete('error_description')
  window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''))
}

export async function resolveAuthSessionFromUrl() {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')

  if (code) {
    const { data, error } = await backend.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      cleanAuthUrl()
      return data.session
    }
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  const accessToken = hash.get('access_token')
  const refreshToken = hash.get('refresh_token')

  if (accessToken && refreshToken) {
    const { data, error } = await backend.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (!error && data.session) {
      cleanAuthUrl()
      return data.session
    }
  }

  const { data } = await backend.auth.getSession()
  return data.session
}
