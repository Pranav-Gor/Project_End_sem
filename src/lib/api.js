const BASE = import.meta.env.VITE_API_URL || ''

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) return null
  
  try {
    const res = await fetch(`${BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })
    
    if (!res.ok) return null
    
    const data = await res.json()
    if (data.success && data.data?.tokens?.accessToken) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken)
      if (data.data.tokens.refreshToken) {
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken)
      }
      return data.data.tokens.accessToken
    }
    return null
  } catch (error) {
    console.error('Token refresh failed:', error)
    return null
  }
}

async function handleAuthError(response, path, options, retryCount = 0) {
  // Only attempt refresh on 401 errors and if we haven't retried yet
  if (response.status === 401 && retryCount === 0) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      // Retry the original request with new token
      const newHeaders = { ...options.headers }
      newHeaders.Authorization = `Bearer ${newToken}`
      
      const retryRes = await fetch(`${BASE}${path}`, {
        ...options,
        headers: newHeaders
      })
      
      const data = await retryRes.json().catch(() => ({}))
      return { ok: retryRes.ok, status: retryRes.status, data }
    }
  }
  
  // If refresh failed or not a 401, return original response
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, data }
}

export async function apiGet(path, accessToken = null) {
  const headers = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
    headers: Object.keys(headers).length ? headers : undefined
  })
  return handleAuthError(res, path, { method: 'GET', credentials: 'include', headers })
}

export async function apiPost(path, body, accessToken = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  })
  return handleAuthError(res, path, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  })
}

export async function apiPatch(path, body, accessToken) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  })
  return handleAuthError(res, path, {
    method: 'PATCH',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  })
}

export async function apiPut(path, body, accessToken) {
  const headers = { 'Content-Type': 'application/json' }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  })
  return handleAuthError(res, path, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(body)
  })
}

export function persistSession({ user, tokens }) {
  if (tokens?.accessToken) localStorage.setItem('accessToken', tokens.accessToken)
  if (tokens?.refreshToken) localStorage.setItem('refreshToken', tokens.refreshToken)
  if (user) localStorage.setItem('user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}
