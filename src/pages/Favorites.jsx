import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatINR } from '../lib/currency'
import {
  Search, User, Menu, X, Heart, Trash2, Eye, Timer,
  Star, Gavel, ArrowUpRight, Flame, ShoppingBag,
  Sun, Moon, DollarSign, Package, MessageCircle
} from 'lucide-react'

const mockFavorites = [
  {
    id: 1,
    title: "Vintage Rolex Submariner 1967",
    category: "Luxury Watches",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=300&fit=crop",
    currentBid: 28500,
    bids: 42,
    timeLeft: "2h 15m",
    seller: "EliteTimepieces",
    sellerRating: 4.9,
    watchers: 156,
    status: 'live'
  },
  {
    id: 3,
    title: "2023 Tesla Model S Plaid",
    category: "Automotive",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop",
    currentBid: 87500,
    bids: 15,
    timeLeft: "1h 45m",
    seller: "AutoExcellence",
    sellerRating: 5.0,
    watchers: 234,
    status: 'live'
  },
  {
    id: 5,
    title: "Rare Diamond Necklace - 5.2 Carat",
    category: "Jewelry",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=300&fit=crop",
    startingBid: 45000,
    startDate: "Mar 31, 2026",
    seller: "LuxuryJewels",
    sellerRating: 4.9,
    interested: 312,
    status: 'upcoming'
  },
  {
    id: 9,
    title: "1965 Ford Mustang Convertible",
    category: "Classic Cars",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop",
    finalBid: 78500,
    soldDate: "Mar 28, 2026",
    winner: "ClassicCar_Collector",
    seller: "VintageAuto",
    sellerRating: 4.9,
    status: 'closed'
  }
]



export default function Favorites() {
  const navigate = useNavigate()
  const [favorites, setFavorites] = useState(mockFavorites)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')




  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  const filteredFavorites = activeFilter === 'all'
    ? favorites
    : favorites.filter(f => f.status === activeFilter)

  const filters = [
    { id: 'all', label: 'All Items', count: favorites.length },
    { id: 'live', label: 'Live', count: favorites.filter(f => f.status === 'live').length },
    { id: 'upcoming', label: 'Upcoming', count: favorites.filter(f => f.status === 'upcoming').length },
    { id: 'closed', label: 'Closed', count: favorites.filter(f => f.status === 'closed').length }
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Auctus Logo" className="h-10 lg:h-12 w-auto object-contain" />
            </Link>

            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={toggleTheme} className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button onClick={() => navigate('/auth')} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-auctus-teal/30 transition-all">
                <User className="w-5 h-5" /><span>Sign In</span>
              </button>
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
              <Heart className="w-5 h-5 text-red-400 fill-red-400" />
              <span className="text-red-400 font-semibold text-sm">MY COLLECTION</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-white">My Favorites</h1>
            <p className="text-white/60 mt-1">{favorites.length} items saved</p>
          </div>
          <Link to="/" className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors">Back to Home</Link>
        </div>
      </div>
      </div >

    {/* Filters */ }
    < div className = "sticky top-16 lg:top-20 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10 shadow-sm" >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {filters.map(filter => (
            <button key={filter.id} onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${activeFilter === filter.id ? 'bg-auctus-teal text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
      </div>
      </div >

    {/* Favorites Grid */ }
    < div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" >
    {
      filteredFavorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No favorites yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Start browsing and save items you love</p>
          <Link to="/live-auctions" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-bold rounded-xl hover:shadow-lg transition-all">
            <ShoppingBag className="w-5 h-5" />Browse Auctions
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFavorites.map((item) => (
            <div key={item.id} className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-auctus-teal/50 dark:hover:border-auctus-teal/50 hover:shadow-xl transition-all duration-300">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Status Badge */}
                <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full ${item.status === 'live' ? 'bg-red-500 text-white' :
                  item.status === 'upcoming' ? 'bg-auctus-teal text-white' :
                    'bg-green-500 text-white'
                  }`}>
                  {item.status === 'live' ? 'LIVE' : item.status === 'upcoming' ? 'UPCOMING' : 'CLOSED'}
                </span>

                {/* Remove Button */}
                <button onClick={() => removeFavorite(item.id)} className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 rounded-full hover:bg-red-500 hover:text-white transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Time/Date */}
                <div className="absolute bottom-3 left-3">
                  {item.status === 'live' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-full">
                      <Timer className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-white text-xs font-bold">{item.timeLeft}</span>
                    </div>
                  )}
                  {item.status === 'upcoming' && (
                    <div className="px-3 py-1.5 bg-auctus-teal/90 backdrop-blur-md rounded-full">
                      <span className="text-white text-xs font-bold">{item.startDate}</span>
                    </div>
                  )}
                  {item.status === 'closed' && (
                    <div className="px-3 py-1.5 bg-green-500/90 backdrop-blur-md rounded-full">
                      <span className="text-white text-xs font-bold">{item.soldDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4">
                <span className="text-xs font-semibold text-auctus-teal uppercase tracking-wider">{item.category}</span>
                <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-auctus-teal transition-colors">{item.title}</h3>

                <div className="mt-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white text-xs font-bold">{item.seller[0]}</div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.seller}</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{item.sellerRating}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  {item.status === 'live' && (
                    <>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Current Bid</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(item.currentBid)}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.bids} bids</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!localStorage.getItem('user')) {
                            navigate(`/auth?next=${encodeURIComponent(`/auction/${item.id}`)}&reason=bid`)
                            return
                          }
                          navigate(`/auction/${item.id}`)
                        }}
                        className="w-full py-3 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-bold rounded-xl hover:shadow-lg hover:shadow-auctus-teal/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Gavel className="w-4 h-4" />Place Bid
                      </button>
                    </>
                  )}
                  {item.status === 'upcoming' && (
                    <>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Starting Bid</p>
                          <p className="text-xl font-black text-slate-900 dark:text-white">{formatINR(item.startingBid)}</p>
                        </div>
                        <p className="text-xs text-slate-400">{item.interested} interested</p>
                      </div>
                      <button className="w-full py-3 border-2 border-auctus-teal text-auctus-teal font-bold rounded-xl hover:bg-auctus-teal hover:text-white transition-all">
                        Notify Me
                      </button>
                    </>
                  )}
                  {item.status === 'closed' && (
                    <>
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Final Price</p>
                          <p className="text-xl font-black text-green-600 dark:text-green-400">{formatINR(item.finalBid)}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Won by</p>
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.winner}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }
      </div >
    </div >
  )
}
