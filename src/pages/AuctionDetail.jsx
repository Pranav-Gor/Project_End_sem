import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import NavBrand from '../components/NavBrand'
import NavAuthButtons from '../components/NavAuthButtons'
import { formatINR, formatINRDecimal } from '../lib/currency'
import { apiGet, apiPost } from '../lib/api'
import { useToast } from '../contexts/ToastContext.jsx'
import {
  Bell, Flame, Heart, Share2,
  Clock, ChevronLeft, ChevronRight, Star, Gavel, Shield,
  Eye, TrendingUp, CheckCircle2,
  Sun, Moon, DollarSign, Package, Trash2, Timer
} from 'lucide-react'

const notificationsData = [
  { id: 1, type: 'bid', title: 'You were outbid!', message: 'Someone placed a higher bid', time: '2 min ago', read: false, icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 2, type: 'message', title: 'New message', message: 'Seller replied to your question', time: '15 min ago', read: false, icon: Package, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 3, type: 'win', title: 'Auction Ending Soon!', message: 'Item ends in 30 minutes', time: '1 hour ago', read: false, icon: Timer, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 4, type: 'shipping', title: 'Item Shipped', message: 'Your item has been shipped', time: '3 hours ago', read: true, icon: Package, color: 'text-green-500', bgColor: 'bg-green-500/10' }
]

export default function AuctionDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { addToast } = useToast()
  const [auction, setAuction] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(true)

  const [currentImage, setCurrentImage] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
  const [notifications, setNotifications] = useState(notificationsData)
  const [showNotifications, setShowNotifications] = useState(false)
  const [bidSubmitting, setBidSubmitting] = useState(false)

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    let cancelled = false
      ; (async () => {
        setLoading(true)
        setLoadError(null)
        const { ok, data } = await apiGet(`/api/auctions/${id}`)
        if (cancelled) return
        if (!ok || !data?.data?.auction) {
          setLoadError(data?.message || 'Auction not found')
          setAuction(null)
        } else {
          setAuction(data.data.auction)
        }
        setLoading(false)
      })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const tick = useCallback(() => {
    if (!auction?.endsAt) return
    const ends = new Date(auction.endsAt).getTime()
    const ms = Math.max(0, ends - Date.now())
    const totalSec = Math.floor(ms / 1000)
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    setTimeLeft({ hours, minutes, seconds })
  }, [auction?.endsAt])

  useEffect(() => {
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [tick])

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  const unreadCount = notifications.filter((n) => !n.read).length
  const markAsRead = (nid) => setNotifications((prev) => prev.map((n) => (n.id === nid ? { ...n, read: true } : n)))
  const deleteNotification = (nid, e) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== nid))
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-container')) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const handleBid = async (e) => {
    e.preventDefault()
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (!localStorage.getItem('user') || !token) {
      navigate(`/auth?next=${encodeURIComponent(`/auction/${id}`)}&reason=bid`)
      return
    }
    const min = (auction?.currentBid || 0) + (auction?.minIncrement ?? 100)
    const amt = Math.round(Number(bidAmount))
    if (!Number.isFinite(amt) || amt < min) {
      addToast(`Enter at least ${formatINR(min)}`, 'error')
      return
    }
    setBidSubmitting(true)
    try {
      const { ok, status, data } = await apiPost(`/api/auctions/${id}/bid`, { amount: amt }, token)
      if (status === 402 || data?.code === 'INSUFFICIENT_WALLET') {
        addToast(
          data?.message ||
          'Not enough wallet balance for this bid. Add money to your wallet first.',
          'error',
          6500
        )
        return
      }
      if (!ok || !data?.success) {
        addToast(data?.message || 'Could not place bid', 'error')
        return
      }
      if (data.data?.auction) setAuction(data.data.auction)
      const w = data.data?.walletBalance
      if (typeof w === 'number') {
        try {
          const prev = JSON.parse(localStorage.getItem('user') || 'null')
          if (prev) {
            localStorage.setItem('user', JSON.stringify({ ...prev, walletBalance: w }))
            window.dispatchEvent(new Event('auctus-auth'))
          }
        } catch {
          /* ignore */
        }
      }
      addToast(data?.message || `Bid placed: ${formatINRDecimal(amt)}`, 'success')
      setBidAmount('')
    } finally {
      setBidSubmitting(false)
    }
  }

  const images = auction?.images?.length ? auction.images : []
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % Math.max(images.length, 1))
  const prevImage = () =>
    setCurrentImage((prev) => (prev - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))

  const minBid = auction ? auction.currentBid + (auction.minIncrement ?? 100) : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 animate-pulse">
        <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-[4/3] rounded-2xl bg-slate-200 dark:bg-slate-700" />
              <div className="flex gap-3">
                {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 rounded-xl bg-slate-200 dark:bg-slate-700" />)}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl w-3/4" />
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2" />
              <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
              <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loadError || !auction) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
          <Gavel className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Auction Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-sm">{loadError || 'This auction may have ended or the ID is incorrect.'}</p>
        <Link to="/live-auctions" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
          Browse Live Auctions
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <NavBrand />
            <div className="flex-1 hidden sm:block" aria-hidden="true" />
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative notification-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5 lg:w-6 lg:h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-50">
                    <div className="p-4 border-b border-slate-100 dark:border-white/5">
                      <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        >
                          <div className={`p-2 rounded-xl ${notification.bgColor} flex-shrink-0`}>
                            <notification.icon className={`w-5 h-5 ${notification.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{notification.title}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{notification.message}</p>
                            <p className="text-xs text-slate-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && <div className="w-2 h-2 bg-auctus-teal rounded-full flex-shrink-0" />}
                          <button
                            onClick={(e) => deleteNotification(notification.id, e)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <NavAuthButtons />
              <NavAuthButtons compact />
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-slate-500 hover:text-auctus-teal transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <Link to="/live-auctions" className="text-slate-500 hover:text-auctus-teal transition-colors">
              Live Auctions
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-900 dark:text-white font-medium truncate">{auction.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {images.length > 0 ? (
                <>
                  <img
                    src={images[currentImage]}
                    alt={auction.title}
                    className="w-full h-full object-contain p-2"
                  />
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-black/80 transition-colors shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-black/80 transition-colors shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImage(idx)}
                            className={`h-1.5 rounded-full transition-all ${idx === currentImage ? 'bg-white w-6' : 'bg-white/40 w-1.5'}`}
                          />
                        ))}
                      </div>
                      {/* Image counter */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-full text-white text-xs font-bold">
                        {currentImage + 1} / {images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-600">
                  <Gavel className="w-16 h-16" />
                  <span className="text-sm font-medium">No images available</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all bg-slate-100 dark:bg-slate-800 ${idx === currentImage ? 'border-blue-500 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-auctus-teal/10 text-auctus-teal text-xs font-bold rounded-full">{auction.category}</span>
                <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  LIVE
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">{auction.title}</h1>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">{auction.watchers} watching</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500">{auction.bids?.length || 0} bids</span>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl text-white ${auction.status === 'upcoming'
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
              : timeLeft.hours === 0 && timeLeft.minutes < 30
                ? 'bg-gradient-to-br from-red-500 to-orange-500'
                : 'bg-gradient-to-br from-slate-700 to-slate-800'
              }`}>
              <p className="text-sm font-medium opacity-90 mb-3">
                {auction.status === 'upcoming' ? '🗓 Auction Starts In:' : '⏱ Auction Ends In:'}
              </p>
              <div className="flex items-center gap-3">
                {[{ v: timeLeft.hours, l: 'Hours' }, { v: timeLeft.minutes, l: 'Minutes' }, { v: timeLeft.seconds, l: 'Seconds' }].map(({ v, l }, i, arr) => (
                  <>
                    <div key={l} className="text-center">
                      <div className="text-3xl lg:text-4xl font-black tabular-nums">{String(v).padStart(2, '0')}</div>
                      <div className="text-[10px] uppercase tracking-widest opacity-70 mt-0.5">{l}</div>
                    </div>
                    {i < arr.length - 1 && <div className="text-2xl font-black opacity-60">:</div>}
                  </>
                ))}
              </div>
              {auction.endsAt && (
                <p className="text-xs opacity-60 mt-3">
                  {auction.status === 'upcoming' ? 'Opens' : 'Closes'}: {new Date(auction.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Current Bid</p>
                  <p className="text-4xl font-black text-slate-900 dark:text-white">{formatINR(auction.currentBid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Starting Bid</p>
                  <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">{formatINR(auction.startingBid)}</p>
                </div>
              </div>

              <form onSubmit={handleBid} className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bids debit your{' '}
                  <Link to="/wallet" className="font-semibold text-auctus-teal hover:underline">
                    wallet balance
                  </Link>{' '}
                  only — not your card.
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder={`Enter ${formatINR(minBid)} or more`}
                    min={minBid}
                    disabled={bidSubmitting}
                    className="w-full pl-10 pr-4 py-4 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-auctus-teal focus:ring-2 focus:ring-auctus-teal/20 transition-all disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={bidSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-bold rounded-xl hover:shadow-lg hover:shadow-auctus-teal/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Gavel className="w-5 h-5" />
                  {bidSubmitting ? 'Placing bid…' : 'Place Bid'}
                </button>
              </form>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${isFavorite ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Saved' : 'Watch'}
                </button>
                <button
                  type="button"
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: auction.title, url: window.location.href })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      addToast('Link copied', 'success')
                    }
                  }}
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white text-2xl font-bold">
                  {auction.seller?.name?.[0] || 'S'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{auction.seller?.name}</h3>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{auction.seller?.rating}</span>
                    <span className="text-slate-400">({auction.seller?.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{auction.seller?.sales}</p>
                  <p className="text-xs text-slate-500">Sales</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{auction.seller?.memberSince}</p>
                  <p className="text-xs text-slate-500">Member Since</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{auction.seller?.location}</p>
                  <p className="text-xs text-slate-500">Location</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
            {['details', 'bids', 'shipping'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg font-semibold capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 text-auctus-teal shadow' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Description</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{auction.description}</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Specifications</h3>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                    {(auction.specifications || []).map((spec, idx) => (
                      <div
                        key={idx}
                        className={`flex justify-between p-4 ${idx !== (auction.specifications?.length || 0) - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
                      >
                        <span className="text-slate-500 dark:text-slate-400">{spec.label}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'bids' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                {(auction.bids || []).length === 0 ? (
                  <p className="p-6 text-slate-500 text-sm">No bid history yet.</p>
                ) : (
                  (auction.bids || []).map((bid, idx) => (
                    <div
                      key={bid.id || idx}
                      className={`flex items-center justify-between p-4 ${idx !== (auction.bids?.length || 0) - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-auctus-teal to-auctus-cyan flex items-center justify-center text-white font-bold">
                          {bid.bidder?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{bid.bidder}</p>
                          <p className="text-sm text-slate-400">{bid.time}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-auctus-teal">{formatINR(bid.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Authenticity</h4>
                  <p className="text-sm text-slate-500">{auction.authenticity || 'Verified listings'}</p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10">
                  <div className="w-12 h-12 bg-auctus-teal/10 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-auctus-teal" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Shipping</h4>
                  <p className="text-sm text-slate-500">{auction.shipping || '—'}</p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2">Returns</h4>
                  <p className="text-sm text-slate-500">{auction.returns || '—'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
