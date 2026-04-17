import { Link } from 'react-router-dom'
import { ArrowLeft, Settings, Bell, Shield, Sun, Moon } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs text-white/70 hover:text-white mb-3"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to dashboard
          </Link>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Settings
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Notification, security, and appearance preferences for your account.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-auctus-teal" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Notifications
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure reminders for bids, outbid alerts, and auction results.
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-auctus-teal" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Security
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enable multi‑factor authentication and manage trusted devices.
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-auctus-teal" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Appearance
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Light or dark theme preferences (wired already into the rest of the app).
          </p>
          <div className="flex gap-3 text-xs">
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
              <Sun className="w-3.5 h-3.5" />
              Light
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white">
              <Moon className="w-3.5 h-3.5" />
              Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

