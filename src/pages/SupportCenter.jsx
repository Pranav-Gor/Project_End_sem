import { Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle, LifeBuoy, Mail, Phone } from 'lucide-react'

export default function SupportCenter() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white mb-3"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to dashboard
            </Link>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Support & help center
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Reach out about disputes, payouts, verification, or anything else.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 flex items-start gap-3 text-sm">
          <div className="w-9 h-9 rounded-xl bg-auctus-teal/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-auctus-teal" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Open a ticket
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Describe your question or incident and our team will respond shortly.
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-auctus-teal" />
              Email
            </p>
            <p className="font-medium text-slate-900 dark:text-white">support@auctus.com</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-auctus-teal" />
              Phone
            </p>
            <p className="font-medium text-slate-900 dark:text-white">+1 (555) 123‑4567</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <LifeBuoy className="w-3.5 h-3.5 text-auctus-teal" />
              Priority line
            </p>
            <p className="font-medium text-slate-900 dark:text-white">For premium sellers</p>
          </div>
        </div>
      </div>
    </div>
  )
}

