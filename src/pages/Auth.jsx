import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom'
import {
  Shield, Lock, UploadCloud, ChevronRight, Handshake, User, Store, Eye, EyeOff, Gavel
} from 'lucide-react'
import { apiPost, persistSession } from '../lib/api.js'
import { gstinMatchesPan } from '../lib/gstinPan.js'

const AUTH_FLASH_KEY = 'auctusAuthFlash'

function resolvePostLoginPath(data, nextParam) {
  const safeNext =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : null
  return safeNext || data?.redirectTo || '/dashboard'
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const nextAfterAuth = searchParams.get('next') || ''

  const [isLogin, setIsLogin] = useState(true)
  const [accountType, setAccountType] = useState('bidder')

  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  const [otpStep, setOtpStep] = useState(false)
  const [registrationOtp, setRegistrationOtp] = useState('')
  const [pendingRegEmail, setPendingRegEmail] = useState('')

  const [regFirst, setRegFirst] = useState('')
  const [regLast, setRegLast] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    let timer
    if (resendCooldown > 0 && otpStep) {
      timer = setInterval(() => {
        setResendCooldown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [resendCooldown, otpStep])

  const loginFormRef = useRef(null)
  const registerFormRef = useRef(null)

  // Seller onboarding fields (GST/PAN/Bank docs)
  const [regBusinessPhone, setRegBusinessPhone] = useState('')
  const [regGstin, setRegGstin] = useState('')
  const [regBizName, setRegBizName] = useState('')
  const [regPanNumber, setRegPanNumber] = useState('')
  const [regBusinessAddress, setRegBusinessAddress] = useState('')

  const [regSellerDocs, setRegSellerDocs] = useState({
    gstCertificateDataUrl: '',
    panCertificateDataUrl: '',
    bankProofDataUrl: ''
  })

  useEffect(() => {
    if (searchParams.get('reason') === 'notify') {
      setInfo('Sign in to get notified when this auction goes live.')
    }
  }, [searchParams])

  useEffect(() => {
    if (location.state?.forgotPasswordOk) {
      setInfo('Password reset successful. Sign in with your new password.')
      const q = searchParams.toString()
      navigate(q ? `/auth?${q}` : '/auth', { replace: true })
    }
  }, [location.state?.forgotPasswordOk, navigate, searchParams])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { ok, status, data } = await apiPost('/api/auth/login', {
        email: loginEmail.trim(),
        password: loginPassword
      })

      if (status === 404 && data?.code === 'ACCOUNT_NOT_FOUND') {
        setError('No account found for this email.')
        setIsLogin(false)
        setRegEmail(loginEmail.trim())
        setLoading(false)
        return
      }

      if (!ok || !data?.success) {
        setError(data?.message || 'Login failed. Check your email and password.')
        setLoading(false)
        return
      }

      const { user, tokens, redirectTo } = data.data
      persistSession({ user, tokens })
      const target = resolvePostLoginPath({ redirectTo }, nextAfterAuth)
      // Hard navigation ensures guards see fresh localStorage immediately.
      window.location.replace(target)
    } catch (err) {
      setError('Cannot reach server. Is the API running on port 5000?')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const name = `${regFirst.trim()} ${regLast.trim()}`.trim()
      const registerPayload = {
        name,
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
        role: accountType === 'seller' ? 'seller' : 'user'
      }

      if (regBusinessPhone.trim()) registerPayload.phone = regBusinessPhone.trim()

      if (accountType === 'seller') {
        const missing = []
        if (!regBizName.trim()) missing.push('Company name')
        if (!regGstin.trim()) missing.push('GSTIN')
        if (!regPanNumber.trim()) missing.push('PAN number')
        if (!regSellerDocs.gstCertificateDataUrl) missing.push('GST certificate')
        if (!regSellerDocs.panCertificateDataUrl) missing.push('PAN card')
        if (!regSellerDocs.bankProofDataUrl) missing.push('Bank proof')
        if (missing.length) {
          setError(`Please provide: ${missing.join(', ')}`)
          setLoading(false)
          return
        }

        const normalizedPan = regPanNumber.trim().toUpperCase()
        const normalizedGstin = regGstin.trim().toUpperCase()
        if (!PAN_REGEX.test(normalizedPan)) {
          setError('PAN format is invalid. Use format: ABCDE1234F')
          setLoading(false)
          return
        }
        if (!GSTIN_REGEX.test(normalizedGstin)) {
          setError('GSTIN format is invalid')
          setLoading(false)
          return
        }
        if (!gstinMatchesPan(normalizedGstin, normalizedPan)) {
          setError(
            'GSTIN must embed your PAN after the 2-digit state code (e.g. 24 + AAPFC5450P + 1ZY).'
          )
          setLoading(false)
          return
        }

        registerPayload.businessName = regBizName.trim()
        registerPayload.gstin = normalizedGstin
        registerPayload.panNumber = normalizedPan
        registerPayload.businessAddress = regBusinessAddress ? String(regBusinessAddress) : ''

        registerPayload.gstCertificateDataUrl = regSellerDocs.gstCertificateDataUrl
        registerPayload.panCertificateDataUrl = regSellerDocs.panCertificateDataUrl
        registerPayload.bankProofDataUrl = regSellerDocs.bankProofDataUrl
      }

      const { ok, status, data } = await apiPost('/api/auth/register', registerPayload)

      if (!ok || !data?.success) {
        if (
          accountType === 'seller' &&
          status === 409 &&
          data?.code === 'SELLER_APPLICATION_IN_PROGRESS'
        ) {
          try {
            sessionStorage.setItem(
              AUTH_FLASH_KEY,
              JSON.stringify({
                type: 'info',
                message:
                  'This email already has a seller application in progress. The admin will email you when there is an update — you do not need to register again.'
              })
            )
          } catch {
            /* ignore */
          }
          navigate('/', { replace: true })
          return
        }
        if (accountType === 'seller' && status === 409 && data?.code === 'EMAIL_ALREADY_REGISTERED') {
          try {
            sessionStorage.setItem(
              AUTH_FLASH_KEY,
              JSON.stringify({
                type: 'info',
                message: 'This email is already registered. Please sign in with the Log In tab.'
              })
            )
          } catch {
            /* ignore */
          }
          navigate('/', { replace: true })
          return
        }
        const msg =
          data?.errors?.[0]?.msg ||
          data?.message ||
          'Registration failed.'
        setError(msg)
        setLoading(false)
        return
      }

      // Seller registration only submits documents for admin review (no account yet).
      if (accountType === 'seller' && data?.data?.pendingReview) {
        try {
          sessionStorage.setItem(
            AUTH_FLASH_KEY,
            JSON.stringify({
              type: 'success',
              message:
                'Thanks! Your application is with the admin. You will be notified by email when it is reviewed.'
            })
          )
        } catch {
          /* ignore */
        }
        navigate('/', { replace: true })
        return
      }

      // If requires OTP for user registration
      if (data?.data?.requiresOtp) {
        setPendingRegEmail(data.data.email || regEmail.trim().toLowerCase())
        setOtpStep(true)
        setResendCooldown(10) // start 10s cooldown
        setInfo('OTP sent to your email. Please enter it below.')
        return
      }

      const { user, tokens, redirectTo } = data.data
      persistSession({ user, tokens })
      navigate(resolvePostLoginPath({ redirectTo }, nextAfterAuth), { replace: true })
    } catch (err) {
      setError('Cannot reach server. Is the API running on port 5000?')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { ok, data } = await apiPost('/api/auth/verify-registration', {
        email: pendingRegEmail,
        otp: registrationOtp
      })

      if (!ok || !data?.success) {
        setError(data?.message || 'Invalid OTP.')
        setLoading(false)
        return
      }

      const { user, tokens, redirectTo } = data.data
      persistSession({ user, tokens })
      window.location.replace(resolvePostLoginPath({ redirectTo }, nextAfterAuth))
    } catch (err) {
      setError('Cannot reach server.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const { ok, status, data } = await apiPost('/api/auth/resend-registration-otp', {
        email: pendingRegEmail
      })
      if (!ok || !data?.success) {
        if (status === 429) {
          setError(data?.message || 'Too many OTP requests. Try again later.')
        } else {
          setError(data?.message || 'Failed to resend OTP.')
        }
      } else {
        setInfo('OTP resent to your email.')
        setResendCooldown(10)
      }
    } catch (err) {
      setError('Cannot reach server.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSellerDocChange(e, key) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await readFileAsDataUrl(file)
      setRegSellerDocs((prev) => ({ ...prev, [key]: dataUrl }))
    } catch {
      setError('Could not read selected file')
    }
  }

  const handlePrimaryAction = () => {
    if (otpStep) {
      return // handeled by the form directly
    }
    if (isLogin) {
      loginFormRef.current?.requestSubmit()
    } else {
      registerFormRef.current?.requestSubmit()
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans dark:bg-slate-900 bg-slate-50 transition-colors duration-500 relative overflow-hidden">

      <div className="w-full md:w-[45%] lg:w-1/2 relative overflow-hidden flex flex-col justify-between p-8 lg:p-12 bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] text-white shadow-[10px_0_30px_rgba(30,58,95,0.3)] z-20">

        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-auctus-teal/60 rounded-full mix-blend-color-dodge filter blur-[120px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-20%] w-[600px] h-[600px] bg-auctus-cyan/40 rounded-full mix-blend-color-dodge filter blur-[140px] opacity-60 animate-blob" style={{ animationDelay: '3000ms' }}></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#3b82f6]/50 rounded-full mix-blend-color-dodge filter blur-[120px] opacity-50 animate-blob" style={{ animationDelay: '5000ms' }}></div>
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

        <div className="relative z-10 animate-fade-up">
          <LinkBrand />
          <h2 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.15] mb-6 drop-shadow-xl text-white tracking-tight">
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-auctus-cyan to-auctus-teal">Bidding</span> Experience.
          </h2>
          <p className="text-lg text-white/80 max-w-md font-medium leading-relaxed drop-shadow-sm">
            The premium auction management system designed for seamless seller onboarding, real-time bids, and elite security.
          </p>
        </div>

        <div className="relative z-10 space-y-4 mt-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-4 text-white/95 bg-white/5 hover:bg-white/10 transition-all p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="bg-auctus-teal/20 p-3 rounded-xl border border-auctus-teal/30 flex-shrink-0 shadow-inner">
              <Shield className="text-auctus-cyan drop-shadow-glow" size={24} />
            </div>
            <span className="font-bold tracking-wide text-sm md:text-base drop-shadow-sm">Trusted globally by elite auctioneers</span>
          </div>
          <div className="flex items-center gap-4 text-white/95 bg-white/5 hover:bg-white/10 transition-all p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="bg-auctus-cyan/20 p-3 rounded-xl border border-auctus-cyan/30 flex-shrink-0 shadow-inner">
              <Handshake className="text-auctus-cyan drop-shadow-glow" size={24} />
            </div>
            <span className="font-bold tracking-wide text-sm md:text-base drop-shadow-sm">Verified Sellers & Secure Transactions</span>
          </div>
        </div>
      </div>

      <div className="w-full md:w-[55%] lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative dark:bg-slate-900 bg-slate-50 transition-colors z-10">

        <div className="absolute -top-32 right-0 w-3/4 h-3/4 bg-auctus-teal/5 filter blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-2xl p-8 lg:p-10 relative z-10 animate-fade-up flex flex-col max-h-[90vh]" style={{ animationDelay: '100ms' }}>

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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 flex-shrink-0">
            <h3 className="text-3xl font-extrabold dark:text-white text-slate-800 tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>

            <div className="flex bg-slate-200/50 dark:bg-slate-900/50 p-1.5 rounded-xl border border-slate-300/30 dark:border-white/5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); setInfo('') }}
                className={`text-sm py-2 px-5 rounded-lg font-bold transition-all duration-300 ${isLogin ? 'bg-white dark:bg-slate-700 shadow flex-1 text-auctus-navy dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 opacity-80'}`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); setInfo('') }}
                className={`text-sm py-2 px-5 rounded-lg font-bold transition-all duration-300 ${!isLogin ? 'bg-white dark:bg-slate-700 shadow flex-1 text-auctus-navy dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 opacity-80'}`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="relative overflow-y-auto overflow-x-hidden pr-2 flex-grow custom-scrollbar">

            {otpStep && (
              <div className={`transition-all duration-500 ease-in-out opacity-100 translate-x-0 relative z-10`}>
                <form className="space-y-6" onSubmit={handleVerifyOtp}>
                  <div className="relative group">
                    <input
                      type="text"
                      id="otp"
                      maxLength={4}
                      value={registrationOtp}
                      onChange={(e) => setRegistrationOtp(e.target.value.replace(/\D/g, ''))}
                      className="peer w-full px-5 pt-8 pb-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm tracking-[1em] font-mono text-center text-xl"
                      placeholder=" "
                      required
                    />
                    <label htmlFor="otp" className="absolute left-5 top-5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-3 peer-focus:text-xs peer-focus:text-auctus-teal">4-Digit OTP</label>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || registrationOtp.length !== 4}
                    className="w-full py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-auctus-teal via-[#128a83] to-auctus-cyan shadow-lg shadow-auctus-teal/20 hover:shadow-glow-hover transform hover:-translate-y-1 active:scale-95 transition-all duration-300 flex justify-center items-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
                  >
                    <span className="text-[15px] tracking-wide">{loading ? 'Verifying...' : 'Verify Email'}</span>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex justify-between items-center px-1">
                    <button 
                      type="button" 
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0 || loading}
                      className="text-sm font-bold text-auctus-teal hover:underline disabled:opacity-50 disabled:no-underline transition-all"
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                    <button type="button" onClick={() => setOtpStep(false)} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white font-bold transition-all">
                      Cancel & Go Back
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className={`transition-all duration-500 ease-in-out ${isLogin && !otpStep ? 'opacity-100 translate-x-0 relative z-10' : 'opacity-0 translate-x-10 absolute inset-0 pointer-events-none'}`}>
              <form ref={loginFormRef} className="space-y-6" onSubmit={handleLogin}>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="peer w-full px-5 pt-8 pb-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm"
                    placeholder=" "
                    required
                  />
                  <label htmlFor="email" className="absolute left-5 top-5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-3 peer-focus:text-xs peer-focus:text-auctus-teal">Email Address</label>
                </div>

                <div className="relative group">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="peer w-full px-5 pt-8 pb-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm pr-12"
                    placeholder=" "
                    required
                  />
                  <label htmlFor="password" className="absolute left-5 top-5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:top-5 peer-focus:top-3 peer-focus:text-xs peer-focus:text-auctus-teal right-12">Password</label>
                  <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-5 top-5 text-slate-400 hover:text-auctus-teal transition-colors">
                    {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="flex justify-end items-center text-sm px-1">
                  <Link
                    to={nextAfterAuth ? `/auth/forgot-password?next=${encodeURIComponent(nextAfterAuth)}` : '/auth/forgot-password'}
                    className="text-auctus-teal font-bold hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </form>
            </div>

            <div className={`transition-all duration-500 ease-in-out ${!isLogin && !otpStep ? 'opacity-100 translate-x-0 relative z-10' : 'opacity-0 -translate-x-10 absolute inset-0 pointer-events-none'}`}>
              <form ref={registerFormRef} className="space-y-6" onSubmit={handleRegister}>

                <div className="flex gap-4 mb-2">
                  <button
                    type="button"
                    onClick={() => setAccountType('bidder')}
                    className={`flex-1 py-4 px-2 rounded-2xl font-bold flex flex-col items-center justify-center border-2 transition-all duration-300 group ${accountType === 'bidder' ? 'border-auctus-teal bg-auctus-teal/10 text-auctus-teal dark:text-auctus-cyan shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-auctus-teal/40 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <User size={26} className={`mb-2 ${accountType === 'bidder' ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
                    <span>I want to Bid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('seller')}
                    className={`flex-1 py-4 px-2 rounded-2xl font-bold flex flex-col items-center justify-center border-2 transition-all duration-300 group ${accountType === 'seller' ? 'border-auctus-teal bg-auctus-teal/10 text-auctus-teal dark:text-auctus-cyan shadow-md' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-auctus-teal/40 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <Store size={26} className={`mb-2 ${accountType === 'seller' ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}`} />
                    <span>I want to Sell</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input type="text" id="fname" value={regFirst} onChange={(e) => setRegFirst(e.target.value)} className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm" placeholder=" " required />
                    <label htmlFor="fname" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">First Name</label>
                  </div>
                  <div className="relative">
                    <input type="text" id="lname" value={regLast} onChange={(e) => setRegLast(e.target.value)} className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm" placeholder=" " required />
                    <label htmlFor="lname" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">Last Name</label>
                  </div>
                </div>

                <div className="relative">
                  <input type="email" id="regEmail" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm" placeholder=" " required />
                  <label htmlFor="regEmail" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">Email Address</label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input type={showRegPassword ? 'text' : 'password'} id="regPassword" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm pr-11" placeholder=" " required />
                    <label htmlFor="regPassword" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-10 truncate">Password</label>
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-auctus-teal transition-colors">
                      {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPw" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)} className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm pr-11" placeholder=" " required />
                    <label htmlFor="confirmPw" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-10 truncate">Confirm</label>
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-slate-400 hover:text-auctus-teal transition-colors">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={`space-y-6 overflow-hidden transition-all duration-500 origin-top ${accountType === 'seller' ? 'max-h-[800px] opacity-100 mt-6' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Business Details</span>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                  </div>

                  <div className="relative">
                    <input
                      type="tel"
                      id="rPhone"
                      value={regBusinessPhone}
                      onChange={(e) => setRegBusinessPhone(e.target.value)}
                      className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm"
                      placeholder=" "
                    />
                    <label htmlFor="rPhone" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">Business Phone</label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        id="gstin"
                        value={regGstin}
                        onChange={(e) => setRegGstin(e.target.value)}
                        className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm"
                        placeholder=" "
                      />
                      <label htmlFor="gstin" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">GSTIN</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        id="bizName"
                        value={regBizName}
                        onChange={(e) => setRegBizName(e.target.value)}
                        className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm"
                        placeholder=" "
                      />
                      <label htmlFor="bizName" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">Company Name</label>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2">
                    GSTIN must contain your PAN in positions 3–12 (e.g. PAN <span className="font-mono">AAPFC5450P</span> →{' '}
                    <span className="font-mono">24AAPFC5450P1ZY</span>).
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        id="panNumber"
                        value={regPanNumber}
                        onChange={(e) => setRegPanNumber(e.target.value)}
                        className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm"
                        placeholder=" "
                      />
                      <label htmlFor="panNumber" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">PAN Number</label>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        id="businessAddress"
                        value={regBusinessAddress}
                        onChange={(e) => setRegBusinessAddress(e.target.value)}
                        className="peer w-full px-5 pt-7 pb-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 text-slate-900 dark:text-white transition-all shadow-sm"
                        placeholder=" "
                      />
                      <label htmlFor="businessAddress" className="absolute left-5 top-4.5 text-slate-400 font-medium transition-all duration-300 peer-placeholder-shown:text-[15px] peer-placeholder-shown:top-4 peer-focus:top-2 peer-focus:text-xs peer-focus:text-auctus-teal right-2 truncate">Business Address</label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-auctus-teal/60 dark:hover:border-auctus-teal/60 rounded-2xl p-6 text-center bg-white dark:bg-slate-800 hover:bg-auctus-teal/5 transition-all cursor-pointer group flex flex-col items-center justify-center">
                      <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl shadow-sm mb-3 group-hover:-translate-y-1 transition-transform border border-slate-200 dark:border-slate-700">
                        <UploadCloud className="text-auctus-teal" size={24} />
                      </div>
                      <p className="text-sm dark:text-slate-200 text-slate-700 font-bold">Upload GST Certificate</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">PDF / Image / Word</p>
                      {regSellerDocs.gstCertificateDataUrl ? (
                        <p className="text-[11px] mt-2 font-bold text-emerald-500">Selected</p>
                      ) : null}
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleSellerDocChange(e, 'gstCertificateDataUrl')}
                      />
                    </div>

                    <div className="relative overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-auctus-teal/60 dark:hover:border-auctus-teal/60 rounded-2xl p-6 text-center bg-white dark:bg-slate-800 hover:bg-auctus-teal/5 transition-all cursor-pointer group flex flex-col items-center justify-center">
                      <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl shadow-sm mb-3 group-hover:-translate-y-1 transition-transform border border-slate-200 dark:border-slate-700">
                        <UploadCloud className="text-auctus-teal" size={24} />
                      </div>
                      <p className="text-sm dark:text-slate-200 text-slate-700 font-bold">Upload PAN Card</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">PDF / Image / Word</p>
                      {regSellerDocs.panCertificateDataUrl ? (
                        <p className="text-[11px] mt-2 font-bold text-emerald-500">Selected</p>
                      ) : null}
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleSellerDocChange(e, 'panCertificateDataUrl')}
                      />
                    </div>

                    <div className="relative overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-auctus-teal/60 dark:hover:border-auctus-teal/60 rounded-2xl p-6 text-center bg-white dark:bg-slate-800 hover:bg-auctus-teal/5 transition-all cursor-pointer group flex flex-col items-center justify-center">
                      <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-xl shadow-sm mb-3 group-hover:-translate-y-1 transition-transform border border-slate-200 dark:border-slate-700">
                        <UploadCloud className="text-auctus-teal" size={24} />
                      </div>
                      <p className="text-sm dark:text-slate-200 text-slate-700 font-bold">Upload Bank Proof</p>
                      <p className="text-xs text-slate-500 font-medium mt-1">PDF / Image / Word</p>
                      {regSellerDocs.bankProofDataUrl ? (
                        <p className="text-[11px] mt-2 font-bold text-emerald-500">Selected</p>
                      ) : null}
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleSellerDocChange(e, 'bankProofDataUrl')}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {!otpStep && (
            <div className="mt-6 flex-shrink-0 relative z-20 bg-white/5 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handlePrimaryAction}
                className="w-full py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-auctus-teal via-[#128a83] to-auctus-cyan shadow-lg shadow-auctus-teal/20 hover:shadow-glow-hover transform hover:-translate-y-1 active:scale-95 transition-all duration-300 flex justify-center items-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
              >
                <span className="text-[15px] tracking-wide">
                  {loading ? 'Please wait…' : isLogin ? 'Sign In Securely' : (accountType === 'bidder' ? 'Create Bidder Account' : 'Register Web Seller')}
                </span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex justify-center flex-col items-center gap-1 mt-5 pb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide">
                <div className="flex items-center gap-1.5 opacity-80">
                  <Lock size={13} className="text-auctus-cyan" />
                  <span>Secure session with your MongoDB-backed account</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LinkBrand() {
  return (
    <div className="mb-10 flex items-center gap-3">
      <Link to="/" className="text-3xl lg:text-4xl font-black text-white tracking-widest uppercase hover:text-auctus-cyan transition-colors">
        Auctus.
      </Link>
    </div>
  )
}
