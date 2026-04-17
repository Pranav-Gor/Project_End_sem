import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, User, Mail, Phone, MapPin, Shield, Camera, Loader2, CheckCircle2, AlertCircle
} from 'lucide-react'
import { readSessionUser } from '../hooks/useSessionUser'
import { apiPut } from '../lib/api'

function fileToJpegDataUrl(file, maxSide = 512, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      const scale = Math.min(1, maxSide / Math.max(width, height))
      width = Math.round(width * scale)
      height = Math.round(height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Invalid image'))
    }
    img.src = url
  })
}

export default function UserProfile() {
  const fileRef = useRef(null)
  const [user, setUser] = useState(() => readSessionUser())
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('India')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const u = readSessionUser()
    setUser(u)
    if (!u) return
    setName(u.name || '')
    setPhone(u.profile?.phone || '')
    setStreet(u.profile?.address?.street || '')
    setCity(u.profile?.address?.city || '')
    setState(u.profile?.address?.state || '')
    setZipCode(u.profile?.address?.zipCode || '')
    setCountry(u.profile?.address?.country || 'India')
    setAvatar(u.profile?.avatar || '')
  }, [])

  const pickPhoto = () => fileRef.current?.click()

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f?.type?.startsWith('image/')) return
    setCompressing(true)
    setMessage(null)
    try {
      const dataUrl = await fileToJpegDataUrl(f)
      if (dataUrl.length > 480000) {
        setMessage({ type: 'err', text: 'Image is still too large after resize. Try a smaller photo.' })
        return
      }
      setAvatar(dataUrl)
    } catch {
      setMessage({ type: 'err', text: 'Could not read that image.' })
    } finally {
      setCompressing(false)
    }
  }

  const clearPhoto = () => {
    setAvatar('')
    setMessage(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setMessage({ type: 'err', text: 'Please sign in to save your profile.' })
      return
    }
    if (!name.trim() || name.trim().length < 2) {
      setMessage({ type: 'err', text: 'Name must be at least 2 characters.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const body = {
      name: name.trim(),
      phone: phone.trim() || null,
      avatar: avatar || null,
      address: {
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        country: country.trim() || 'India'
      }
    }

    const { ok, data } = await apiPut('/api/auth/profile', body, token)
    setSaving(false)

    if (ok && data?.data?.user) {
      const prev = readSessionUser() || {}
      const u = data.data.user
      const merged = {
        ...prev,
        ...u,
        profile: { ...prev.profile, ...u.profile }
      }
      localStorage.setItem('user', JSON.stringify(merged))
      setUser(merged)
      window.dispatchEvent(new Event('auctus-auth'))
      setMessage({ type: 'ok', text: 'Profile saved successfully.' })
    } else {
      const errText =
        data?.errors?.[0]?.msg ||
        data?.message ||
        'Could not save profile. Check your connection and try again.'
      setMessage({ type: 'err', text: errText })
    }
  }

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Profile
          </h1>
          <p className="mt-2 text-sm text-white/70 max-w-xl">
            Update your photo, contact details, and address. Changes sync to your account and dashboard.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {!user && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
            You are not signed in.{' '}
            <Link to="/auth" className="font-bold underline">
              Sign in
            </Link>{' '}
            to load and save your profile.
          </div>
        )}

        {message && (
          <div
            className={`rounded-2xl p-4 flex items-start gap-3 text-sm ${
              message.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/40'
                : 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200 border border-red-200 dark:border-red-900/40'
            }`}
          >
            {message.type === 'ok' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-6">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Camera className="w-4 h-4 text-auctus-teal" />
              Photo
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white text-3xl font-black ring-4 ring-slate-100 dark:ring-slate-700">
                {avatar ? (
                  <img src={avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
                {(compressing || saving) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={onFile}
                />
                <button
                  type="button"
                  onClick={pickPhoto}
                  disabled={compressing || saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-auctus-teal text-white text-sm font-semibold hover:opacity-95 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  Upload photo
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              JPEG, PNG, or WebP. We resize automatically to keep uploads fast.
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-auctus-teal" />
              Basic details
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Full name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal/30 focus:border-auctus-teal outline-none"
                placeholder="Your name"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <input
                value={user?.email || ''}
                readOnly
                className="w-full px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] text-slate-400">Email cannot be changed here.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal/30 focus:border-auctus-teal outline-none"
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-auctus-teal" />
              Address
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Street
              </label>
              <input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal/30 focus:border-auctus-teal outline-none"
                placeholder="House / street"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal/30 focus:border-auctus-teal outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  State
                </label>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal/30 focus:border-auctus-teal outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  PIN / ZIP
                </label>
                <input
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal/30 focus:border-auctus-teal outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Country
                </label>
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-auctus-teal/30 focus:border-auctus-teal outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 p-4 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 max-w-md">
              <Shield className="w-4 h-4 text-auctus-teal shrink-0 mt-0.5" />
              <span>
                Your profile powers verification and payouts. We store your photo as part of your account
                record (secured with your login).
              </span>
            </div>
            <button
              type="submit"
              disabled={saving || compressing || !user}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-bold shadow-lg shadow-auctus-teal/25 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
