import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, Gavel, PlusCircle, Activity, Clock, 
  CheckCircle2, AlertCircle, Loader2, DollarSign,
  TrendingUp, BarChart3, ChevronRight 
} from 'lucide-react'
import { apiGet } from '../lib/api'
import { formatINR } from '../lib/currency'

export default function SellerAuctions() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({ auctions: [], stats: { totalAuctions: 0, totalEarnings: 0 } })
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await apiGet('/api/seller/auctions', token)
        if (!cancelled) {
          if (res.ok && res.data?.success) {
            setData(res.data.data)
          } else {
            setError('Failed to load your auctions.')
          }
        }
      } catch {
        if (!cancelled) setError('Connection error.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const getStatusBadge = (status) => {
    switch(status) {
      case 'live': return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1"><Activity className="w-2.5 h-2.5" /> Live</span>
      case 'upcoming': return <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-wider border border-blue-500/20 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Scheduled</span>
      case 'closed': return <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-500/20 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Sold</span>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0D1535] via-[#0B1228] to-[#070A18] border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <Link to="/seller/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-4 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Dashboard
              </Link>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-500" />
                Auction Manager
              </h1>
              <p className="mt-1.5 text-sm text-slate-400 font-medium">Manage your portfolio, track performance, and monitor bids in real-time.</p>
            </div>
            <Link to="/seller/auctions/new" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-sm font-black shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-colors">
              <PlusCircle className="w-5 h-5" /> New Auction
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Auctions</p>
              <p className="text-2xl font-black text-white">{loading ? '...' : data.stats.totalAuctions}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Earnings</p>
              <p className="text-2xl font-black text-emerald-400">{loading ? '...' : formatINR(data.stats.totalEarnings)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Bidders</p>
              <p className="text-2xl font-black text-blue-400">{loading ? '...' : data.auctions.reduce((sum, a) => sum + (a.bidCount || 0), 0)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg. Sale Price</p>
              <p className="text-2xl font-black text-indigo-400">
                {loading ? '...' : formatINR(data.stats.totalAuctions > 0 ? data.stats.totalEarnings / data.stats.totalAuctions : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table / List ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-500 font-bold">Synchronizing with database...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/20 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        )}

        {!loading && !error && data.auctions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
              <Gavel className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold mb-2">No auctions found</h3>
            <p className="text-slate-500 max-w-sm mb-8">You haven't created any auctions yet. Start your first listing to begin earning.</p>
            <Link to="/seller/auctions/new" className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-500 transition-all">
              Create First Auction
            </Link>
          </div>
        )}

        {!loading && !error && data.auctions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Auction Item</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Bids</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ends In / Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {data.auctions.map((a) => (
                    <tr key={a.auctionId} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-white/10 shrink-0">
                            {a.images?.[0] ? <img src={a.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><TrendingUp className="w-5 h-5 opacity-30" /></div>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">{a.title}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{a.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-900 dark:text-white">{formatINR(a.currentBid || a.startingBid)}</p>
                        <p className="text-[10px] font-medium text-slate-500">Starting: {formatINR(a.startingBid)}</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-slate-700 dark:text-slate-300">
                        {a.bidCount || 0}
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(a.status)}
                        {a.status === 'closed' && a.bids?.length > 0 && (
                          <div className="mt-1.5 p-1.5 rounded bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 inline-block">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                              Winner: {a.bids[a.bids.length - 1].bidderName}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              Amount: {formatINR(a.bids[a.bids.length - 1].amount)}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(a.endsAt).toLocaleDateString()}</p>
                        <p className="text-[10px] font-medium text-slate-500">{new Date(a.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link to={`/auction/${a.auctionId}`} className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
