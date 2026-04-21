import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet2, CreditCard, ArrowDownRight, ArrowUpRight, Loader2, Building2, History, Banknote } from 'lucide-react'
import { formatINR } from '../lib/currency'
import { apiPost, apiGet } from '../lib/api'
import RazorpayMockModal from '../components/RazorpayMockModal'

export default function Wallet() {
  const navigate = useNavigate()
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  const [balance, setBalance] = useState(0)
  const [amountInr, setAmountInr] = useState('500')
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [banner, setBanner] = useState({ type: '', text: '' })
  
  // Withdrawal states
  const [mode, setMode] = useState('deposit') // 'deposit' or 'withdraw'
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showMockRazorpay, setShowMockRazorpay] = useState(false)
  
  // Payment Method States
  const [depositMethod, setDepositMethod] = useState('upi')
  const [depositUpiId, setDepositUpiId] = useState('')
  
  const [withdrawUpiId, setWithdrawUpiId] = useState('')

  const isValidUpi = (upiId) => {
    return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim());
  }

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
        // ignore
      }
    }
  }, [token])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  const handleDepositSuccess = useCallback(async () => {
    setShowMockRazorpay(false)
    setBanner({ type: '', text: '' })
    setLoadingCheckout(true)
    
    try {
      const { ok, data } = await apiPost('/api/wallet/deposit', { amount: Number(amountInr) }, token)
      
      if (!ok || !data?.success) {
        setBanner({ type: 'err', text: data?.message || 'Could not deposit funds.' })
      } else {
        setBanner({ type: 'ok', text: `Successfully processed deposit of ${formatINR(amountInr)}.` })
        await refreshBalance()
      }
    } catch {
      setBanner({ type: 'err', text: 'Server error processing deposit simulation.' })
    } finally {
      setLoadingCheckout(false)
    }
  }, [amountInr, token, refreshBalance])

  const startPayment = () => {
    setShowMockRazorpay(true)
  }

  const startWithdrawal = async () => {
    setBanner({ type: '', text: '' })
    setLoadingCheckout(true)
    
    const finalBankDetails = 'UPI ID: ' + withdrawUpiId;
    
    try {
      const { ok, data } = await apiPost('/api/wallet/withdraw', { amount: Number(withdrawAmount), bankDetails: finalBankDetails }, token)
      
      if (!ok || !data?.success) {
        setBanner({ type: 'err', text: data?.message || 'Could not request withdrawal.' })
      } else {
        setBanner({ type: 'ok', text: `Withdrawal request for ${formatINR(Number(withdrawAmount))} submitted successfully.` })
        setWithdrawUpiId('')
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A1828] flex items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-auctus-teal" />
      </div>
    )
  }

  const projectedBalance = mode === 'deposit' 
    ? balance + (Number(amountInr) || 0) 
    : Math.max(0, balance - (Number(withdrawAmount) || 0));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A1828] font-sans selection:bg-auctus-teal/30">
      {showMockRazorpay && (
        <RazorpayMockModal 
          amount={amountInr} 
          purpose="Wallet Deposit" 
          onSuccess={handleDepositSuccess}
          onClose={() => setShowMockRazorpay(false)} 
        />
      )}

      {/* Hero Header with Animated Shapes */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#162C46] via-[#0A1828] to-[#0A1828] pb-32 pt-12 border-b border-white/5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-auctus-teal/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[120px] animate-pulse delay-1000"></div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors mb-8 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/60 tracking-tight">
            Financial Hub
          </h1>
          <p className="mt-3 text-sm md:text-base text-white/60 max-w-2xl leading-relaxed">
            Manage your bidding power. Seamlessly add funds via secure Razorpay integrations or request swift payouts to your bank account.
          </p>
        </div>
      </div>

      {/* Main Content Area overlapping the header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 pb-20">
        
        {banner.text && (
          <div className="mb-6 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl ${
              banner.type === 'err' 
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              {banner.type === 'err' ? <Loader2 className="w-5 h-5 shrink-0" /> : <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
              <p className="text-sm font-medium">{banner.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Wallet Card & Quick Stats */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* The Glassmorphism Wallet Card */}
            <div className="relative group perspective-1000">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-auctus-teal to-blue-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-56 rounded-3xl bg-gradient-to-br from-slate-900 to-[#162C46] border border-white/10 p-6 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
                
                {/* Card Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-auctus-teal/20 rounded-full blur-3xl"></div>
                
                <div className="relative flex justify-between items-start">
                  <div>
                    {/* Dynamic amount indicator moved ABOVE */}
                    <div className="h-6 mb-1 flex items-center">
                      {mode === 'deposit' && Number(amountInr) > 0 && (
                        <span className="text-emerald-400 text-sm font-bold animate-in fade-in slide-in-from-left-2 flex items-center gap-1">
                          + ₹{Number(amountInr).toLocaleString('en-IN')}
                        </span>
                      )}
                      {mode === 'withdraw' && Number(withdrawAmount) > 0 && (
                        <span className="text-rose-400 text-sm font-bold animate-in fade-in slide-in-from-left-2 flex items-center gap-1">
                          - ₹{Number(withdrawAmount).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">
                      {mode === 'deposit' && Number(amountInr) > 0 ? 'Projected Balance' : mode === 'withdraw' && Number(withdrawAmount) > 0 ? 'Projected Balance' : 'Current Balance'}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">₹</span>
                      <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 tracking-tight transition-all duration-500">
                        {projectedBalance.toLocaleString('en-IN')}
                      </h2>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                    <Wallet2 className="w-6 h-6 text-auctus-teal" />
                  </div>
                </div>

                <div className="relative flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Virtual ID</p>
                    <p className="text-white/80 font-mono text-sm tracking-widest">
                      AUC • • • • {token ? token.slice(-4).toUpperCase() : '0000'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-red-500/80 mix-blend-screen"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500/80 mix-blend-screen -ml-3"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#162C46]/40 rounded-3xl border border-slate-200 dark:border-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-auctus-teal" />
                Quick Info
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <Banknote className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Bidding Power</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your balance represents your maximum bidding capacity on live auctions.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Secure Withdrawals</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Withdrawal requests lock funds immediately and are processed via NEFT/RTGS securely.</p>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Column: Transaction Controls */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-[#162C46]/40 rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl backdrop-blur-xl overflow-hidden flex flex-col h-full">
              
              {/* Custom Tabs */}
              <div className="flex border-b border-slate-200 dark:border-white/5 p-2 gap-2 bg-slate-50/50 dark:bg-black/20">
                <button
                  onClick={() => setMode('deposit')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                    mode === 'deposit' 
                      ? 'bg-white dark:bg-[#1e3a5f] text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  <ArrowDownRight className={`w-4 h-4 ${mode === 'deposit' ? 'text-emerald-500' : ''}`} />
                  Deposit Funds
                </button>
                <button
                  onClick={() => setMode('withdraw')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                    mode === 'withdraw' 
                      ? 'bg-white dark:bg-[#1e3a5f] text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  <ArrowUpRight className={`w-4 h-4 ${mode === 'withdraw' ? 'text-rose-500' : ''}`} />
                  Withdraw Funds
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-8 flex-1 flex flex-col">
                {mode === 'deposit' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                    <div className="mb-8">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">Add Funds</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Top up your wallet instantly using our secure payment gateway to participate in high-stakes auctions.
                      </p>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Amount to Deposit (INR)
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-500 dark:text-slate-400 sm:text-lg font-medium">₹</span>
                          </div>
                          <input
                            type="number"
                            min={1}
                            value={amountInr}
                            onChange={(e) => {
                              const val = e.target.value.replace(/^0+/, '');
                              setAmountInr(val);
                            }}
                            className="w-full bg-slate-50 dark:bg-[#0A1828] border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal focus:border-transparent transition-all outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[10000, 50000, 100000].map(val => (
                          <button
                            key={val}
                            onClick={() => setAmountInr(String(val))}
                            className="py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/10 hover:border-auctus-teal/50 transition-colors"
                          >
                            + ₹{(val/1000).toFixed(0)}k
                          </button>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                          Payment Method
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <button
                            onClick={() => setDepositMethod('upi')}
                            className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                              depositMethod === 'upi'
                                ? 'bg-auctus-teal/10 border-auctus-teal text-auctus-teal dark:text-emerald-400'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            UPI ID
                          </button>
                          <button
                            onClick={() => setDepositMethod('card')}
                            className={`py-3 rounded-xl border font-semibold text-sm transition-all ${
                              depositMethod === 'card'
                                ? 'bg-auctus-teal/10 border-auctus-teal text-auctus-teal dark:text-emerald-400'
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Credit Card
                          </button>
                        </div>

                        {depositMethod === 'upi' && (
                          <div className="animate-in fade-in slide-in-from-top-2">
                            <input
                              type="text"
                              value={depositUpiId}
                              onChange={(e) => setDepositUpiId(e.target.value)}
                              placeholder="Enter your UPI ID (e.g. user@okicici)"
                              className={`w-full bg-slate-50 dark:bg-[#0A1828] border rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none ${
                                depositUpiId && !isValidUpi(depositUpiId)
                                  ? 'border-red-500/50 focus:ring-red-500'
                                  : 'border-slate-200 dark:border-white/10 focus:ring-auctus-teal'
                              }`}
                            />
                            {depositUpiId && !isValidUpi(depositUpiId) && (
                              <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">Please enter a valid UPI ID (e.g., name@bank)</p>
                            )}
                          </div>
                        )}
                        {depositMethod === 'card' && (
                          <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400 text-xs text-center font-medium">
                            You will enter your card details securely on the next step.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={startPayment}
                        disabled={loadingCheckout || Number(amountInr) < 1 || (depositMethod === 'upi' && !isValidUpi(depositUpiId))}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-auctus-teal to-emerald-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingCheckout ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                        Proceed to Pay
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
                    <div className="mb-8">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">Request Payout</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Transfer your available balance back to your registered bank account.
                      </p>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Withdrawal Amount
                          </label>
                          <button 
                            onClick={() => setWithdrawAmount(String(balance))}
                            className="text-xs font-bold text-auctus-teal hover:text-emerald-400 uppercase"
                          >
                            Max: {formatINR(balance)}
                          </button>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-slate-500 dark:text-slate-400 sm:text-lg font-medium">₹</span>
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={balance}
                            value={withdrawAmount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/^0+/, '');
                              if (Number(val) > balance) {
                                setWithdrawAmount(String(balance));
                              } else {
                                setWithdrawAmount(val);
                              }
                            }}
                            className="w-full bg-slate-50 dark:bg-[#0A1828] border border-slate-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-4 text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                          Receive Funds Via
                        </label>
                        <div className="grid grid-cols-1 gap-3 mb-4">
                          <div className="py-3 px-4 rounded-xl border bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-semibold text-sm text-center">
                            UPI Verification
                          </div>
                        </div>

                        <div className="animate-in fade-in slide-in-from-top-2">
                          <input
                            type="text"
                            value={withdrawUpiId}
                            onChange={(e) => setWithdrawUpiId(e.target.value)}
                            placeholder="Enter UPI ID to receive funds (e.g. user@okicici)"
                            className={`w-full bg-slate-50 dark:bg-[#0A1828] border rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:border-transparent transition-all outline-none ${
                              withdrawUpiId && !isValidUpi(withdrawUpiId)
                                ? 'border-red-500/50 focus:ring-red-500'
                                : 'border-slate-200 dark:border-white/10 focus:ring-rose-500'
                            }`}
                          />
                          {withdrawUpiId && !isValidUpi(withdrawUpiId) && (
                            <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">Please enter a valid UPI ID (e.g., name@bank)</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/5">
                      <button
                        type="button"
                        onClick={startWithdrawal}
                        disabled={
                          loadingCheckout || 
                          Number(withdrawAmount) < 1 || 
                          Number(withdrawAmount) > balance || 
                          !isValidUpi(withdrawUpiId)
                        }
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-lg hover:shadow-lg hover:shadow-rose-500/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {loadingCheckout ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                        Submit Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
