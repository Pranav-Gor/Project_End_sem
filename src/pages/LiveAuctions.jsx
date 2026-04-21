import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBrand from '../components/NavBrand'
import NavAuthButtons from '../components/NavAuthButtons'
import { formatINR } from '../lib/currency'
import { apiGet } from '../lib/api'
import { formatTimeLeftShort } from '../lib/auctionTime'
import { 
  Search, Menu, X, Flame, Filter, Grid3X3, List,
  Heart, Eye, Timer, Star, Gavel, ChevronDown,
  Sun, Moon, MessageCircle, DollarSign, Package, Trash2, Settings
} from 'lucide-react'



const sortOptions = [
  { value: 'ending-soon', label: 'Ending Soon' },
  { value: 'newest', label: 'Newly Listed' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'most-bids', label: 'Most Bids' },
  { value: 'most-watched', label: 'Most Watched' }
]

export default function LiveAuctions() {
  const navigate = useNavigate()
  const [auctions, setAuctions] = useState([])
  const [loadError, setLoadError] = useState(null)
  const [, setTick] = useState(0)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('ending-soon')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [priceRange] = useState([0, 2000000])
  const [favorites, setFavorites] = useState([1, 3])
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  const markAsRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const deleteNotification = (id, e) => { e.stopPropagation(); setNotifications(prev => prev.filter(n => n.id !== id)) }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadError(null)
      const { ok, data } = await apiGet('/api/auctions/live')
      if (cancelled) return
      if (!ok || !data?.data?.auctions) {
        setLoadError(data?.message || 'Could not load auctions')
        setAuctions([])
        return
      }
      setAuctions(data.data.auctions)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id])
  }

  const filteredAuctions = (() => {
    let list = auctions.filter((auction) => {
      const matchesSearch =
        auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        auction.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || auction.category === selectedCategory
      const matchesPrice = auction.currentBid >= priceRange[0] && auction.currentBid <= priceRange[1]
      return matchesSearch && matchesCategory && matchesPrice
    })
    if (sortBy === 'ending-soon') {
      list = [...list].sort((a, b) => new Date(a.endsAt) - new Date(b.endsAt))
    } else if (sortBy === 'price-low') {
      list = [...list].sort((a, b) => a.currentBid - b.currentBid)
    } else if (sortBy === 'price-high') {
      list = [...list].sort((a, b) => b.currentBid - a.currentBid)
    } else if (sortBy === 'most-bids') {
      list = [...list].sort((a, b) => b.bids - a.bids)
    } else if (sortBy === 'most-watched') {
      list = [...list].sort((a, b) => b.watchers - a.watchers)
    }
    return list
  })()

  const categories = ['All', ...new Set(auctions.map((a) => a.category))]

  const goBid = (e, auction) => {
    e.stopPropagation()
    if (!localStorage.getItem('user')) {
      navigate(`/auth?next=${encodeURIComponent(`/auction/${auction.id}`)}&reason=bid`)
      return
    }
    navigate(`/auction/${auction.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <NavBrand />
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search live auctions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={toggleTheme} className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NavAuthButtons />
              <NavAuthButtons compact />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header Section */}
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-semibold text-sm">LIVE NOW</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white">Live Auctions</h1>
              <p className="text-white/60 mt-1">
                {loadError ? 'Could not load listings' : `${filteredAuctions.length} auctions currently active`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/" className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="sticky top-16 lg:top-20 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? 'bg-auctus-teal text-white' 
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 ml-auto">
              {/* Sort */}
              <div className="relative">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-auctus-teal/20 cursor-pointer"
                >
                  {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* View Toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow text-auctus-teal' : 'text-slate-400'}`}>
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-auctus-teal' : 'text-slate-400'}`}>
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auctions Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadError && (
          <p className="text-center text-red-600 dark:text-red-400 text-sm mb-6">{loadError}</p>
        )}
        {filteredAuctions.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No auctions found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {auctions.length === 0
                ? 'Seed the database: node backend/scripts/seed-auctions.js'
                : 'Try adjusting your filters or search query'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredAuctions.map((auction) => (
              <div 
                key={auction.id} 
                onClick={() => navigate(`/auction/${auction.id}`)}
                className={`group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-auctus-teal/50 dark:hover:border-auctus-teal/50 hover:shadow-xl hover:shadow-auctus-teal/10 transition-all duration-300 cursor-pointer ${viewMode === 'list' ? 'flex' : ''}`}
              >
                <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-[4/3]'}`}>
                  {auction.image ? (
                    <img src={auction.image} alt={auction.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-200 dark:bg-slate-700">
                      <Gavel className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  {auction.featured && (
                    <span className="absolute top-3 left-3 px-3 py-1 bg-auctus-teal text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />Featured
                    </span>
                  )}
                  {auction.hot && (
                    <span className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Flame className="w-3 h-3" />Hot
                    </span>
                  )}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full">
                    <Timer className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-white text-xs font-bold">{formatTimeLeftShort(auction.endsAt)}</span>
                  </div>
                </div>

                <div className="p-4 flex-1">
                  <span className="text-xs font-semibold text-auctus-teal uppercase tracking-wider">{auction.category}</span>
                  <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-auctus-teal transition-colors">{auction.title}</h3>
                  
                  <div className="mt-3 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white text-xs font-bold">{auction.seller[0]}</div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{auction.seller}</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{auction.sellerRating}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Current Bid</p>
                        <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(auction.currentBid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{auction.bids} bids</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Eye className="w-3 h-3" />{auction.watchers}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => goBid(e, auction)}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-bold rounded-xl hover:shadow-lg hover:shadow-auctus-teal/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Gavel className="w-4 h-4" />Place Bid
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
