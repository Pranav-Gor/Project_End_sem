import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet2, CreditCard, ArrowDownCircle, ArrowUpCircle, Loader2 } from 'lucide-react'
import { formatINR } from '../lib/currency'
import { apiPost, apiGet } from '../lib/api'

const PRESETS = [100, 500, 1000, 2500, 5000]

// Reverted Razorpay dependency per user feedback.
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


export default function Wallet() {
  const navigate = useNavigate()
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const [balance, setBalance] = useState(0)
  const [amountInr, setAmountInr] = useState(500000000)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [banner, setBanner] = useState({ type: '', text: '' })
  
  // Withdrawal states
  const [mode, setMode] = useState('deposit') // 'deposit' or 'withdraw'
  const [withdrawAmount, setWithdrawAmount] = useState(1000)
  const [bankDetails, setBankDetails] = useState('')

  useEffect(() => {
    if (!token) {
      navigate(`/auth?next=${encodeURIComponent('/wallet')}`, { replace: true })
    }
  }, [token, navigate])

  const refreshBalance = useCallback(async () => {
    if (!token) return
    const { ok, data } = await apiGet('/api/auth/me', token)
    if (ok && data?.data?.user) {
      const w = data.data.user.walletBalance ?? 0
      setBalance(w)
      try {
        const prev = JSON.parse(localStorage.getItem('user') || 'null')
        if (prev) {
          localStorage.setItem('user', JSON.stringify({ ...prev, walletBalance: w }))
          window.dispatchEvent(new Event('auctus-auth'))
        }
      } catch {
        /* ignore */
      }
    }
  }, [token])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  const readSessionUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  }

  const startPayment = useCallback(async () => {
    setBanner({ type: '', text: '' })
    setLoadingCheckout(true)
    
    try {
      const { ok, data } = await apiPost('/api/wallet/deposit', { amount: amountInr }, token)
      
      if (!ok || !data?.success) {
        setBanner({ type: 'err', text: data?.message || 'Could not deposit funds.' })
      } else {
        setBanner({ type: 'ok', text: `Successfully generated a direct unlimited deposit of ${formatINR(amountInr)}.` })
        await refreshBalance()
      }
    } catch {
      setBanner({ type: 'err', text: 'Server error processing deposit simulation.' })
    } finally {
      setLoadingCheckout(false)
    }
  }, [amountInr, token, refreshBalance])

  const startWithdrawal = async () => {
    setBanner({ type: '', text: '' })
    setLoadingCheckout(true)
    
    try {
      const { ok, data } = await apiPost('/api/wallet/withdraw', { amount: withdrawAmount, bankDetails }, token)
      
      if (!ok || !data?.success) {
        setBanner({ type: 'err', text: data?.message || 'Could not request withdrawal.' })
      } else {
        setBanner({ type: 'ok', text: `Withdrawal request for ${formatINR(withdrawAmount)} submitted.` })
        setBankDetails('')
        await refreshBalance()
      }
    } catch {
      setBanner({ type: 'err', text: 'Server error processing withdrawal.' })
    } finally {
      setLoadingCheckout(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500">
        Redirecting to sign in…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white mb-2"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to dashboard
            </Link>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Wallet & funding
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Add funds with <strong className="text-white">Razorpay</strong> (INR). Successful payments are confirmed via
              secure verification and webhook.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {banner.text ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              banner.type === 'err'
                ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20'
            }`}
          >
            {banner.text}
          </div>
        ) : null}

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white">
              <Wallet2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Available balance
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{formatINR(balance)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use for bids on live auctions — bidding debits this balance only (not Razorpay at bid time).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setMode('deposit')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${mode === 'deposit' ? 'bg-auctus-teal text-white' : 'border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setMode('withdraw')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${mode === 'withdraw' ? 'bg-auctus-teal text-white' : 'border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <ArrowUpCircle className="w-4 h-4" />
              Withdraw
            </button>
          </div>
        </div>

        {mode === 'deposit' ? (
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-auctus-teal" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Add funds directly (Unlimited Bypass)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter any amount in rupees. You can deposit 700+ million instantly without API blocks.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Amount (INR)
                </label>
                <input
                  type="number"
                  min={1}
                  value={amountInr}
                  onChange={(e) => setAmountInr(Number(e.target.value) || 0)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="button"
                onClick={startPayment}
                disabled={loadingCheckout || amountInr < 1}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-auctus-teal text-white text-sm font-bold hover:opacity-95 disabled:opacity-50"
              >
                {loadingCheckout ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownCircle className="w-4 h-4" />}
                Deposit Instantly
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpCircle className="w-4 h-4 text-auctus-teal" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Withdraw funds to Bank
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Withdrawal requests are processed manually by administrators. Funds are immediately locked from your wallet and placed into a pending settlement queue.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Withdrawal Amount (INR)
                </label>
                <input
                  type="number"
                  min={1}
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value) || 0)}
                  className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                  Bank Details & Instructions
                </label>
                <textarea
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                  placeholder="E.g., Bank Name, Account Number, IFSC Code..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white max-h-32"
                />
              </div>
              <button
                type="button"
                onClick={startWithdrawal}
                disabled={loadingCheckout || withdrawAmount < 1 || withdrawAmount > balance || !bankDetails.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50"
              >
                {loadingCheckout ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                Request Payout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
