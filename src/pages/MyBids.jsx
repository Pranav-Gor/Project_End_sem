import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../contexts/ToastContext.jsx'
import { formatINR } from '../lib/currency'
import { 
  Bell, User, Menu, X, Gavel, ArrowLeft, Clock,
  TrendingUp, CheckCircle2, XCircle, Eye,
  Sun, Moon, LogOut, LayoutDashboard, DollarSign
} from 'lucide-react'

import { apiGet } from '../lib/api'

export default function MyBids() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [bidsData, setBidsData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBids = async () => {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      const { ok, data } = await apiGet('/api/auctions/my-bids', token)
      if (ok && data?.success) {
        setBidsData(data.data)
      }
      setLoading(false)
    }
    fetchBids()
  }, [])

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const filteredBids = bidsData.filter(bid => {
    if (activeTab === 'active') return bid.status === 'winning' || bid.status === 'outbid'
    if (activeTab === 'won') return bid.status === 'won'
    if (activeTab === 'lost') return bid.status === 'lost'
    return true
  })

  const stats = {
    active: bidsData.filter(b => b.status === 'winning' || b.status === 'outbid').length,
    winning: bidsData.filter(b => b.status === 'winning').length,
    won: bidsData.filter(b => b.status === 'won').length,
    lost: bidsData.filter(b => b.status === 'lost').length
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center">
                <Gavel className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AUCTUS</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-auctus-teal transition-colors">Home</Link>
              <Link to="/live-auctions" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-auctus-teal transition-colors">Live Auctions</Link>
              <Link to="/upcoming-auctions" className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-auctus-teal transition-colors">Upcoming</Link>
              <Link to="/my-bids" className="px-4 py-2 text-sm font-medium text-auctus-teal bg-auctus-teal/10 rounded-lg">My Bids</Link>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>



              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </button>
                <button onClick={() => navigate('/')} className="p-2 text-slate-600 dark:text-slate-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-slate-600 dark:text-slate-300">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-white/10">
            <div className="px-4 py-3 space-y-1">
              <Link to="/" className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-lg">Home</Link>
              <Link to="/live-auctions" className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-lg">Live Auctions</Link>
              <Link to="/upcoming-auctions" className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 rounded-lg">Upcoming</Link>
              <Link to="/my-bids" className="block px-4 py-2 text-auctus-teal bg-auctus-teal/10 rounded-lg font-medium">My Bids</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl font-black text-white">My Bids</h1>
          <p className="text-white/60 mt-1">Track your active bids and auction history</p>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-4">
            <button onClick={() => setActiveTab('active')} className={`p-3 rounded-xl text-center transition-all ${activeTab === 'active' ? 'bg-auctus-teal/10 border border-auctus-teal/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
              <p className="text-2xl font-black text-auctus-teal">{stats.active}</p>
              <p className="text-xs text-slate-500">Active Bids</p>
            </button>
            <button onClick={() => setActiveTab('winning')} className={`p-3 rounded-xl text-center transition-all ${activeTab === 'winning' ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
              <p className="text-2xl font-black text-green-500">{stats.winning}</p>
              <p className="text-xs text-slate-500">Winning</p>
            </button>
            <button onClick={() => setActiveTab('won')} className={`p-3 rounded-xl text-center transition-all ${activeTab === 'won' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
              <p className="text-2xl font-black text-blue-500">{stats.won}</p>
              <p className="text-xs text-slate-500">Won</p>
            </button>
            <button onClick={() => setActiveTab('lost')} className={`p-3 rounded-xl text-center transition-all ${activeTab === 'lost' ? 'bg-red-500/10 border border-red-500/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
              <p className="text-2xl font-black text-red-500">{stats.lost}</p>
              <p className="text-xs text-slate-500">Lost</p>
            </button>
          </div>
        </div>
      </div>

      {/* Bids List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-auctus-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500">Loading your bids...</p>
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="text-center py-16">
            <Gavel className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No bids found</h3>
            <p className="text-slate-500 mb-6">Start bidding on auctions to see them here</p>
            <Link to="/live-auctions" className="px-6 py-3 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-bold rounded-xl hover:shadow-lg transition-all">
              Browse Live Auctions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBids.map(bid => (
              <div key={bid.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-lg transition-all">
                <img src={bid.image} alt={bid.title} className="w-24 h-24 rounded-lg object-cover" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded">{bid.category}</span>
                    {bid.status === 'winning' && <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs rounded font-medium">Winning</span>}
                    {bid.status === 'outbid' && <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs rounded font-medium">Outbid</span>}
                    {bid.status === 'won' && <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs rounded font-medium">Won</span>}
                    {bid.status === 'lost' && <span className="px-2 py-0.5 bg-slate-500/10 text-slate-500 text-xs rounded font-medium">Lost</span>}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{bid.title}</h3>
                  <p className="text-sm text-slate-500">{bid.seller}</p>
                  {(bid.status === 'winning' || bid.status === 'outbid') && bid.timeLeft && (
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Clock className="w-3 h-3" />
                        {String(bid.timeLeft.hours).padStart(2, '0')}:{String(bid.timeLeft.minutes).padStart(2, '0')} left
                      </span>
                      <span className="text-slate-500">{bid.bids} bids</span>
                    </div>
                  )}
                  {(bid.status === 'won' || bid.status === 'lost') && bid.endDate && (
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1 text-slate-500">
                        Ended: {bid.endDate}
                      </span>
                      <span className="text-slate-500">{bid.bids} total bids</span>
                    </div>
                  )}
                </div>

                <div className="text-right min-w-[120px]">
                  <p className="text-xs text-slate-500">Your Bid</p>
                  <p className={`text-lg font-bold ${bid.status === 'outbid' ? 'text-red-500' : bid.status === 'winning' ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                    {formatINR(bid.myBid)}
                  </p>
                  {(bid.status === 'winning' || bid.status === 'outbid') && (
                    <>
                      <p className="text-xs text-slate-500 mt-1">Current</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{formatINR(bid.currentBid)}</p>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  {bid.status === 'won' && (
                    <button 
                      onClick={() => addToast(`Seller: ${bid.seller}. They will contact you shortly!`, 'success')}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      <User className="w-4 h-4" />
                      Contact Seller
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
