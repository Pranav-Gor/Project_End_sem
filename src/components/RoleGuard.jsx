import { Navigate, useLocation } from 'react-router-dom'
import { readSessionUser } from '../hooks/useSessionUser'
import { apiGet } from '../lib/api.js'
import { useEffect, useMemo, useState } from 'react'

/** Must be logged in with a valid session object */
export function AuthGuard({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('accessToken')
  const user = readSessionUser()

  if (!token || !user) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?next=${next}&reason=login`} replace />
  }
  return children
}

/**
 * Must be logged in and role must be one of `allowedRoles`.
 * Wrong role → redirect home (no admin URL leakage for guests/non-admins).
 */
export function RoleGuard({ children, allowedRoles }) {
  const location = useLocation()
  const token = localStorage.getItem('accessToken')
  const initialUser = readSessionUser()
  const [user, setUser] = useState(initialUser)
  // If we have a token but no `user` in localStorage, wait for /api/auth/me before redirecting.
  const [hydrating, setHydrating] = useState(() => !!(token && !initialUser))

  const allowed = useMemo(() => new Set(allowedRoles || []), [allowedRoles])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!token) {
        if (mounted) setHydrating(false)
        return
      }
      const u = readSessionUser()
      if (u) {
        if (mounted) {
          setUser(u)
          setHydrating(false)
        }
        return
      }

      try {
        setHydrating(true)
        const { ok, data } = await apiGet('/api/auth/me', token)
        if (!mounted) return
        if (ok && data?.data?.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user))
          setUser(data.data.user)
        }
      } finally {
        if (mounted) setHydrating(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [token])

  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?next=${next}&reason=role`} replace />
  }

  if (!user) {
    if (hydrating) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-500">
          Loading session…
        </div>
      )
    }
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?next=${next}&reason=role`} replace />
  }

  if (!allowed.has(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

/** Buyer dashboard: only `user` role. Admin/seller are sent to their consoles. */
export function BuyerDashboardGuard({ children }) {
  const token = localStorage.getItem('accessToken')
  const initialUser = readSessionUser()
  const [user, setUser] = useState(initialUser)
  const [hydrating, setHydrating] = useState(() => !!(token && !initialUser))

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!token) {
        if (mounted) setHydrating(false)
        return
      }
      const u = readSessionUser()
      if (u) {
        if (mounted) {
          setUser(u)
          setHydrating(false)
        }
        return
      }
      try {
        setHydrating(true)
        const { ok, data } = await apiGet('/api/auth/me', token)
        if (!mounted) return
        if (ok && data?.data?.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user))
          setUser(data.data.user)
        }
      } finally {
        if (mounted) setHydrating(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [token])

  if (!token) {
    return <Navigate to="/auth?next=%2Fdashboard&reason=login" replace />
  }
  if (!user) {
    if (hydrating) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-500">
          Loading session…
        </div>
      )
    }
    return <Navigate to="/auth?next=%2Fdashboard&reason=login" replace />
  }
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }
  if (user.role === 'seller') {
    return <Navigate to="/seller/dashboard" replace />
  }
  return children
}

/**
 * Seller routes: allow only when seller `isVerified === true`.
 * Otherwise redirect to `/seller/kyc`.
 */
export function SellerVerifiedGuard({ children }) {
  const location = useLocation()
  const token = localStorage.getItem('accessToken')
  const initialUser = readSessionUser()
  const [user, setUser] = useState(initialUser)
  const [sessionHydrating, setSessionHydrating] = useState(() => !!(token && !initialUser))

  const [verified, setVerified] = useState(!!initialUser?.isVerified)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!token) {
        if (mounted) setSessionHydrating(false)
        return
      }
      let u = readSessionUser()
      if (!u) {
        try {
          setSessionHydrating(true)
          const { ok, data } = await apiGet('/api/auth/me', token)
          if (!mounted) return
          if (ok && data?.data?.user) {
            localStorage.setItem('user', JSON.stringify(data.data.user))
            u = data.data.user
            setUser(u)
          }
        } finally {
          if (mounted) setSessionHydrating(false)
        }
      } else if (mounted) {
        setUser(u)
        setSessionHydrating(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [token])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!token || !user) return
      if (user.isVerified) {
        if (mounted) setVerified(true)
        return
      }
      try {
        setBusy(true)
        const { ok, data } = await apiGet('/api/auth/me', token)
        if (!mounted) return
        if (ok && data?.data?.user?.isVerified === true) {
          setVerified(true)
          if (data.data.user) {
            localStorage.setItem('user', JSON.stringify(data.data.user))
            setUser(data.data.user)
          }
        } else {
          setVerified(false)
        }
      } catch {
        setVerified(false)
      } finally {
        if (mounted) setBusy(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [token, user?.isVerified])

  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?next=${next}&reason=login`} replace />
  }

  if (!user) {
    if (sessionHydrating) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate-500">
          Loading session…
        </div>
      )
    }
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/auth?next=${next}&reason=login`} replace />
  }

  if (user.role === 'admin') return children

  if (busy || verified === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Checking seller verification…
      </div>
    )
  }

  if (!verified) {
    return <Navigate to="/seller/kyc" replace />
  }

  return children
}
