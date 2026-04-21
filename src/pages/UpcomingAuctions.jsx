import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import NavBrand from '../components/NavBrand'
import NavAuthButtons from '../components/NavAuthButtons'
import { formatINR } from '../lib/currency'
import {
  Search, X, Calendar, Clock, Check, BellRing,
  Star, Menu, Sun, Moon, DollarSign, Package, Trash2, MessageCircle,
  Timer, Loader2, PackageSearch, Filter, LayoutGrid, List
} from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'



// ── Days-remaining progress bar ──────────────────────────────────────
function DaysBar({ startsAt }) {
  const now = Date.now()
  const startMs = new Date(startsAt).getTime()
  const diffMs = startMs - now
  if (diffMs <= 0) return null

  const totalMs = 7 * 24 * 60 * 60 * 1000
  const pct = Math.max(0, Math.min(100, ((totalMs - diffMs) / totalMs) * 100))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  const urgency = diffDays === 0 ? 'text-red-500 dark:text-red-400' : diffDays <= 2 ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'
  const barColor = diffDays === 0 ? 'from-red-500 to-orange-500' : diffDays <= 2 ? 'from-amber-500 to-yellow-500' : 'from-blue-500 to-indigo-500'

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <Clock className="w-3 h-3" /> Starts in
        </span>
        <span className={`text-xs font-black ${urgency}`}>
          {diffDays > 0 ? `${diffDays}d ${diffHours}h` : `${diffHours}h`}
        </span>
      </div>
      {/* Track */}
      <div className="relative h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
        {/* Fill grows from left as we get CLOSER */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
        {/* Glow dot at tip */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-br ${barColor} shadow-lg transition-all`}
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
      {/* Left/right labels */}
      <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-wider">
        <span>Now</span><span>7 days</span>
      </div>
    </div>
  )
}

// ── Auction Card ─────────────────────────────────────────────────────
function AuctionCard({ auction, notified, onToggleNotify, viewMode }) {
  const coverImg = auction.images?.[0]
  const startDate = auction.startsAt ? new Date(auction.startsAt) : null
  const dateStr = startDate
    ? startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : auction.startsIn || 'TBD'

  if (viewMode === 'list') {
    return (
      <div className="group flex gap-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="relative w-44 sm:w-56 flex-shrink-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
          {coverImg
            ? <img src={coverImg} alt={auction.title} className="w-full h-full object-contain p-3" loading="lazy" />
            : <PackageSearch className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          }
          <div className="absolute top-2 left-2 text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-full">{auction.category}</div>
        </div>
        <div className="flex-1 p-5 flex flex-col justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{auction.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{auction.description}</p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Starting Bid</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{formatINR(auction.startingBid)}</p>
            </div>
            <div className="flex-1 max-w-xs hidden sm:block">
              <DaysBar startsAt={auction.startsAt} />
            </div>
            <button
              onClick={() => onToggleNotify(auction.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${notified ? 'bg-emerald-500 text-white' : 'border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white'}`}
            >
              {notified ? <><Check className="w-3.5 h-3.5" />Notified</> : <><BellRing className="w-3.5 h-3.5" />Notify Me</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-500/40 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Image */}
      <div className="relative h-52 bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden p-4">
        {coverImg
          ? <img src={coverImg} alt={auction.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          : <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {/* Category */}
        <div className="absolute top-3 left-3 text-[10px] font-black text-white bg-blue-600/90 backdrop-blur-md px-2.5 py-1 rounded-full">
          {auction.category}
        </div>
        {/* Date overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="px-3 py-2 bg-black/50 backdrop-blur-md rounded-xl text-center border border-white/10">
            <p className="text-white text-xs font-bold flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" /> {dateStr}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 gap-4">
        <h3 className="font-black text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {auction.title}
        </h3>

        {/* Timeline bar */}
        <DaysBar startsAt={auction.startsAt} />

        <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Starting Bid</p>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatINR(auction.startingBid)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 mb-0.5">Watchers</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 justify-end">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {auction.watchers || 0}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleNotify(auction.id)}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${notified ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-2 border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white'}`}
        >
          {notified ? <><Check className="w-4 h-4" />Notified!</> : <><BellRing className="w-4 h-4" />Notify Me</>}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function UpcomingAuctions() {
  const navigate = useNavigate()
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notifiedAuctions, setNotifiedAuctions] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light')

  // ── Fetch from API ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true)
        // We query ALL upcoming (not just 7-day window for the full page)
        const res = await apiGet('/api/auctions/upcoming?all=true')
        if (!cancelled) {
          if (res.ok && res.data?.data?.auctions) {
            setAuctions(res.data.data.auctions)
          } else {
            setFetchError(res.data?.message || 'Failed to load auctions')
          }
        }
      } catch {
        if (!cancelled) setFetchError('Could not connect to server.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const toggleNotify = async (id) => {
    if (!localStorage.getItem('accessToken')) {
      navigate(`/auth?next=${encodeURIComponent('/upcoming-auctions')}&reason=notify`)
      return
    }
    
    // Optimistic update
    setNotifiedAuctions(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
    
    try {
      const res = await apiPost(`/api/auctions/${id}/notify`);
      if (!res.ok || !res.data.success) {
         // Revert on failure
         setNotifiedAuctions(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
      }
    } catch (err) {
      // Revert on failure
      setNotifiedAuctions(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id])
    }
  }

  const [timeframe, setTimeframe] = useState('7d') // Default to 7 days as requested

  // Filter
  const categories = ['All', ...new Set(auctions.map(a => a.category))]
  const filtered = auctions.filter(a => {
    const q = searchQuery.toLowerCase()
    const matchesQuery = (a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
    const matchesCategory = (selectedCategory === 'All' || a.category === selectedCategory)
    
    if (timeframe === '7d') {
      const diffMs = new Date(a.startsAt).getTime() - Date.now()
      const diffDays = diffMs / (1000 * 60 * 60 * 24)
      if (diffDays > 7) return false
    }

    return matchesQuery && matchesCategory
  })

  // Count for the header summary
  const startingSoonCount = auctions.filter(a => {
    const diffMs = new Date(a.startsAt).getTime() - Date.now()
    return diffMs > 0 && diffMs <= (7 * 24 * 60 * 60 * 1000)
  }).length

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            <NavBrand />
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search upcoming auctions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>



              <NavAuthButtons />
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-10 lg:py-14">
        <div className="absolute top-0 left-1/4 w-80 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-40 bg-indigo-700/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-bold text-xs uppercase tracking-widest">Coming Soon</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">Upcoming Auctions</h1>
              <p className="text-slate-400 mt-1 font-medium italic">
                {loading ? 'Loading…' : `${startingSoonCount} auction${startingSoonCount !== 1 ? 's' : ''} starting within the next 7 days`}
              </p>
            </div>
            <Link to="/" className="self-start md:self-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors text-sm font-bold border border-white/10">← Back to Home</Link>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ─────────────────────────────────────────── */}
      <div className="sticky top-16 lg:top-20 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile search */}
            <div className="relative w-full md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all text-sm" />
            </div>

            {/* Timeframe toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
              <button 
                onClick={() => setTimeframe('7d')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${timeframe === '7d' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                7 Days
              </button>
              <button 
                onClick={() => setTimeframe('all')} 
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${timeframe === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All Upcoming
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden sm:block mx-1"></div>

            {/* Category pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide flex-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 ml-auto flex-shrink-0">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-slate-400'}`}><LayoutGrid className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-slate-400'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium">Loading upcoming auctions…</p>
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <PackageSearch className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">{fetchError}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !fetchError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No upcoming auctions found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              {searchQuery || selectedCategory !== 'All' ? 'Try adjusting your filters.' : 'Check back soon — new masterpieces are added regularly.'}
            </p>
          </div>
        )}

        {/* Grid / List */}
        {!loading && !fetchError && filtered.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filtered.map(auction => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                notified={notifiedAuctions.includes(auction.id)}
                onToggleNotify={toggleNotify}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
