import { ArrowLeft, ArrowDownRight, ArrowUpRight, IndianRupee } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatINRSigned } from '../lib/currency'

const rows = [
  { type: 'Deposit', amount: 250000, ref: 'Wallet top‑up', when: 'Today, 08:15', direction: 'in' },
  { type: 'Bid hold', amount: 100000, ref: 'Tesla Model S Plaid', when: 'Today, 07:42', direction: 'out' },
  { type: 'Payout', amount: 320000, ref: 'Sneaker collection – seller earnings', when: 'Yesterday, 16:03', direction: 'in' }
]

export default function Transactions() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/wallet"
            className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to wallet
          </Link>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Transaction history
          </h1>
          <p className="mt-1 text-sm text-white/70">
            A unified view of deposits, holds, payouts, and refunds across your account.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <IndianRupee className="w-4 h-4 text-auctus-teal" />
              Recent activity
            </div>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {rows.map((row, idx) => (
              <div key={idx} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  {row.direction === 'in' ? (
                    <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {row.type}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {row.ref}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className={`font-semibold ${row.direction === 'in' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatINRSigned(row.amount, row.direction)}
                  </p>
                  <p className="text-slate-400 mt-0.5">{row.when}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}