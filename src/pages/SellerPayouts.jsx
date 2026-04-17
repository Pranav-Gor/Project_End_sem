import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Gavel, ArrowLeft, Wallet2, CheckCircle2, Clock, 
  TrendingUp, CreditCard, Loader2, AlertCircle,
  BarChart3, DollarSign, ArrowUpRight, Zap,
  History, Send, ShieldCheck
} from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'
import { formatINR } from '../lib/currency'

export default function SellerPayouts() {
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [data, setData] = useState({ payouts: [], closedAuctions: [], stats: { totalGross: 0, totalNetAvailable: 0, totalPaidOut: 0, balance: 0 } })
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const res = await apiGet('/api/payouts/me', token)
      if (res.ok && res.data?.success) {
        setData(res.data.data)
      } else {
        setError('Failed to load payout data.')
      }
    } catch {
      setError('Connection error.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRequestPayout = async () => {
    if (data.stats.balance < 1000) {
      setError('Minimum payout amount is ₹1,000')
      return
    }

    const token = localStorage.getItem('accessToken')

    setActionLoading(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await apiPost('/api/payouts/request', { amount: data.stats.balance }, token)
      if (res.ok && res.data?.success) {
        setSuccessMsg('Request submitted successfully. Platform admin will review and process.')
        fetchData()
      } else {
        setError(res.data?.message || 'Failed to submit request.')
      }
    } catch {
      setError('Server error during request.')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'settled': return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Settled</span>
      case 'processed': return <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Completed</span>
      case 'processing': return <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1 animate-pulse"><Clock className="w-3 h-3" /> Processing</span>
      case 'pending': return <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>
      case 'failed': return <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Failed</span>
      case 'rejected': return <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Rejected</span>
      default: return <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-500/20">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#06091A] text-slate-900 dark:text-white transition-colors">
      
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0D1535] via-[#0B1228] to-[#070A18] border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <Link to="/seller/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 bg-white/5 px-4 py-2 rounded-full border border-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-2xl shadow-teal-500/20">
                <Wallet2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Payout Hub</h1>
                <p className="text-sm text-slate-400 mt-1 font-medium tracking-wide">Manage earnings, settlements, and Razorpay payouts.</p>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl min-w-[280px]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Available to Payout</p>
              <div className="flex items-end justify-between gap-4">
                <p className="text-4xl font-black text-white">{formatINR(data.stats.balance)}</p>
                <button 
                  disabled={actionLoading || data.stats.balance < 1000}
                  onClick={handleRequestPayout}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-xs font-black shadow-lg shadow-teal-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Request Payout</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
            <p className="text-slate-500 font-bold">Accessing ledger...</p>
          </div>
        ) : (
          <div className="space-y-10">
            
            {/* Feedback */}
            {error && <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
            {successMsg && <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{successMsg}</div>}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1028] border border-slate-200 dark:border-white/5 shadow-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Total Gross Sale</p>
                <p className="text-3xl font-black">{formatINR(data.stats.totalGross)}</p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Lifetime revenue processed</p>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1028] border border-slate-200 dark:border-white/5 shadow-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Platform Fee (10%)</p>
                <p className="text-3xl font-black text-red-500">-{formatINR(data.stats.totalGross * 0.1)}</p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Standard service fee applied</p>
              </div>
              <div className="p-6 rounded-3xl bg-white dark:bg-[#0B1028] border border-slate-200 dark:border-white/5 shadow-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Already Settled</p>
                <p className="text-3xl font-black text-teal-500">{formatINR(data.stats.totalPaidOut)}</p>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><History className="w-3.5 h-3.5" /> Transferred to your bank</p>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-[#0B1028] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  Payout History
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Payout ID</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">UTR / Reference</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {data.payouts.length > 0 ? data.payouts.map(p => (
                      <tr key={p._id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-8 py-5">
                          <code className="text-xs font-bold text-blue-500 uppercase tracking-tight">{p.razorpayPayoutId}</code>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black">{formatINR(p.amount)}</p>
                        </td>
                        <td className="px-8 py-5">
                          {getStatusBadge(p.status)}
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-medium text-slate-500">{p.utr || 'Pending Settlement'}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-xs font-bold">{new Date(p.initiatedAt).toLocaleDateString()}</p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-8 py-20 text-center">
                          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <Zap className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="font-bold text-slate-500">No payout history found.</p>
                          <p className="text-xs text-slate-400 mt-1">Initiate your first settlement to see it here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sold Auctions Breakdown */}
            <div className="bg-white dark:bg-[#0B1028] rounded-3xl border border-slate-200 dark:border-white/5 shadow-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-indigo-500" />
                  Earnings &amp; Payouts Breakdown
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-white/5">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Auction Item</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Final Price</th>
                      <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Platform Fee (10%)</th>
                      <th className="px-8 py-4 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right">Seller Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {(data.closedAuctions || []).length > 0 ? data.closedAuctions.map(a => (
                      <tr key={a._id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold truncate max-w-[200px]">{a.title}</p>
                          <p className="text-xs text-slate-500">ID: {a.auctionId}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-sm font-black">{formatINR(a.currentBid || 0)}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-sm font-medium text-red-500">-{formatINR((a.currentBid || 0) * 0.1)}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-sm font-black text-emerald-500">{formatINR((a.currentBid || 0) * 0.9)}</p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" className="px-8 py-20 text-center">
                          <p className="font-bold text-slate-500">No sold auctions yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payout Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-8 rounded-3xl bg-blue-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                <h4 className="text-xl font-black mb-2 flex items-center gap-2"><CreditCard className="w-6 h-6" /> Payment Cycle</h4>
                <p className="text-sm text-blue-100 font-medium">Standard Razorpay settlements to sellers happen within T+2 days. In this mock environment, we simulate the "Settled" webhook within seconds after you initiate a request.</p>
              </div>
              <div className="p-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1028]">
                <h4 className="text-xl font-black mb-2 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-teal-500" /> Secure Transfers</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">All payouts are verified against closed auction records. Your bank account details from KYC are used for the actual transfer via RazorpayX transfers.</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
