import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-auctus-teal/10 items-center justify-center mb-6">
          <Search className="w-8 h-8 text-auctus-teal" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          This URL isn’t mapped. Buyer dashboard lives at{' '}
          <Link to="/dashboard" className="font-semibold text-auctus-teal hover:underline">
            /dashboard
          </Link>
          .
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-bold text-sm"
        >
          <Home className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  )
}
