import { Link, useNavigate } from 'react-router-dom'
import {
  Gavel, Activity, Wallet2, Bell, Star, ArrowRight,
  TrendingUp, Clock, Shield, Settings, User, PieChart, CreditCard,
  Pencil, Heart, LayoutGrid, Sparkles, Home, LogOut
} from 'lucide-react'
import { useSessionUser } from '../hooks/useSessionUser'
import { formatINR } from '../lib/currency'

const quickStats = (walletInr = 0) => [
  { label: 'Active Bids', value: 6, change: '+2 today', icon: Gavel, color: 'text-auctus-teal', bg: 'bg-auctus-teal/10' },
  { label: 'Winning', value: 3, change: '+1 vs yesterday', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  {
    label: 'Wallet',
    value: formatINR(walletInr),
    change: 'Add funds on Wallet to bid',
    icon: Wallet2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10'
  },
  { label: 'Alerts', value: 4, change: 'Ending in 1h', icon: Bell, color: 'text-red-500', bg: 'bg-red-500/10' }
]

const timeline = [
  { label: 'You are winning 3 auctions', type: 'success', time: 'Just now' },
  { label: 'Outbid on “Vintage Rolex Submariner”', type: 'warning', time: '7 min ago' },
  { label: `Deposit of ${formatINR(250000)} added to wallet`, type: 'info', time: 'Today, 08:15' },
  { label: 'Identity verification approved', type: 'success', time: 'Yesterday' }
]

export default function UserDashboard() {
  const u = useSessionUser()
  const navigate = useNavigate()
  const firstName = u?.name?.trim()?.split(/\s+/)[0] || 'Collector'
  const avatar = u?.profile?.avatar
  const initial = u?.name?.charAt(0)?.toUpperCase() || 'U'

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-auctus-teal">
            <Home className="w-4 h-4" />
            Home
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-auctus-navy via-[#0f2840] to-[#061018]" />
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-auctus-cyan/30 via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-white/10 shadow-2xl shadow-black/40 bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white text-3xl font-black">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg">
                  <Sparkles className="w-4 h-4" />
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-auctus-cyan/90 uppercase tracking-[0.2em]">
                  Your command centre
                </p>
                <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Hi, {firstName}
                </h1>
                <p className="mt-2 text-sm text-white/65 max-w-lg">
                  {u?.email ? (
                    <span className="font-medium text-white/85">{u.email}</span>
                  ) : (
                    'Sign in to sync bids and wallet across devices.'
                  )}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-auctus-navy text-sm font-bold shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit profile & photo
                  </Link>
                  <Link
                    to="/live-auctions"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    <Gavel className="w-4 h-4" />
                    Browse live auctions
                  </Link>
                  <Link
                    to="/upcoming-auctions"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    <Clock className="w-4 h-4" />
                    Browse upcoming auctions
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Link
                to="/wallet"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 backdrop-blur-sm"
              >
                <Wallet2 className="w-4 h-4" />
                Wallet
              </Link>
              <Link
                to="/my-bids"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 backdrop-blur-sm"
              >
                <LayoutGrid className="w-4 h-4" />
                My bids
              </Link>
              <Link
                to="/favorites"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 backdrop-blur-sm"
              >
                <Heart className="w-4 h-4" />
                Saved
              </Link>
              <Link
                to="/settings"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/15 backdrop-blur-sm"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickStats(u?.walletBalance ?? 0).map((stat) => (
            <div
              key={stat.label}
              className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-auctus-teal/30 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} group-hover:scale-105 transition-transform`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">{stat.change}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-auctus-teal" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Live bidding snapshot
                  </h2>
                </div>
                <Link
                  to="/my-bids"
                  className="inline-flex items-center gap-1 text-xs font-bold text-auctus-teal hover:text-auctus-cyan"
                >
                  View all bids
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Exposure</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{formatINR(12450000)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Max commitment across active bids
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Risk score</p>
                  <p className="text-lg font-bold text-emerald-500 flex items-center gap-1">
                    23%
                    <Shield className="w-4 h-4" />
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Wallet & limits
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ending soon</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">4 in 60 min</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Alerts before close</p>
                </div>
              </div>
            </div>


          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-auctus-teal" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Activity</h2>
                </div>
                <span className="text-[11px] text-slate-400">24h</span>
              </div>
              <ol className="space-y-3 text-sm">
                {timeline.map((event, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                        event.type === 'success'
                          ? 'bg-emerald-500'
                          : event.type === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-sky-500'
                      }`}
                    />
                    <div>
                      <p className="text-slate-800 dark:text-slate-100 leading-snug">{event.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{event.time}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 text-white p-6 border border-slate-700/80 space-y-4 shadow-xl">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-auctus-cyan" />
                <h2 className="text-sm font-bold">Account & limits</h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Complete your profile and verification to unlock higher limits and faster payouts in INR.
              </p>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    Verification
                  </span>
                  <span className="text-emerald-400 font-bold">Done</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                    Payments
                  </span>
                  <Link to="/wallet" className="text-auctus-cyan font-bold hover:text-white">
                    Add method
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <PieChart className="w-3.5 h-3.5 text-sky-300" />
                    Daily bid cap
                  </span>
                  <span className="text-slate-200 font-semibold">{formatINR(5000000)}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Link
                  to="/profile"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-auctus-teal text-white text-xs font-bold hover:opacity-95"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit profile
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/20 text-xs font-bold hover:bg-white/10"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
