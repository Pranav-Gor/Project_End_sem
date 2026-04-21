import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBrand from '../components/NavBrand'
import NavAuthButtons from '../components/NavAuthButtons'
import { formatINR } from '../lib/currency'
import { apiGet } from '../lib/api'
import { 
  Search, Menu, X, CheckCircle2, Trophy, Calendar,
  Star, ArrowUpRight, Grid3X3, List, TrendingUp,
  Sun, Moon, DollarSign, Package, Trash2, MessageCircle, Timer, Loader2
} from 'lucide-react'



export default function ClosedAuctions() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await apiGet('/api/auctions/closed', token);
        if (!cancelled && res.ok && res.data?.success) {
          setAuctions(res.data.data.auctions);
        }
      } catch (err) {
        console.error('Failed to fetch closed auctions', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light')

  const filteredAuctions = auctions.filter(auction => {
    const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         auction.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || auction.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['All', ...new Set(auctions.map(a => a.category))]

  const totalVolume = auctions.reduce((sum, a) => sum + (a.finalBid || 0), 0)
  const totalBids = auctions.reduce((sum, a) => sum + (a.totalBids || 0), 0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060813] transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B0F21]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <NavBrand />
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search auction history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-[#151B30] border border-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={toggleTheme} className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B30] rounded-xl transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <NavAuthButtons />
              <NavAuthButtons compact />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#151B30] rounded-xl transition-colors">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0D1535] via-[#0B1228] to-[#070A18] py-8 border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold text-sm">COMPLETED</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white">Closed Auctions</h1>
              <p className="text-white/60 mt-1">See what treasures found new homes</p>
            </div>
            <Link to="/dashboard" className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-bold text-sm">Dashboard</Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-[#0B0F21] border-b border-slate-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{loading ? '...' : formatINR(totalVolume)}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Volume</p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-white/5">
              <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{loading ? '...' : auctions.length}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Auctions Closed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{loading ? '...' : totalBids}</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Total Bids</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 lg:top-20 z-40 bg-white dark:bg-[#0B0F21] border-b border-slate-200 dark:border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex bg-slate-100 dark:bg-white/5 rounded-xl p-1">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#151B30] shadow text-blue-500' : 'text-slate-400'}`}><Grid3X3 className="w-5 h-5" /></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#151B30] shadow text-blue-500' : 'text-slate-400'}`}><List className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auctions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-500 font-bold">Loading past auctions...</p>
          </div>
        ) : filteredAuctions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-500 font-bold text-lg">No closed auctions found.</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredAuctions.map((auction) => (
              <div key={auction.id} className={`group bg-white dark:bg-[#0B0F21] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 hover:border-blue-500/30 transition-all duration-300 shadow-sm hover:shadow-xl ${viewMode === 'list' ? 'flex' : ''}`}>
                <div className={`relative overflow-hidden bg-slate-100 dark:bg-[#151B30] ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-[4/3]'}`}>
                  {auction.image ? (
                    <img src={auction.image} alt={auction.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <TrendingUp className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <span className="absolute top-3 left-3 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black tracking-widest uppercase rounded-full flex items-center gap-1 shadow-lg shadow-emerald-500/20"><CheckCircle2 className="w-3 h-3" />Sold</span>
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-black/50 backdrop-blur-md rounded-lg">
                    <span className="text-white text-xs font-bold">{new Date(auction.soldDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{auction.category}</span>
                  <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">{auction.title}</h3>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex-1 flex flex-col justify-end">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Final Price</p>
                        <p className="text-xl font-black text-emerald-500">{formatINR(auction.finalBid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{auction.totalBids} Bids</p>
                        <p className="text-[10px] font-medium text-slate-500">{auction.views} views</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-3 h-3 text-amber-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Won by</p>
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">{auction.winner}</p>
                        </div>
                      </div>
                    </div>
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
