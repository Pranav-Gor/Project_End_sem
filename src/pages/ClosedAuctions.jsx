import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBrand from '../components/NavBrand'
import NavAuthButtons from '../components/NavAuthButtons'
import { formatINR } from '../lib/currency'
import { 
  Search, Bell, Menu, X, CheckCircle2, Trophy, Calendar,
  Star, ArrowUpRight, Grid3X3, List, TrendingUp,
  Sun, Moon, DollarSign, Package, Trash2, MessageCircle, Timer
} from 'lucide-react'

const closedAuctions = [
  {
    id: 9,
    title: "1965 Ford Mustang Convertible",
    category: "Classic Cars",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
    finalBid: 78500,
    totalBids: 89,
    soldDate: "Mar 28, 2026",
    winner: "ClassicCar_Collector",
    seller: "VintageAuto",
    sellerRating: 4.9,
    views: 1250
  },
  {
    id: 10,
    title: "Limited Edition Sneaker Collection",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&h=300&fit=crop",
    finalBid: 5600,
    totalBids: 156,
    soldDate: "Mar 27, 2026",
    winner: "SneakerHead_99",
    seller: "KicksEmporium",
    sellerRating: 4.7,
    views: 890
  },
  {
    id: 11,
    title: "18th Century Oil Painting Portrait",
    category: "Fine Art",
    image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&h=300&fit=crop",
    finalBid: 42000,
    totalBids: 34,
    soldDate: "Mar 25, 2026",
    winner: "ArtConnoisseur",
    seller: "HeritageGallery",
    sellerRating: 4.8,
    views: 567
  },
  {
    id: 12,
    title: "Gaming PC Setup - RTX 4090",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587202372634-32705e3e568e?w=400&h=300&fit=crop",
    finalBid: 2800,
    totalBids: 72,
    soldDate: "Mar 24, 2026",
    winner: "ProGamer_X",
    seller: "TechDeals",
    sellerRating: 4.6,
    views: 2340
  },
  {
    id: 19,
    title: "Vintage Gibson Les Paul Guitar",
    category: "Musical Instruments",
    image: "https://images.unsplash.com/photo-1550985543-f4423c9d7481?w=400&h=300&fit=crop",
    finalBid: 12500,
    totalBids: 45,
    soldDate: "Mar 22, 2026",
    winner: "GuitarLegend",
    seller: "MusicVault",
    sellerRating: 4.9,
    views: 678
  },
  {
    id: 20,
    title: "Luxury Yacht Model - 1:50 Scale",
    category: "Collectibles",
    image: "https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?w=400&h=300&fit=crop",
    finalBid: 3500,
    totalBids: 28,
    soldDate: "Mar 20, 2026",
    winner: "NauticalCollector",
    seller: "ModelMasters",
    sellerRating: 4.8,
    views: 445
  }
]

const notificationsData = [
  { id: 1, type: 'bid', title: 'You were outbid!', message: 'Someone placed a higher bid', time: '2 min ago', read: false, icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 2, type: 'message', title: 'New message', message: 'Seller replied to your question', time: '15 min ago', read: false, icon: MessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 3, type: 'win', title: 'Auction Ending Soon!', message: 'Item ends in 30 minutes', time: '1 hour ago', read: false, icon: Timer, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 4, type: 'shipping', title: 'Item Shipped', message: 'Your item has been shipped', time: '3 hours ago', read: true, icon: Package, color: 'text-green-500', bgColor: 'bg-green-500/10' }
]

export default function ClosedAuctions() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [notifications, setNotifications] = useState(notificationsData)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')
  const unreadCount = notifications.filter(n => !n.read).length
  const markAsRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const deleteNotification = (id, e) => { e.stopPropagation(); setNotifications(prev => prev.filter(n => n.id !== id)) }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const filteredAuctions = closedAuctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         auction.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || auction.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['All', ...new Set(closedAuctions.map(a => a.category))]

  const totalVolume = closedAuctions.reduce((sum, a) => sum + a.finalBid, 0)
  const totalBids = closedAuctions.reduce((sum, a) => sum + a.totalBids, 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <NavBrand />
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search auction history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={toggleTheme} className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative notification-container">
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5"><h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3></div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} onClick={() => markAsRead(notification.id)} className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                          <div className={`p-2 rounded-xl ${notification.bgColor} flex-shrink-0`}><notification.icon className={`w-5 h-5 ${notification.color}`} /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{notification.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-auctus-teal rounded-full flex-shrink-0"></div>}
                          <button onClick={(e) => deleteNotification(notification.id, e)} className="p-1 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <NavAuthButtons />
              <NavAuthButtons compact />

              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold text-sm">COMPLETED</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white">Closed Auctions</h1>
              <p className="text-white/60 mt-1">See what treasures found new homes</p>
            </div>
            <Link to="/" className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">Back to Home</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{formatINR(totalVolume)}</p>
              <p className="text-sm text-slate-500">Total Volume</p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-white/10">
              <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{closedAuctions.length}</p>
              <p className="text-sm text-slate-500">Auctions Closed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{totalBids}</p>
              <p className="text-sm text-slate-500">Total Bids</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 lg:top-20 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-auctus-teal text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow text-auctus-teal' : 'text-slate-400'}`}><Grid3X3 className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-auctus-teal' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auctions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredAuctions.map((auction) => (
            <div key={auction.id} className={`group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 opacity-75 hover:opacity-100 transition-all duration-300 ${viewMode === 'list' ? 'flex' : ''}`}>
              <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-[4/3]'}`}>
                <img src={auction.image} alt={auction.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <span className="absolute top-3 left-3 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Sold</span>
                <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full">
                  <span className="text-white text-xs font-medium">{auction.soldDate}</span>
                </div>
              </div>

              <div className="p-4 flex-1">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{auction.category}</span>
                <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{auction.title}</h3>
                
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold">{auction.seller[0]}</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{auction.seller}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Final Price</p>
                      <p className="text-xl font-black text-green-600 dark:text-green-400">{formatINR(auction.finalBid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">{auction.totalBids} bids</p>
                      <p className="text-xs text-slate-400">{auction.views} views</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Won by</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{auction.winner}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
