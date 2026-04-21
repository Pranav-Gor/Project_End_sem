import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'
import { apiGet, apiPatch, apiPost, apiPut } from '../lib/api'
import { readSessionUser } from '../hooks/useSessionUser'
import { useToast } from '../contexts/ToastContext.jsx'
import {
  Shield, Users, Gavel, BarChart3, AlertTriangle, CheckCircle2,
  Settings, ArrowRight, ServerCog, Globe, DollarSign, FileCheck2, X,
  LogOut, Home, Building2, Eye, ThumbsUp, ThumbsDown, Loader2, User,
  FileText, Landmark, BadgeCheck, Search, Sun, Moon, Download, Mail, Send
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import RazorpayMockModal from '../components/RazorpayMockModal'

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve()
      return
    }
    const existing = document.querySelector('script[data-razorpay-checkout]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed')))
      return
    }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    s.dataset.razorpayCheckout = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Razorpay script failed'))
    document.body.appendChild(s)
  })
}

function fmtWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

const STATIC_KPI_ICONS = {
  users: Users,
  auctions: Gavel,
  revenue: DollarSign
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const u = readSessionUser()
  const token = localStorage.getItem('accessToken')
  const { theme, toggleTheme } = useTheme()

  const [apps, setApps] = useState([])
  const [appsLoading, setAppsLoading] = useState(true)
  const [appsError, setAppsError] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [activePanel, setActivePanel] = useState('kyc') // 'kyc' | 'financials' | 'newsletter'
  const [docTab, setDocTab] = useState('gst')

  // Newsletter metrics
  const [nlSubject, setNlSubject] = useState('')
  const [nlMessage, setNlMessage] = useState('')
  const [nlLoading, setNlLoading] = useState(false)

  // Financial metrics
  const [finRequests, setFinRequests] = useState([])
  const [finLoading, setFinLoading] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [actionBusy, setActionBusy] = useState(false)
  const [mockPaymentData, setMockPaymentData] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [withdrawModal, setWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawBank, setWithdrawBank] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [adminName, setAdminName] = useState(u?.name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState(null)

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return apps
    return apps.filter((row) => {
      const blob = [
        row.applicant?.name,
        row.applicant?.email,
        row.businessName,
        row.gstin,
        row.panNumber,
        row.businessAddress
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return blob.includes(q)
    })
  }, [apps, search])

  const viewStats = useMemo(
    () => ({
      total: apps.length,
      pending: apps.filter((a) => a.status === 'pending').length,
      approved: apps.filter((a) => a.status === 'approved').length,
      rejected: apps.filter((a) => a.status === 'rejected').length
    }),
    [apps]
  )

  const loadApplications = useCallback(async () => {
    setAppsLoading(true)
    setAppsError(null)
    const qs = filter === 'all' ? '' : `?status=${filter}`
    const { ok, status, data } = await apiGet(`/api/admin/seller-applications${qs}`, token)
    if (!ok && status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      navigate('/auth?next=%2Fadmin%2Fdashboard&reason=login', { replace: true })
      return
    }
    if (!ok) {
      setAppsError(data?.message || 'Could not load seller applications')
      setApps([])
    } else {
      setApps(data?.data?.applications || [])
    }
    setAppsLoading(false)
  }, [filter, token, navigate])

  const loadFinancials = useCallback(async () => {
    setFinLoading(true)
    const { ok, data } = await apiGet(`/api/admin/financials`, token)
    if (ok && data?.success) {
      setFinRequests(data.data.requests)
    }
    setFinLoading(false)
  }, [token])

  const loadMetrics = useCallback(async () => {
    const { ok, data } = await apiGet('/api/admin/metrics', token)
    if (ok && data?.success) {
      setMetrics(data.data)
    }
  }, [token])

  useEffect(() => {
    loadApplications()
    loadFinancials()
    loadMetrics()
  }, [loadApplications, loadFinancials, loadMetrics])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    navigate('/')
  }

  const openDetail = (row) => {
    setDetail(row)
    setDocTab('gst')
    setReviewNote('')
  }

  const submitReview = async (status) => {
    if (!detail?._id) return
    setActionBusy(true)
    const { ok, status: httpStatus, data } = await apiPatch(
      `/api/admin/seller-applications/${detail._id}`,
      { status, reviewNote: reviewNote.trim() },
      token
    )
    setActionBusy(false)
    if (!ok && httpStatus === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      navigate('/auth?next=%2Fadmin%2Fdashboard&reason=login', { replace: true })
      return
    }
    if (!ok) {
      alert(data?.message || 'Action failed')
      return
    }
    const emailNotify = data?.data?.emailNotify
    addToast(
      status === 'approved' ? 'Seller approved and saved.' : 'Application rejected and saved.',
      'success'
    )
    if (emailNotify === 'skipped_no_smtp') {
      addToast(
        'Email skipped — add SMTP_USER and SMTP_PASS in backend .env to notify applicants.',
        'info',
        5500
      )
    } else if (emailNotify === 'failed') {
      addToast('Decision saved, but the email could not be sent.', 'warning', 4500)
    }
    setDetail(null)
    loadApplications()
  }

  const processFinancials = async (id, type, status, requestedAmount) => {
    if (status === 'approved') {
      setMockPaymentData({ id, type, status, amount: requestedAmount })
    } else {
      // Reject directly
      triggerBackendProcess(id, type, status)
    }
  }

  const triggerBackendProcess = async (id, type, status) => {
    setActionBusy(true)
    const { ok, data } = await apiPatch(`/api/admin/financials/${id}/${type}`, { status }, token)
    setActionBusy(false)
    if (ok) {
      addToast(`Successfully ${status} the transaction`, 'success')
      loadFinancials()
    } else {
      alert(data?.message || 'Failed to process financial request.')
    }
  }

  const handleBroadcastNewsletter = async (e) => {
    e.preventDefault()
    if (!nlSubject.trim() || !nlMessage.trim()) return
    setNlLoading(true)
    try {
      const { ok, data } = await apiPost('/api/newsletter/broadcast', { subject: nlSubject, message: nlMessage }, token)
      if (ok && data?.success) {
        addToast(data.message || 'Newsletter broadcast sent successfully!', 'success')
        setNlSubject('')
        setNlMessage('')
      } else {
        addToast(data?.message || 'Failed to send broadcast.', 'error')
      }
    } catch (err) {
      addToast('An error occurred while sending the broadcast.', 'error')
    } finally {
      setNlLoading(false)
    }
  }

  const handleAdminWithdraw = async (e) => {
    e.preventDefault()
    if (!withdrawAmount || !withdrawBank) return
    setWithdrawLoading(true)
    try {
      const { ok, data } = await apiPost('/api/admin/withdraw', { 
        amount: Number(withdrawAmount), 
        bankDetails: withdrawBank 
      }, token)
      if (ok) {
        addToast(data.message || 'Withdrawal successful', 'success')
        setWithdrawModal(false)
        setWithdrawAmount('')
        setWithdrawBank('')
        loadMetrics()
      } else {
        addToast(data?.message || 'Withdrawal failed', 'error')
      }
    } catch (err) {
      addToast('An error occurred during withdrawal', 'error')
    } finally {
      setWithdrawLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)
    setProfileSuccess(false)
    try {
      const { ok, data } = await apiPut('/api/auth/profile', { name: adminName }, token)
      if (ok && data.success) {
        setProfileSuccess(true)
        const user = JSON.parse(localStorage.getItem('user'))
        user.name = adminName
        localStorage.setItem('user', JSON.stringify(user))
        window.dispatchEvent(new Event('auctus-auth'))
        addToast('Admin profile updated successfully', 'success')
      } else {
        setProfileError(data?.message || 'Failed to update profile')
      }
    } catch (err) {
      setProfileError('An unexpected error occurred.')
    } finally {
      setProfileSaving(false)
    }
  }

  const pendingCount = apps.filter((a) => a.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-500">
      {mockPaymentData && (
        <RazorpayMockModal
          amount={mockPaymentData.amount}
          purpose={`Admin ${mockPaymentData.type} Approval`}
          onSuccess={() => {
            triggerBackendProcess(mockPaymentData.id, mockPaymentData.type, mockPaymentData.status)
            setMockPaymentData(null)
          }}
          onClose={() => setMockPaymentData(null)}
        />
      )}
      {withdrawModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0c1222] p-8 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Landmark className="w-6 h-6 text-auctus-teal" />
                  Withdraw Earnings
                </h3>
                <p className="text-xs text-slate-400 mt-1">Transfer platform commission to bank</p>
              </div>
              <button onClick={() => setWithdrawModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdminWithdraw} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Available Balance</label>
                <p className="text-3xl font-black text-white">{formatINR(metrics?.adminWalletBalance || 0)}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Amount to Withdraw</label>
                <div className="relative group">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-auctus-teal transition-colors" />
                  <input
                    type="number"
                    required
                    max={metrics?.adminWalletBalance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold focus:outline-none focus:ring-2 focus:ring-auctus-teal/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Bank / UPI Destination</label>
                <textarea
                  required
                  rows={3}
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  placeholder="Enter Account No, IFSC, or UPI ID..."
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-auctus-teal/40 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={withdrawLoading || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > (metrics?.adminWalletBalance || 0)}
                className="w-full py-4 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 disabled:scale-100"
              >
                {withdrawLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  'Confirm Withdrawal'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-[#070b14]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-auctus-teal to-violet-600 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-auctus-cyan/90 truncate">
                Auctus Admin
              </p>
              <p className="text-sm font-semibold text-white truncate">{u?.name || 'Administrator'}</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Site</span>
            </Link>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-500 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>

      <div className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-[#070b14] to-auctus-teal/10 dark:from-violet-900/30 dark:via-[#070b14] dark:to-auctus-teal/20 transition-colors duration-700" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-auctus-teal/20 blur-[120px] rounded-full translate-x-1/3 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/20 blur-[100px] rounded-full -translate-x-1/3 translate-y-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-300 uppercase tracking-[0.25em]">Operational command</p>
              <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Trust, liquidity & seller KYC
              </h1>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Review GST certificates, PAN proofs, and bank mandates before activating seller accounts. Only admins
                reach this surface—routes are blocked without an authenticated admin session.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActivePanel('kyc')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${activePanel === 'kyc' ? 'bg-auctus-teal border-auctus-teal text-white shadow-lg shadow-teal-500/20' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
              >
                <BadgeCheck className="w-4 h-4" />
                {pendingCount} KYC Queue
              </button>
              <button
                onClick={() => setActivePanel('financials')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${activePanel === 'financials' ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/20' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
              >
                <DollarSign className="w-4 h-4" />
                {finRequests.length} Pending Payouts
              </button>
              <button
                onClick={() => setActivePanel('newsletter')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${activePanel === 'newsletter' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
              >
                <Mail className="w-4 h-4" />
                Newsletter Broadcast
              </button>
              <button
                onClick={() => setActivePanel('settings')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${activePanel === 'settings' ? 'bg-slate-700 border-slate-700 text-white shadow-lg shadow-slate-500/20' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
              >
                <Settings className="w-4 h-4" />
                Admin Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[
            { label: 'Total users', value: metrics ? metrics.usersCount.toLocaleString() : '...', sub: 'Registered accounts', icon: STATIC_KPI_ICONS.users, accent: 'from-violet-500/20 via-violet-500/5 to-transparent' },
            { label: 'Live auctions', value: metrics ? metrics.liveAuctionsCount.toLocaleString() : '...', sub: 'Currently active', icon: STATIC_KPI_ICONS.auctions, accent: 'from-emerald-500/20 via-emerald-500/5 to-transparent' },
            { label: 'Total Commission', value: metrics ? formatINR(metrics.totalCommission || 0) : '...', sub: 'Lifetime earnings', icon: STATIC_KPI_ICONS.revenue, accent: 'from-amber-500/20 via-amber-500/5 to-transparent' },
            { 
              label: 'Available Funds', 
              value: metrics ? formatINR(metrics.adminWalletBalance || 0) : '...', 
              sub: 'Withdrawable balance', 
              icon: DollarSign, 
              accent: 'from-auctus-teal/20 via-auctus-teal/5 to-transparent',
              action: (
                <button 
                  onClick={() => setWithdrawModal(true)}
                  disabled={!metrics?.adminWalletBalance}
                  className="mt-2 w-full py-2 bg-auctus-teal/20 hover:bg-auctus-teal text-auctus-teal hover:text-white border border-auctus-teal/30 rounded-xl text-xs font-black transition-all disabled:opacity-30"
                >
                  Withdraw Now
                </button>
              )
            }
          ].map((k) => (
            <div
              key={k.label}
              className={`rounded-3xl border border-white/10 bg-gradient-to-br ${k.accent} p-6 shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 flex flex-col justify-between`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                  <k.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.label}</p>
                  <p className="text-xl font-black text-white mt-0.5">{k.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{k.sub}</p>
                </div>
              </div>
              {k.action}
            </div>
          ))}
        </div>

        {/* Dynamic Panels */}
        {activePanel === 'kyc' ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/50 overflow-hidden">
            <div className="flex flex-col gap-4 px-5 py-4 border-b border-white/10 bg-slate-950/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck2 className="w-5 h-5 text-auctus-teal shrink-0" />
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-white tracking-tight">Seller onboarding & KYC</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      This view: <span className="text-white font-bold">{viewStats.total} total</span>
                      {viewStats.pending ? <span className="text-amber-400"> · {viewStats.pending} pending</span> : ''}
                      {viewStats.approved ? <span className="text-emerald-400"> · {viewStats.approved} approved</span> : ''}
                      {viewStats.rejected ? <span className="text-red-400"> · {viewStats.rejected} rejected</span> : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, email, GSTIN, PAN…"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-auctus-teal/35"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          setFilter(f)
                          setSearch('')
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${filter === f
                          ? 'bg-auctus-teal text-white'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5">
              {appsError && (
                <p className="text-sm text-red-400 mb-4">{appsError}</p>
              )}
              {appsLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading applications…
                </div>
              ) : apps.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No applications in this filter. New seller sign-ups appear here after they submit KYC.
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  No applications match “{search.trim()}”. Try a different search or clear the box.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/10">
                        <th className="px-4 py-3">Applicant</th>
                        <th className="px-4 py-3">Business</th>
                        <th className="px-4 py-3 hidden md:table-cell">PAN</th>
                        <th className="px-4 py-3">GSTIN</th>
                        <th className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">Submitted</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApps.map((row) => (
                        <tr key={row._id} className="border-b border-white/5 hover:bg-white/[0.03]">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">{row.applicant?.name || '—'}</p>
                            <p className="text-xs text-slate-500 break-all">{row.applicant?.email}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-300 max-w-[200px]">
                            <span className="truncate block" title={row.businessName}>
                              {row.businessName}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400 hidden md:table-cell">
                            {row.panNumber || '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.gstin}</td>
                          <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell whitespace-nowrap">
                            {fmtWhen(row.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold uppercase ${row.status === 'pending'
                                ? 'bg-amber-500 text-black animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                : row.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-red-500/20 text-red-300'
                                }`}
                            >
                              {row.status === 'pending' ? 'Needs Verification' : row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openDetail(row)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : activePanel === 'financials' ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/50 overflow-hidden">
            <div className="flex flex-col gap-4 px-5 py-4 border-b border-white/10 bg-slate-950/50">
              <div className="flex items-center gap-2 min-w-0">
                <Landmark className="w-5 h-5 text-violet-500 shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-white">Pending Financial Requests</h2>
                  <p className="text-xs text-slate-500">Process Seller Payouts and User Withdrawals</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              {finLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Loading transactions…
                </div>
              ) : finRequests.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">
                  Great! No pending financial requests inside the queue.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-white/10 bg-white/5">
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">User Record</th>
                        <th className="px-4 py-3">Destination</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finRequests.map((req) => (
                        <tr key={req._id} className="border-b border-white/5 hover:bg-white/[0.03]">
                          <td className="px-4 py-3 text-base font-black text-white">{formatINR(req.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${req.type === 'payout' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                              {req.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">{req.user?.name || '—'}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{req.user?.userId}</p>
                          </td>
                          <td className="px-4 py-3 max-w-[200px]">
                            <p className="text-xs text-slate-400 truncate" title={req.bankDetails}>{req.bankDetails}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{fmtWhen(req.requestedAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                disabled={actionBusy}
                                onClick={() => processFinancials(req._id, req.type, 'rejected', req.amount)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                disabled={actionBusy}
                                onClick={() => processFinancials(req._id, req.type, 'approved', req.amount)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs font-bold transition-colors"
                              >
                                Confirm
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        ) : activePanel === 'settings' ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/50 overflow-hidden">
            <div className="flex flex-col gap-4 px-5 py-4 border-b border-white/10 bg-slate-950/50">
              <div className="flex items-center gap-2 min-w-0">
                <Settings className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-white">Admin Settings</h2>
                  <p className="text-xs text-slate-500">Manage your administrative profile and platform security</p>
                </div>
              </div>
            </div>

            <div className="p-8 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-auctus-teal" /> Update Profile
                  </h3>
                  <p className="text-xs text-slate-400">Change your display name and public identification.</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Display Name</label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-auctus-teal/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={u?.email || ''}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-sm cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-600 mt-1.5 font-medium italic">Email cannot be changed by the user for security reasons.</p>
                  </div>

                  {profileError && <p className="text-xs text-red-400 font-bold">{profileError}</p>}
                  {profileSuccess && <p className="text-xs text-emerald-400 font-bold">Profile updated successfully!</p>}

                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="w-full py-3 bg-auctus-teal text-white font-black rounded-xl shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50"
                  >
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-violet-400" /> Security
                  </h3>
                  <p className="text-xs text-slate-400">Manage multi‑factor authentication and manage trusted devices.</p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-violet-500/30 transition-all">
                    <div>
                      <p className="text-sm font-bold text-white">Multi-Factor Auth</p>
                      <p className="text-[10px] text-slate-500">Add an extra layer of security</p>
                    </div>
                    <div className="w-10 h-6 bg-slate-700 rounded-full relative cursor-not-allowed opacity-50">
                      <div className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group hover:border-violet-500/30 transition-all">
                    <div>
                      <p className="text-sm font-bold text-white">Trusted Devices</p>
                      <p className="text-[10px] text-slate-500">Manage 2 recognized browsers</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                  </div>

                  <div className="pt-4">
                    <button className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors">
                      Terminate all active sessions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : activePanel === 'newsletter' ? (
          <section className="rounded-3xl border border-white/10 bg-slate-900/50 overflow-hidden">
            <div className="flex flex-col gap-4 px-5 py-4 border-b border-white/10 bg-slate-950/50">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-white">Newsletter Broadcast</h2>
                  <p className="text-xs text-slate-500">Send an email announcement to all newsletter subscribers</p>
                </div>
              </div>
            </div>

            <div className="p-5 max-w-2xl mx-auto">
              <form onSubmit={handleBroadcastNewsletter} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={nlSubject}
                    onChange={(e) => setNlSubject(e.target.value)}
                    placeholder="E.g., Exciting New Drop on Auctus!"
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-auctus-teal/40 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Message</label>
                  <textarea
                    required
                    rows={6}
                    value={nlMessage}
                    onChange={(e) => setNlMessage(e.target.value)}
                    placeholder="Write your announcement here..."
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-auctus-teal/40 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={nlLoading || !nlSubject.trim() || !nlMessage.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {nlLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {nlLoading ? 'Sending Broadcast...' : 'Send Broadcast to All Subscribers'}
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {/* Secondary grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-md p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-auctus-teal" />
              <h3 className="text-lg font-black text-white tracking-tight">Trust & safety</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Chargeback rate</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">0.12%</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">KYC completion</p>
                <p className="text-2xl font-black text-sky-400 mt-1">94%</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Flagged accounts</p>
                <p className="text-2xl font-black text-amber-400 mt-1">12</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-md p-8 space-y-6 shadow-xl flex flex-col">
            <div className="flex items-center gap-3">
              <ServerCog className="w-6 h-6 text-violet-400" />
              <h3 className="text-lg font-black text-white tracking-tight">System Status</h3>
            </div>
            <div className="space-y-4 text-sm text-slate-400 flex-1">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-medium">API Latency (p95)</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">184 ms</span>
              </div>
              <div className="flex justify-between items-center pb-3">
                <span className="font-medium">WebSocket Uptime</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded-md">99.99%</span>
              </div>
            </div>
            <Link
              to="/reports"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold text-white transition-colors border border-white/10"
            >
              View Analytics <ArrowRight className="w-4 h-4 text-auctus-teal" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 flex items-start gap-2 text-xs text-slate-500">
          <Globe className="w-4 h-4 text-auctus-teal shrink-0 mt-0.5" />
          <p>
            Regions: North India {formatINR(9820000)} / 24h · West {formatINR(6710000)} · South {formatINR(3580000)}
          </p>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl border border-white/10 bg-[#0c1222] shadow-2xl flex flex-col">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-auctus-teal" />
                  {detail.businessName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {detail.applicant?.name} · {detail.applicant?.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  <span className="text-slate-400">
                    GSTIN: <span className="font-mono text-white">{detail.gstin}</span>
                  </span>
                  <span className="text-slate-400">
                    PAN: <span className="font-mono text-white">{detail.panNumber}</span>
                  </span>
                </div>
                {detail.businessAddress && (
                  <p className="text-xs text-slate-400 mt-2">{detail.businessAddress}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="p-2 rounded-xl hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detail.status === 'pending' ? (
              <>
                <div className="px-5 pt-4 flex items-end justify-between border-b border-white/10">
                  <div className="flex gap-2">
                    {[
                      { id: 'gst', label: 'GST certificate', icon: FileText },
                      { id: 'pan', label: 'PAN card', icon: FileText },
                      { id: 'bank', label: 'Bank proof', icon: Landmark }
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setDocTab(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-bold ${docTab === t.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <a
                    href={
                      docTab === 'gst'
                        ? detail.gstCertificateDataUrl
                        : docTab === 'pan'
                          ? detail.panCertificateDataUrl
                          : detail.bankProofDataUrl
                    }
                    download={`${detail.businessName.replace(/\s+/g, '_')}_${docTab}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-auctus-teal/20 text-auctus-teal hover:bg-auctus-teal/30 hover:text-white transition-colors text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download File
                  </a>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="rounded-2xl bg-black/40 border border-white/10 overflow-hidden min-h-[240px] flex items-center justify-center">
                    {(() => {
                      const src =
                        docTab === 'gst'
                          ? detail.gstCertificateDataUrl
                          : docTab === 'pan'
                            ? detail.panCertificateDataUrl
                            : detail.bankProofDataUrl
                      if (!src) {
                        return <p className="text-slate-500 text-sm">No document uploaded for this slot.</p>
                      }

                      let previewNode = null;

                      if (typeof src === 'string') {
                        if (src === 'uploading...') {
                          return (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              <p className="text-sm">Document is being processed by Cloudinary, please refresh in a moment...</p>
                            </div>
                          );
                        } else if (src.startsWith('data:')) {
                          const mime = src.slice(5).split(';')[0];
                          if (mime.startsWith('image/')) {
                            previewNode = <img src={src} alt="" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg" />;
                          } else if (mime === 'application/pdf') {
                            previewNode = <object data={src} type="application/pdf" className="w-full h-[60vh] rounded-lg shadow-lg bg-white"><p className="p-4 text-center text-slate-800">PDF Preview Not Supported. Please Download.</p></object>;
                          }
                        } else if (src.startsWith('http')) {
                          if (src.toLowerCase().endsWith('.pdf') || src.toLowerCase().includes('/raw/upload/')) {
                            previewNode = <object data={src} type="application/pdf" className="w-full h-[60vh] rounded-lg shadow-lg bg-white"><p className="p-4 text-center text-slate-800">PDF Preview Not Supported. Please Download.</p></object>;
                          } else {
                            previewNode = <img src={src} alt="" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg" />;
                          }
                        }
                      }

                      if (previewNode) return previewNode;

                      return (
                        <div className="text-center px-4">
                          <p className="text-slate-500 text-sm">Preview not available for this file type.</p>
                          <a
                            href={src}
                            download={`${docTab}-document`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-xs font-bold hover:bg-white/15"
                          >
                            Download document
                          </a>
                        </div>
                      )
                    })()}
                  </div>
                  <label className="block mt-4 text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Admin note (optional)
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-auctus-teal/40"
                    placeholder="Reason for rejection or internal reference…"
                  />
                </div>
                <div className="px-5 py-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-end">
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => submitReview('rejected')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/40 text-red-300 font-bold hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => submitReview('approved')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-auctus-teal to-emerald-600 text-white font-bold hover:opacity-95 disabled:opacity-50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    Approve seller
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                This application was already <strong className="text-white">{detail.status}</strong>.
                {detail.reviewNote && <p className="mt-3 text-left text-slate-500">{detail.reviewNote}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
