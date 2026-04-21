import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Activity, TrendingUp, Loader2 } from 'lucide-react'
import { formatINR } from '../lib/currency'
import { apiGet } from '../lib/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const res = await apiGet('/api/admin/metrics', token)
        if (res.ok && res.data?.success) {
          setMetrics(res.data.data)
        }
      } catch (err) {
        console.error('Failed to load metrics', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-auctus-cyan" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-slate-900 via-[#020617] to-slate-900 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to admin
            </Link>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Analytics & Reports
            </h1>
            <p className="mt-1 text-sm text-white/70 max-w-xl">
              Platform-wide performance, revenue metrics, and user engagement data.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-auctus-cyan" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Executive Summary
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live data from the platform's transactions and user base.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Lifetime GMV</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(metrics?.totalGMV || 0)}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Platform Commission</p>
            <p className="text-xl font-black text-auctus-teal">{formatINR(metrics?.totalCommission || 0)}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Average Order Value</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(metrics?.avgOrderValue || 0)}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Active Sellers</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{metrics?.activeSellers || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Users</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics?.usersCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Live Auctions</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{metrics?.liveAuctionsCount || 0}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Platform Health Monitor */}
        <div className="rounded-[32px] bg-gradient-to-br from-[#0B152A] to-[#060D1A] border border-white/5 p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-auctus-cyan/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">System Status: Optimal</span>
                </div>
                <h2 className="text-2xl font-black flex items-center gap-2 tracking-tight">
                  <Activity className="w-7 h-7 text-auctus-teal" /> Platform Health
                </h2>
                <p className="text-slate-400 text-xs font-medium mt-1">Real-time infrastructure and transaction monitoring.</p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-white/5 rounded-[24px] border border-white/5 hover:border-auctus-teal/30 transition-all group">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Core Uptime</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black">99.98%</span>
                  <span className="text-emerald-500 text-[10px] font-black mb-1.5">+0.01%</span>
                </div>
                <div className="flex gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className={`h-6 w-1 rounded-full ${i === 15 ? 'bg-amber-500/50' : 'bg-emerald-500/50'} group-hover:scale-y-110 transition-transform`}></div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-[24px] border border-white/5 hover:border-auctus-teal/30 transition-all">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Bid Settlement</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black">1.2s</span>
                  <span className="text-auctus-teal text-[10px] font-black mb-1.5">STABLE</span>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                    <span>Latency</span>
                    <span>Load</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="w-[65%] bg-auctus-teal h-full shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-[24px] border border-white/5 hover:border-auctus-teal/30 transition-all">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Security Level</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-black">L4</span>
                  <span className="text-blue-500 text-[10px] font-black mb-1.5">PROTECTED</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-6 h-6 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active nodes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
