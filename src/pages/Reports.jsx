import { Link } from 'react-router-dom'
import { ArrowLeft, BarChart3, Activity, TrendingUp } from 'lucide-react'
import { formatINR } from '../lib/currency'

export default function Reports() {
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
              Analytics & reports
            </h1>
            <p className="mt-1 text-sm text-white/70 max-w-xl">
              High‑level metrics designed for admins and power sellers. Plug your real charts in here later.
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
              This is your reporting hub
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Wire it to your backend later for true charts, export to CSV, and period comparisons.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">GMV (30 days)</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(74200000)}</p>
            <p className="mt-1 text-xs text-emerald-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +17% vs prior 30 days
            </p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Average order value</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(618000)}</p>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Active sellers</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">412</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-auctus-teal" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Placeholder chart
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Replace this block with your favourite chart library (e.g. Recharts, Chart.js) to visualise bids per minute, sell‑through by category, or revenue curves.
          </p>
        </div>
      </div>
    </div>
  )
}

