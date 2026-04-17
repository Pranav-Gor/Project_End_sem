/** Match backend role → default dashboard path after login. */
export function getDashboardPath(role) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'seller') return '/seller/dashboard'
  return '/dashboard'
}

export function hasBrowserSession() {
  try {
    return !!(localStorage.getItem('accessToken') && localStorage.getItem('user'))
  } catch {
    return false
  }
}
