import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/api'
import { useToast } from '../contexts/ToastContext.jsx'
import { readSessionUser } from '../hooks/useSessionUser'
import { gstinMatchesPan } from '../lib/gstinPan'
import { CheckCircle2, Loader2, UploadCloud } from 'lucide-react'

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

export default function SellerKyc() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const token = localStorage.getItem('accessToken')
  const user = readSessionUser()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [app, setApp] = useState(null)

  const [form, setForm] = useState({
    businessName: '',
    gstin: '',
    panNumber: '',
    businessAddress: '',
    gstCertificateDataUrl: '',
    panCertificateDataUrl: '',
    bankProofDataUrl: ''
  })

  const [files, setFiles] = useState({
    gstCertificateDataUrl: null,
    panCertificateDataUrl: null,
    bankProofDataUrl: null
  })

  const canSubmit = useMemo(() => {
    return (
      form.businessName &&
      form.gstin &&
      form.panNumber &&
      form.gstCertificateDataUrl &&
      form.panCertificateDataUrl &&
      form.bankProofDataUrl
    )
  }, [form])

  async function loadApplication() {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const { ok, data } = await apiGet('/api/seller/applications/me', token)
      if (!ok) {
        setError(data?.message || 'Could not load your application')
        setApp(null)
        return
      }
      const application = data?.data?.application || null
      setApp(application)

      if (application) {
        setForm({
          businessName: application.businessName || '',
          gstin: application.gstin || '',
          panNumber: application.panNumber || '',
          businessAddress: application.businessAddress || '',
          gstCertificateDataUrl: application.gstCertificateDataUrl || '',
          panCertificateDataUrl: application.panCertificateDataUrl || '',
          bankProofDataUrl: application.bankProofDataUrl || ''
        })
      }
    } catch {
      setError('Failed to load application')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token || !user) {
      navigate('/auth', { replace: true })
      return
    }
    loadApplication()
  }, [token, user, navigate])

  useEffect(() => {
    // If admin approved, seller can sell.
    if (app?.status === 'approved' || user?.isVerified) {
      navigate('/seller/dashboard', { replace: true })
    }
  }, [app, user, navigate])

  function handleFileChange(e, key) {
    const file = e.target.files?.[0]
    if (!file) return
    setFiles(prev => ({ ...prev, [key]: file }))
    setForm(prev => ({ ...prev, [key]: file.name }))
  }

  async function uploadFileToCloudinary(file, token) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'auctus/kyc');
    const BASE = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${BASE}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    return data.data.url;
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!canSubmit) {
      setError('Please fill all details and upload all documents.')
      return
    }
    const normalizedPan = form.panNumber.trim().toUpperCase()
    const normalizedGstin = form.gstin.trim().toUpperCase()
    if (!PAN_REGEX.test(normalizedPan)) {
      setError('PAN format is invalid. Use format: ABCDE1234F')
      return
    }
    if (!GSTIN_REGEX.test(normalizedGstin)) {
      setError('GSTIN format is invalid')
      return
    }
    if (!gstinMatchesPan(normalizedGstin, normalizedPan)) {
      setError(
        'GSTIN must embed your PAN after the 2-digit state code (e.g. 24 + AAPFC5450P + 1ZY).'
      )
      return
    }

    setSubmitting(true)
    try {
      let gstUrl = form.gstCertificateDataUrl;
      let panUrl = form.panCertificateDataUrl;
      let bankUrl = form.bankProofDataUrl;

      if (files.gstCertificateDataUrl) {
        gstUrl = await uploadFileToCloudinary(files.gstCertificateDataUrl, token);
      }
      if (files.panCertificateDataUrl) {
        panUrl = await uploadFileToCloudinary(files.panCertificateDataUrl, token);
      }
      if (files.bankProofDataUrl) {
        bankUrl = await uploadFileToCloudinary(files.bankProofDataUrl, token);
      }

      const payload = {
        ...form,
        panNumber: normalizedPan,
        gstin: normalizedGstin,
        gstCertificateDataUrl: gstUrl,
        panCertificateDataUrl: panUrl,
        bankProofDataUrl: bankUrl
      };

      const { ok, data } = await apiPost(
        '/api/seller/applications',
        payload,
        token
      )
      if (!ok) {
        setError(data?.message || 'Submission failed')
        return
      }
      addToast('Documents submitted. Admin will review them.', 'success')
      await loadApplication()
    } catch (err) {
      setError(err.message || 'Failed to submit application. Image might be too large.')
    } finally {
      setSubmitting(false)
    }
  }

  const statusBanner = (() => {
    if (!app?.status) return null
    if (app.status === 'pending') {
      return (
        <div className="rounded-2xl bg-auctus-teal/10 border border-auctus-teal/20 px-5 py-4 text-sm text-auctus-teal">
          <strong>Your documents are in progress.</strong> Admin will review them and email you the result.
        </div>
      )
    }
    if (app.status === 'rejected') {
      return (
        <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-sm text-red-700 dark:text-red-300">
          <strong>Your application was rejected.</strong>
          {app.reviewNote ? <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">Note: {app.reviewNote}</div> : null}
        </div>
      )
    }
    if (app.status === 'approved') {
      return (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Approved. Redirecting…
        </div>
      )
    }
    return null
  })()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">
            Seller KYC (Upload Documents)
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Upload your GST certificate, PAN card, and bank proof. Admin will review and email you the result.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-6">
            {error ? (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {statusBanner}

            {app?.status === 'pending' ? (
              <div className="rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 p-5 text-sm">
                <p className="font-bold text-slate-900 dark:text-white">Waiting for admin approval</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  You can keep this page open. We will send you an email when your application is approved or rejected.
                </p>
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Legal Business Name (as per GST) *
                  </label>
                  <input
                    value={form.businessName}
                    onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-auctus-teal/40"
                    placeholder="Enter the exact legal/trade name linked to your GSTIN (not your first/last name)"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    This name will be matched with your GSTIN details during verification.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">GSTIN *</label>
                  <input
                    value={form.gstin}
                    onChange={(e) => setForm((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-auctus-teal/40"
                    placeholder="27AABCU9603R1ZX"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">PAN Number *</label>
                  <input
                    value={form.panNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-auctus-teal/40"
                    placeholder="AABCU9603R"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">Business Address</label>
                  <input
                    value={form.businessAddress}
                    onChange={(e) => setForm((prev) => ({ ...prev, businessAddress: e.target.value }))}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-auctus-teal/40"
                    placeholder="Street, City, State, PIN"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    GST certificate (PDF/Image/Word) *
                  </label>
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <UploadCloud className="w-4 h-4 text-auctus-teal" />
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'gstCertificateDataUrl')}
                        className="block w-full text-sm text-slate-600 dark:text-slate-300"
                      />
                    </div>
                    {form.gstCertificateDataUrl ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    PAN card (PDF/Image/Word) *
                  </label>
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <UploadCloud className="w-4 h-4 text-auctus-teal" />
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'panCertificateDataUrl')}
                        className="block w-full text-sm text-slate-600 dark:text-slate-300"
                      />
                    </div>
                    {form.panCertificateDataUrl ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    Bank proof (PDF/Image/Word) *
                  </label>
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-sm">
                      <UploadCloud className="w-4 h-4 text-auctus-teal" />
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx"
                        onChange={(e) => handleFileChange(e, 'bankProofDataUrl')}
                        className="block w-full text-sm text-slate-600 dark:text-slate-300"
                      />
                    </div>
                    {form.bankProofDataUrl ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Selected</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-auctus-teal to-emerald-600 text-white font-bold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Submit for admin review
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
