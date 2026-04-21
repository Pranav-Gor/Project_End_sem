import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Handshake,
  Lock,
  ChevronRight,
  Gavel,
  Eye,
  EyeOff,
  ArrowLeft,
  Shield
} from 'lucide-react'
import { apiPost } from '../lib/api.js'

function LinkBrand() {
  return (
    <div className="mb-10 flex items-center gap-3">
      <Link to="/" className="text-3xl lg:text-4xl font-black text-white tracking-widest uppercase hover:text-auctus-cyan transition-colors">
        Auctus.
      </Link>
    </div>
  )
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextAfterAuth = searchParams.get('next') || ''
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const emailNorm = email.trim().toLowerCase()

  async function handleSendOtp(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!emailNorm) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    try {
      const { ok, status, data } = await apiPost('/api/auth/forgot-password/request', {
        email: emailNorm
      })
      if (status === 503 && data?.code === 'SMTP_NOT_CONFIGURED') {
        setError(
          data?.message ||
            'Email is not configured on the server. Add SMTP_USER and SMTP_PASS to backend/.env, then restart the API.'
        )
        return
      }
      if (!ok || !data?.success) {
        setError(data?.message || 'Could not send the verification code.')
        return
      }
      setInfo('If this email is registered, we sent a 4-digit code. It expires in 3 minutes.')
      setStep('reset')
    } catch {
      setError('Cannot reach server. Is the API running on port 5000?')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    if (!/^\d{4}$/.test(otp.trim())) {
      setError('Enter the 4-digit code from your email.')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }
    setLoading(true)
    try {
      const { ok, data } = await apiPost('/api/auth/forgot-password/confirm', {
        email: emailNorm,
        otp: otp.trim(),
        newPassword
      })
      if (!ok || !data?.success) {
        setError(data?.message || 'Could not reset password.')
        return
      }
      const authPath =
        nextAfterAuth && nextAfterAuth.startsWith('/') && !nextAfterAuth.startsWith('//')
          ? `/auth?next=${encodeURIComponent(nextAfterAuth)}`
          : '/auth'
      navigate(authPath, {
        replace: true,
        state: { forgotPasswordOk: true }
      })
    } catch {
      setError('Cannot reach server. Is the API running on port 5000?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans dark:bg-slate-900 bg-slate-50 transition-colors duration-500 relative overflow-hidden">
      <div className="w-full md:w-[45%] lg:w-1/2 relative overflow-hidden flex flex-col justify-between p-8 lg:p-12 bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] text-white shadow-[10px_0_30px_rgba(30,58,95,0.3)] z-20">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-auctus-teal/60 rounded-full mix-blend-color-dodge filter blur-[120px] opacity-70 animate-blob" />
        <div
          className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] bg-auctus-cyan/40 rounded-full mix-blend-color-dodge filter blur-[140px] opacity-60 animate-blob"
          style={{ animationDelay: '3000ms' }}
        />
        <div
          className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#3b82f6]/50 rounded-full mix-blend-color-dodge filter blur-[120px] opacity-50 animate-blob"
          style={{ animationDelay: '5000ms' }}
        />
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

        <div className="relative z-10 animate-fade-up">
          <LinkBrand />
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.15] mb-6 drop-shadow-xl text-white tracking-tight">
            Reset your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-auctus-cyan to-auctus-teal">
              password
            </span>{' '}
            securely.
          </h2>
          <p className="text-lg text-white/80 max-w-md font-medium leading-relaxed drop-shadow-sm">
            We will email you a 4-digit code. It expires in 3 minutes. Use it once to set a new password.
          </p>
        </div>

        <div className="relative z-10 space-y-4 mt-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-4 text-white/95 bg-white/5 hover:bg-white/10 transition-all p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="bg-auctus-teal/20 p-3 rounded-xl border border-auctus-teal/30 flex-shrink-0 shadow-inner">
              <Lock className="text-auctus-cyan drop-shadow-glow" size={24} />
            </div>
            <span className="font-bold tracking-wide text-sm md:text-base drop-shadow-sm">
              OTP valid for 3 minutes only
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/95 bg-white/5 hover:bg-white/10 transition-all p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="bg-auctus-cyan/20 p-3 rounded-xl border border-auctus-cyan/30 flex-shrink-0 shadow-inner">
              <Handshake className="text-auctus-cyan drop-shadow-glow" size={24} />
            </div>
            <span className="font-bold tracking-wide text-sm md:text-base drop-shadow-sm">
              Same trusted security as sign-in
            </span>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[55%] lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative dark:bg-slate-900 bg-slate-50 transition-colors z-10">
        <div className="absolute -top-32 right-0 w-3/4 h-3/4 bg-auctus-teal/5 filter blur-[120px] rounded-full pointer-events-none" />

        <div
          className="w-full max-w-xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-2xl p-8 lg:p-10 relative z-10 animate-fade-up flex flex-col max-h-[90vh]"
          style={{ animationDelay: '100ms' }}
        >
          <Link
            to={
              nextAfterAuth && nextAfterAuth.startsWith('/') && !nextAfterAuth.startsWith('//')
                ? `/auth?next=${encodeURIComponent(nextAfterAuth)}`
                : '/auth'
            }
            className="inline-flex items-center gap-2 text-sm font-bold text-auctus-teal hover:underline mb-6"
          >
            <ArrowLeft size={18} />
            Back to sign in
          </Link>

          {(error || info) && (
            <div
              className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
                error
                  ? 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                  : 'bg-auctus-teal/10 text-auctus-navy dark:text-auctus-cyan border border-auctus-teal/20'
              }`}
            >
              {error || info}
            </div>
          )}

          <div className="flex items-center justify-between mb-8 gap-4 flex-shrink-0">
            <h3 className="text-3xl font-extrabold dark:text-white text-slate-800 tracking-tight">
              Forgot password
            </h3>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Shield size={16} className="text-auctus-teal" />
              {step === 'email' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-hidden pr-2 flex-grow custom-scrollbar">
            {step === 'email' ? (
              <form className="space-y-6 flex flex-col min-h-0" onSubmit={handleSendOtp}>
                <div className="relative group">
                  <input
                    type="email"
                    id="fp-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="peer w-full px-5 pt-8 pb-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm"
                    placeholder=" "
                    required
                    autoComplete="email"
                  />
                  <label
                    htmlFor="fp-email"
                    className="absolute left-5 top-5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-3 peer-focus:text-xs peer-focus:text-auctus-teal"
                  >
                    Email address
                  </label>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  We only send a code if this email is registered. Check spam if you do not see it within a minute.
                </p>
                <div className="mt-6 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-auctus-teal via-[#128a83] to-auctus-cyan shadow-lg shadow-auctus-teal/20 hover:shadow-glow-hover transform hover:-translate-y-1 active:scale-95 transition-all duration-300 flex justify-center items-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <span className="text-[15px] tracking-wide">
                      {loading ? 'Please wait…' : 'Send verification code'}
                    </span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-6 flex flex-col min-h-0" onSubmit={handleReset}>
                <div className="relative group">
                  <input
                    type="email"
                    id="fp-email-readonly"
                    value={email}
                    readOnly
                    className="peer w-full px-5 pt-8 pb-3 bg-slate-100 dark:bg-slate-900/30 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-300 text-sm cursor-not-allowed"
                    placeholder=" "
                  />
                  <label
                    htmlFor="fp-email-readonly"
                    className="absolute left-5 top-5 text-slate-400 font-medium text-xs"
                  >
                    Email
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    id="fp-otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="peer w-full px-5 pt-8 pb-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm tracking-[0.4em] font-mono text-lg"
                    placeholder=" "
                    required
                    autoComplete="one-time-code"
                  />
                  <label
                    htmlFor="fp-otp"
                    className="absolute left-5 top-5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-3 peer-focus:text-xs peer-focus:text-auctus-teal"
                  >
                    4-digit code
                  </label>
                </div>

                <div className="relative group">
                  <input
                    type={showPw ? 'text' : 'password'}
                    id="fp-new"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="peer w-full px-5 pt-8 pb-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm pr-12"
                    placeholder=" "
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <label
                    htmlFor="fp-new"
                    className="absolute left-5 top-5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-3 peer-focus:text-xs peer-focus:text-auctus-teal right-12"
                  >
                    New password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-5 top-5 text-slate-400 hover:text-auctus-teal transition-colors"
                  >
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative group">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="fp-confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="peer w-full px-5 pt-8 pb-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm pr-12"
                    placeholder=" "
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <label
                    htmlFor="fp-confirm"
                    className="absolute left-5 top-5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-3 peer-focus:text-xs peer-focus:text-auctus-teal right-12"
                  >
                    Confirm password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-5 top-5 text-slate-400 hover:text-auctus-teal transition-colors"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <button
                  type="button"
                  className="text-sm font-bold text-auctus-teal hover:underline"
                  onClick={() => {
                    setStep('email')
                    setOtp('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setError('')
                    setInfo('')
                  }}
                >
                  Use a different email
                </button>
                <div className="mt-2 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-auctus-teal via-[#128a83] to-auctus-cyan shadow-lg shadow-auctus-teal/20 hover:shadow-glow-hover transform hover:-translate-y-1 active:scale-95 transition-all duration-300 flex justify-center items-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <span className="text-[15px] tracking-wide">
                      {loading ? 'Please wait…' : 'Reset password'}
                    </span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
