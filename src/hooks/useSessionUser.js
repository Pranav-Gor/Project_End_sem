import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function readSessionUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

/** Re-reads when the route changes (same-tab login updates localStorage). */
export function useSessionUser() {
  const { pathname } = useLocation()
  const [user, setUser] = useState(readSessionUser)

  useEffect(() => {
    setUser(readSessionUser())
  }, [pathname])

  useEffect(() => {
    const sync = () => setUser(readSessionUser())
    window.addEventListener('storage', sync)
    window.addEventListener('auctus-auth', sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('auctus-auth', sync)
    }
  }, [])

  return user
}
