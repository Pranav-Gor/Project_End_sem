import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, LayoutDashboard } from 'lucide-react'
import { useSessionUser } from '../hooks/useSessionUser'
import { getDashboardPath } from '../lib/dashboard'

export default function NavAuthButtons({ compact = false }) {
  const user = useSessionUser()
  const navigate = useNavigate()
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null
  const loggedIn = !!(user && token)
  const dashboardHref = user ? getDashboardPath(user.role) : '/dashboard'

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('auctus-auth'))
    navigate('/')
  }

  const avatarSrc = user?.profile?.avatar

  if (!loggedIn) {
    return (
      <button
        type="button"
        onClick={() => navigate('/auth')}
        className={
          compact
            ? 'p-2.5 rounded-xl bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white'
            : 'hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-auctus-teal/30 transition-all'
        }
        aria-label="Sign in"
      >
        {compact ? <User className="w-5 h-5" /> : (
          <>
            <User className="w-5 h-5" />
            <span>Sign In</span>
          </>
        )}
      </button>
    )
  }

  const initial = user.name?.charAt(0)?.toUpperCase() || 'U'

  if (compact) {
    return (
      <div className="flex items-center gap-2 sm:hidden">
        <Link
          to={dashboardHref}
          className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
          aria-label="Dashboard"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-auctus-teal">{initial}</span>
          )}
        </Link>
        <button
          type="button"
          onClick={logout}
          className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="hidden sm:flex items-center gap-2 lg:gap-3">
      <Link
        to={dashboardHref}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-auctus-teal rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <LayoutDashboard className="w-4 h-4" />
        Dashboard
      </Link>
      <Link
        to="/profile"
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-[200px]"
      >
        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white text-sm font-bold">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
          {user.name}
        </span>
      </Link>
      <button
        type="button"
        onClick={logout}
        className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
        title="Log out"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  )
}
