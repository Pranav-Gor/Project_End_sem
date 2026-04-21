import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Gavel, X, Loader2, CheckCircle2,
  Tag, ChevronDown, Plus, Layers, Calendar, DollarSign,
  Truck, RefreshCcw, Info, ImagePlus, Clock, AlertTriangle,
  ShieldAlert, UploadCloud, GripVertical, Zap, Image as ImageIcon
} from 'lucide-react'
import { apiPost } from '../lib/api'

// ── Duration options ──────────────────────────────────────────
const DURATION_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '2 Days', value: 2 },
  { label: '3 Days', value: 3 },
]

// ── Preset categories ─────────────────────────────────────────
const PRESET_CATEGORIES = [
  'Automotive', 'Classic Cars', 'Motorcycles',
  'Luxury Watches', 'Jewelry', 'Diamonds & Gemstones',
  'Fine Art', 'Sculptures', 'Photography',
  'Real Estate', 'Collectibles', 'Sports Memorabilia',
  'Wine & Spirits', 'F1 Memorabilia', 'AI Servers', 'GPUs',
  'Enterprise Servers', 'Electronics', 'Furniture & Antiques',
  'Books & Manuscripts',
]

// ── Smart Category Input ──────────────────────────────────────
function CategoryInput({ value, onChange }) {
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const filtered = query.length === 0 ? PRESET_CATEGORIES : PRESET_CATEGORIES.filter(c => c.toLowerCase().includes(query.toLowerCase()))
  const isCustom = query.trim() && !PRESET_CATEGORIES.includes(query.trim())
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const select = (cat) => { setQuery(cat); onChange(cat); setOpen(false) }
  return (
    <div ref={ref} className="relative">
      <div
        className={`flex items-center gap-2 h-12 px-4 rounded-xl border transition-all cursor-text ${open ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-[#080C1E]' : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#080C1E]'}`}
        onClick={() => setOpen(true)}
      >
        <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-medium text-sm focus:outline-none"
          placeholder="Type or pick a category..."
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        />
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl bg-white dark:bg-[#0B1028] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
          <div className="max-h-52 overflow-y-auto">
            {filtered.length > 0 ? filtered.map(cat => (
              <button key={cat} type="button" onClick={() => select(cat)}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors flex items-center gap-2 ${cat === value ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                <Layers className="w-3.5 h-3.5 text-slate-400" />{cat}
                {cat === value && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 ml-auto" />}
              </button>
            )) : <p className="px-4 py-3 text-xs text-slate-400">No matching category</p>}
          </div>
          {isCustom && (
            <div className="border-t border-slate-100 dark:border-white/5">
              <button type="button" onClick={() => select(query.trim())}
                className="w-full px-4 py-3 text-left text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" />Add custom: "{query.trim()}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FieldGroup({ label, icon: Icon, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {Icon && <Icon className="w-3.5 h-3.5" />}{label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 dark:text-slate-600">{hint}</p>}
    </div>
  )
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-blue-500/10"><Icon className="w-4 h-4 text-blue-500 dark:text-blue-400" /></div>
        <h3 className="text-sm font-black text-slate-900 dark:text-white">{title}</h3>
        <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
      </div>
      {children}
    </div>
  )
}

const inputCls = "w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#080C1E] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-medium text-sm outline-none"
const textareaCls = "w-full p-4 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-[#080C1E] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none font-medium text-sm outline-none"

// ── Upload multiple Files to Cloudinary via backend ────────────────────
async function uploadFilesToCloudinary(files, token) {
  const fd = new FormData()
  files.forEach(f => fd.append('files', f))
  fd.append('folder', 'auctus/auctions')

  const BASE = import.meta.env.VITE_API_URL || ''
  const res = await fetch(`${BASE}/api/upload/bulk`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  })

  const data = await res.json()
  if (!data.success) throw new Error(data.message || 'Bulk upload failed')
  return data.data // { urls: [], errors: [] }
}

export default function SellerCreateAuction() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)       // form submit in progress
  const [error, setError] = useState(null)
  const [kycBlocked, setKycBlocked] = useState(false)
  const [success, setSuccess] = useState(null)

  // ── Local image state: store File objects + preview URLs ──────────────
  // Each item: { file: File, preview: string, uploading: boolean, url: string|null }
  const [images, setImages] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '', category: '', description: '',
    startingBid: '', minIncrement: '100',
    startsAt: '', durationDays: '3',
    condition: '', shipping: '', returns: '',
  })
  const handleChange = (e) => setFormData(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Add files (from input or drop) ────────────────────────────────────
  const addFiles = useCallback((fileList) => {
    const accepted = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    const newItems = accepted.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
      url: null,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }))
    setImages(prev => [...prev, ...newItems])
  }, [])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => images.forEach(img => URL.revokeObjectURL(img.preview))
  }, []) // eslint-disable-line

  const removeImage = (id) => {
    setImages(prev => {
      const item = prev.find(i => i.id === id)
      if (item) URL.revokeObjectURL(item.preview)
      return prev.filter(i => i.id !== id)
    })
  }

  // ── Drag and drop handlers ────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false) }
  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }

  // ── Form submit: upload all images to Cloudinary THEN save auction ─────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.category) { setError('Please select or enter a category.'); return }
    if (images.length === 0) { setError('Please upload at least one image.'); return }

    setLoading(true)
    setError(null)
    setKycBlocked(false)

    const token = localStorage.getItem('accessToken')

    try {
      // ── Step 1: Upload all images to Cloudinary ──────────────────────
      setImages(prev => prev.map(i => ({ ...i, uploading: true })))

      const uploadResult = await uploadFilesToCloudinary(images.map(img => img.file), token)

      const cdnUrls = uploadResult.urls || []
      const failed = uploadResult.errors || []

      // Map back to our local state
      setImages(prev => prev.map(img => {
        const foundUrl = uploadResult.urls.find(url => url.includes(img.file.name.split('.')[0]))
          || (uploadResult.urls.length === images.length ? uploadResult.urls[prev.indexOf(img)] : null)

        return {
          ...img,
          uploading: false,
          url: foundUrl,
        }
      }))

      if (failed.length > 0) {
        const names = failed.map(f => f.file).join(', ')
        setError(`Failed to upload: ${names}. Please remove and re-add them.`)
        setLoading(false)
        return
      }

      if (cdnUrls.length === 0) {
        setError('All image uploads failed. Please try again.')
        setLoading(false)
        return
      }

      // ── Step 2: Create auction with Cloudinary CDN URLs ──────────────
      const payload = { ...formData, images: cdnUrls };
      if (payload.startsAt) {
        payload.startsAt = new Date(payload.startsAt).toISOString();
      }

      const res = await apiPost('/api/seller/auctions', payload, token)
      const d = res.data

      if (res.ok && d.success) {
        setSuccess(`✓ Auction created! (ID: ${d.data.auctionId}) — ${cdnUrls.length} image(s) saved. Redirecting...`)
        setTimeout(() => navigate('/seller/dashboard'), 2200)
      } else {
        if (d?.code === 'KYC_REQUIRED' || res.status === 403) setKycBlocked(true)
        setError(d?.message || 'Failed to create auction.')
      }
    } catch (err) {
      setError('Connection error: ' + (err.message || 'Is the backend running?'))
    } finally {
      setLoading(false)
    }
  }

  // ── Computed auction window preview ───────────────────────────────────
  const auctionPreview = (() => {
    const startMs = formData.startsAt ? new Date(formData.startsAt).getTime() : Date.now()
    const endMs = startMs + Number(formData.durationDays) * 86400000
    const fmt = (ms) => new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    return { start: fmt(startMs), end: fmt(endMs) }
  })()

  const getLocalISOTime = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzoffset)).toISOString().slice(0, 16);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#06091A] text-slate-900 dark:text-white transition-colors">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-[#0D1535] dark:via-[#0B1228] dark:to-[#070A18] border-b border-slate-200 dark:border-white/5 py-10">
        <div className="absolute top-0 right-1/4 w-64 h-40 bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/seller/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Create New Auction</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Fill in the details, upload images, and launch your auction.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* KYC block */}
          {kycBlocked && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex gap-4">
              <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">KYC Approval Required</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">{error}</p>
                <Link to="/seller/kyc" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2">Go to KYC →</Link>
              </div>
            </div>
          )}
          {error && !kycBlocked && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{success}</p>
            </div>
          )}

          <div className="rounded-2xl bg-white dark:bg-[#0B1028] border border-slate-200 dark:border-white/5 p-6 sm:p-8 space-y-10 shadow-xl">

            {/* ── 1. Auction Details ──── */}
            <Section title="Auction Details" icon={Gavel}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <FieldGroup label="Auction Title" icon={Tag}>
                    <input required name="title" value={formData.title} onChange={handleChange} placeholder="e.g., 2025 Red Bull Racing RB21 (Max Verstappen)" className={inputCls} />
                  </FieldGroup>
                </div>
                <FieldGroup label="Category" icon={Layers} hint="Can't find yours? Type to add a custom category.">
                  <CategoryInput value={formData.category} onChange={(val) => setFormData(f => ({ ...f, category: val }))} />
                </FieldGroup>
                <FieldGroup label="Condition">
                  <select name="condition" value={formData.condition} onChange={handleChange} className={inputCls}>
                    <option value="">Select condition</option>
                    <option>Mint / Brand New</option><option>Like New</option><option>Excellent</option>
                    <option>Very Good</option><option>Good</option><option>Fair</option><option>For Parts</option>
                  </select>
                </FieldGroup>
                <div className="md:col-span-2">
                  <FieldGroup label="Description" hint="A compelling description dramatically increases bidder interest.">
                    <textarea required rows={5} name="description" value={formData.description} onChange={handleChange} placeholder="Describe your lot — provenance, features, what makes it special..." className={textareaCls} />
                  </FieldGroup>
                </div>
              </div>
            </Section>

            {/* ── 2. Pricing & Schedule ── */}
            <Section title="Pricing & Schedule" icon={DollarSign}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FieldGroup label="Starting Bid (₹)" icon={DollarSign}>
                  <input required type="number" min="0" name="startingBid" value={formData.startingBid} onChange={handleChange} placeholder="e.g., 50000" className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Min. Bid Increment (₹)" hint="Minimum raise per bid">
                  <input type="number" min="100" name="minIncrement" value={formData.minIncrement} onChange={handleChange} placeholder="e.g., 1000" className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Auction Start (Scheduled)" icon={Calendar} hint={formData.startsAt ? `Scheduled to start at the selected time. Auction will run for ${formData.durationDays} days.` : `Leave empty to start immediately (${formData.durationDays}-day duration).`}>
                  <div className="relative">
                    <input
                      type="datetime-local"
                      name="startsAt"
                      value={formData.startsAt}
                      onChange={handleChange}
                      min={new Date().toISOString().slice(0, 16)}
                      className={`${inputCls} [color-scheme:dark] w-full`}
                    />
                  </div>
                </FieldGroup>
                <FieldGroup label="Duration" icon={Clock} hint="Maximum duration is 3 days.">
                  <select name="durationDays" value={formData.durationDays} onChange={handleChange} className={inputCls}>
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </FieldGroup>
              </div>
            </Section>

            {/* ── 3. Logistics ──────────── */}
            <Section title="Logistics & Terms" icon={Truck}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FieldGroup label="Shipping Details" icon={Truck}>
                  <input name="shipping" value={formData.shipping} onChange={handleChange} placeholder="e.g., Buyer pays, Free global shipping" className={inputCls} />
                </FieldGroup>
                <FieldGroup label="Returns Policy" icon={RefreshCcw}>
                  <input name="returns" value={formData.returns} onChange={handleChange} placeholder="e.g., No returns, 7-day return policy" className={inputCls} />
                </FieldGroup>
              </div>
            </Section>

            {/* ── 4. Images (Drag & Drop) ── */}
            <Section title="Lot Imagery" icon={ImagePlus}>
              <p className="text-xs text-slate-500 dark:text-slate-600 -mt-3">
                Images are stored on <span className="text-blue-500">Cloudinary CDN</span> and saved to the auction record on submit — no uploads happen until you click Launch.
              </p>

              {/* Drop Zone */}
              <div
                className={`rounded-2xl border-2 border-dashed transition-all cursor-pointer min-h-[180px] flex flex-col items-center justify-center gap-3 p-8 select-none
                  ${isDragging
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.01]'
                    : 'border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#080C1E] hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5'
                  }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file" accept="image/*" multiple className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => addFiles(e.target.files)}
                />
                <div className={`p-4 rounded-2xl transition-all ${isDragging ? 'bg-blue-200 dark:bg-blue-500/30 scale-110' : 'bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'}`}>
                  <UploadCloud className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isDragging ? 'Drop images here' : 'Drag & drop images, or click to browse'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">PNG, JPG, WEBP — up to 10MB each • Multiple supported</p>
                </div>
              </div>

              {/* Image previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10">
                      <img src={img.preview} alt="preview" className="w-full h-full object-cover" />

                      {/* Cover badge */}
                      {idx === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-[9px] font-black tracking-wide backdrop-blur-md z-10">
                          COVER
                        </div>
                      )}

                      {/* Upload progress overlay */}
                      {img.uploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                          <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                          <span className="text-white text-[10px] font-bold">Uploading…</span>
                        </div>
                      )}

                      {/* Uploaded checkmark */}
                      {img.url && !img.uploading && (
                        <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg z-10">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}

                      {/* Remove button (hover) */}
                      {!img.uploading && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:scale-110 transition-all shadow-xl"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* File name */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[9px] truncate">{img.file.name}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add more tile */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-video rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all text-slate-400 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 gap-1.5"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-xs font-bold">Add more</span>
                  </div>
                </div>
              )}

              {/* Selected count */}
              {images.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-600">
                  <ImageIcon className="w-3.5 h-3.5" />
                  {images.length} image{images.length !== 1 ? 's' : ''} selected — will be uploaded to Cloudinary when you click Launch.
                </div>
              )}
            </Section>

          </div>

          {/* ── Submit Footer ─────────────────────────── */}
          <div className="rounded-2xl bg-white dark:bg-[#0B1028] border border-slate-200 dark:border-white/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <p className="text-xs text-slate-400 max-w-sm">
              By creating this listing you agree to Auctus's terms. Commission is deducted automatically after the sale.
            </p>
            <button
              disabled={loading}
              type="submit"
              className="min-w-[220px] px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-black tracking-wide shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Uploading &amp; Saving...</>
              ) : (
                <><Gavel className="w-5 h-5" /> Launch Auction</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
