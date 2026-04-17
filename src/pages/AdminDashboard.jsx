import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'
import { apiGet, apiPatch, apiPost } from '../lib/api'
import { readSessionUser } from '../hooks/useSessionUser'
import { useToast } from '../contexts/ToastContext.jsx'
import {
  Shield, Users, Gavel, BarChart3, AlertTriangle, CheckCircle2,
  Settings, ArrowRight, ServerCog, Globe, DollarSign, FileCheck2, X,
  LogOut, Home, Building2, Eye, ThumbsUp, ThumbsDown, Loader2,
  FileText, Landmark, BadgeCheck, Search, Sun, Moon
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

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

const KPI = [
  { label: 'Total users', value: '18,240', sub: '+312 this week', icon: Users, accent: 'from-violet-500/20 to-transparent' },
  { label: 'Live auctions', value: '128', sub: '37 multi-seller events', icon: Gavel, accent: 'from-emerald-500/20 to-transparent' },
  { label: '24h volume', value: formatINR(25000000), sub: '+19% vs prior day', icon: DollarSign, accent: 'from-amber-500/20 to-transparent' },
  { label: 'Open disputes', value: '7', sub: '3 high-priority', icon: AlertTriangle, accent: 'from-red-500/20 to-transparent' }
]

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
  const [activePanel, setActivePanel] = useState('kyc') // 'kyc' | 'financials'
  const [docTab, setDocTab] = useState('gst')

  // Financial metrics
  const [finRequests, setFinRequests] = useState([])
  const [finLoading, setFinLoading] = useState(false)
  const [reviewNote, setReviewNote] = useState('')
  const [actionBusy, setActionBusy] = useState(false)

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

  useEffect(() => {
    loadApplications()
    loadFinancials()
  }, [loadApplications, loadFinancials])

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
    if (!confirm(`Are you sure you want to ${status} this ${type}?`)) return

    if (status === 'approved') {
      setActionBusy(true)
      try {
        await loadRazorpayScript()

        // Generate a real Razorpay order to satisfy the modal's strict validation.
        // We cap the visual representation at ₹500,000 max to prevent Razorpay test-mode rejection.
        const safeAmount = Math.min(Number(requestedAmount) || 100, 500000)

        const { ok, data } = await apiPost('/api/payments/create-razorpay-order', { amountInr: safeAmount }, token)

        if (!ok || !data?.success || !data?.data?.orderId) {
          // If Razorpay fails to generate a test order, fallback directly to DB update.
          addToast('Razorpay Order Failed. Bypassing UI and processing natively...', 'info')
          triggerBackendProcess(id, type, status)
          return
        }

        const { orderId, amount, keyId } = data.data

        const options = {
          key: keyId,
          amount: amount, // strict paise format returned from API
          currency: 'INR',
          name: 'Auctus Admin Portal',
          description: `Simulating ${type} processing`,
          order_id: orderId,
          theme: { color: '#8b5cf6' },
          handler: async function (response) {
            // After mock Razorpay success, actually approve on backend
            triggerBackendProcess(id, type, status)
          },
          modal: {
            ondismiss() {
              setActionBusy(false)
            }
          }
        }
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', () => {
          setActionBusy(false)
          addToast('Gateway simulation failed or cancelled.', 'warning')
        })
        rzp.open()
      } catch (err) {
        addToast('Could not load Razorpay for simulation.', 'warning')
        setActionBusy(false)
      }
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

  const pendingCount = apps.filter((a) => a.status === 'pending').length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-500">
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
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
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
        <div className="absolute inset-0 bg-gradient-to-br from-violet-100/80 via-slate-50 to-slate-50 dark:from-violet-950/80 dark:via-[#070b14] dark:to-[#070b14] transition-colors duration-500" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-auctus-teal/10 dark:bg-auctus-teal/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {KPI.map((k) => (
            <div
              key={k.label}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${k.accent} to-slate-900/80 p-5 shadow-lg shadow-black/40`}
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <k.icon className="w-5 h-5 text-auctus-teal" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{k.label}</p>
                  <p className="text-xl font-black text-white">{k.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{k.sub}</p>
                </div>
              </div>
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
                    <h2 className="text-base font-bold text-white">Seller onboarding & KYC</h2>
                    <p className="text-xs text-slate-500">
                      This view: {viewStats.total} total
                      {viewStats.pending ? ` · ${viewStats.pending} pending` : ''}
                      {viewStats.approved ? ` · ${viewStats.approved} approved` : ''}
                      {viewStats.rejected ? ` · ${viewStats.rejected} rejected` : ''}
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
                                ? 'bg-amber-500/20 text-amber-300'
                                : row.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-red-500/20 text-red-300'
                                }`}
                            >
                              {row.status}
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
        ) : (
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
        )}

        {/* Secondary grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-auctus-teal" />
              <h3 className="font-bold text-white">Trust & safety</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-slate-500">Chargeback rate</p>
                <p className="text-lg font-bold text-emerald-400">0.12%</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-slate-500">KYC completion</p>
                <p className="text-lg font-bold text-sky-400">94%</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-slate-500">Flagged accounts</p>
                <p className="text-lg font-bold text-amber-400">12</p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ServerCog className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold text-white text-sm">System</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>API p95</span>
                <span className="text-emerald-400 font-semibold">184 ms</span>
              </div>
              <div className="flex justify-between">
                <span>WS uptime</span>
                <span className="text-emerald-400 font-semibold">99.99%</span>
              </div>
            </div>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 text-xs font-bold text-auctus-teal hover:text-white"
            >
              Analytics <ArrowRight className="w-3 h-3" />
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
                <div className="px-5 pt-4 flex gap-2 border-b border-white/10">
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

                      // Data URL format: data:<mime>;base64,...
                      const mime = typeof src === 'string' && src.startsWith('data:')
                        ? src.slice(5).split(';')[0]
                        : ''

                      if (mime.startsWith('image/')) {
                        return <img src={src} alt="" className="max-w-full max-h-[50vh] object-contain" />
                      }

                      if (mime === 'application/pdf') {
                        return <iframe title="PDF preview" src={src} className="w-full h-[50vh]" />
                      }

                      return (
                        <div className="text-center px-4">
                          <p className="text-slate-500 text-sm">Preview not available for this file type.</p>
                          <a
                            href={src}
                            download={`${docTab}-document`}
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
