import { Link, useNavigate } from 'react-router-dom'
import { Gavel, DollarSign, User } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Gavel className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-slate-800 dark:text-white">
                AUCTUS
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link
                to="/wallet"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                Add Funds
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            Discover Extraordinary
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              Auctions & Deals
            </span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Join thousands of collectors and enthusiasts in the world's most trusted premium auction marketplace
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/wallet"
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <DollarSign className="w-5 h-5" />
              Start Bidding Now
            </Link>
            <Link
              to="/auth"
              className="px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl border border-white/20 hover:bg-white/20 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Payment Features */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Secure Payment System
            </h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Add funds to your wallet securely and bid on auctions instantly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Wallet Funding
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Add funds instantly using Razorpay secure payment gateway
              </p>
              <Link
                to="/wallet"
                className="text-teal-600 dark:text-teal-400 font-medium hover:underline"
              >
                Add Funds →
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                <Gavel className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Instant Bidding
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Use your wallet balance to bid on auctions without payment delays
              </p>
              <Link
                to="/live-auctions"
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                Browse Auctions →
              </Link>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                Transaction History
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Track all your payments, bids, and winnings in one place
              </p>
              <Link
                to="/transactions"
                className="text-green-600 dark:text-green-400 font-medium hover:underline"
              >
                View History →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-teal-500 to-cyan-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Bidding?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Join thousands of collectors and enthusiasts. Create your account today and get access to exclusive premium auctions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="px-8 py-4 bg-white text-teal-600 font-bold rounded-xl hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              Create Free Account
            </Link>
            <Link
              to="/wallet"
              className="px-8 py-4 bg-white/20 backdrop-blur text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition-all"
            >
              <DollarSign className="w-5 h-5" />
              Add Funds to Wallet
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
