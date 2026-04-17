import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, Bell, User, Menu, X, Clock, TrendingUp, 
  Gavel, ChevronRight, ArrowUpRight, Star, Zap, Award,
  Heart, MapPin, Gem, Car, Sofa, Cpu, Wine, Shirt,
  Sun, Moon, DollarSign, Package, Trash2, MessageCircle, Timer
} from 'lucide-react'

const categories = [
  { 
    id: 'watches', 
    name: "Luxury Watches", 
    icon: Clock, 
    count: 124, 
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&h=400&fit=crop",
    description: "Premium timepieces from Rolex, Patek Philippe, and more",
    featured: ["Rolex Submariner", "Omega Speedmaster", "Patek Philippe Nautilus"]
  },
  { 
    id: 'art', 
    name: "Fine Art", 
    icon: Star, 
    count: 89, 
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop",
    description: "Contemporary and classic artworks from renowned artists",
    featured: ["Abstract Paintings", "Sculptures", "Photography"]
  },
  { 
    id: 'automotive', 
    name: "Automotive", 
    icon: Zap, 
    count: 56, 
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop",
    description: "Classic cars, modern supercars, and rare vehicles",
    featured: ["Classic Cars", "Supercars", "Motorcycles"]
  },
  { 
    id: 'jewelry', 
    name: "Jewelry", 
    icon: Gem, 
    count: 203, 
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop",
    description: "Diamonds, precious gems, and luxury jewelry pieces",
    featured: ["Diamond Rings", "Necklaces", "Luxury Watches"]
  },
  { 
    id: 'antiques', 
    name: "Antiques", 
    icon: Gavel, 
    count: 78, 
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=600&h=400&fit=crop",
    description: "Rare antiques and vintage collectibles",
    featured: ["Furniture", "Decorative Arts", "Vintage Items"]
  },
  { 
    id: 'electronics', 
    name: "Electronics", 
    icon: Cpu, 
    count: 145, 
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop",
    description: "Latest gadgets, cameras, and tech equipment",
    featured: ["Cameras", "Gaming", "Smartphones"]
  },
  { 
    id: 'collectibles', 
    name: "Collectibles", 
    icon: Award, 
    count: 234, 
    image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=400&fit=crop",
    description: "Trading cards, memorabilia, and rare collectibles",
    featured: ["Sports Cards", "Coins", "Stamps"]
  },
  { 
    id: 'realestate', 
    name: "Real Estate", 
    icon: MapPin, 
    count: 12, 
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop",
    description: "Premium properties and real estate investments",
    featured: ["Luxury Homes", "Commercial", "Land"]
  },
  { 
    id: 'fashion', 
    name: "Fashion", 
    icon: Shirt, 
    count: 167, 
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=400&fit=crop",
    description: "Designer clothing, handbags, and accessories",
    featured: ["Designer Bags", "Shoes", "Clothing"]
  },
  { 
    id: 'wine', 
    name: "Wine & Spirits", 
    icon: Wine, 
    count: 45, 
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&h=400&fit=crop",
    description: "Fine wines, rare spirits, and vintage collections",
    featured: ["Vintage Wine", "Whiskey", "Champagne"]
  },
  { 
    id: 'furniture', 
    name: "Furniture", 
    icon: Sofa, 
    count: 89, 
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop",
    description: "Designer furniture and home decor",
    featured: ["Modern", "Vintage", "Outdoor"]
  },
  { 
    id: 'vehicles', 
    name: "Vehicles", 
    icon: Car, 
    count: 34, 
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop",
    description: "Cars, boats, and recreational vehicles",
    featured: ["Cars", "Boats", "RVs"]
  }
]

const notificationsData = [
  { id: 1, type: 'bid', title: 'You were outbid!', message: 'Someone placed a higher bid', time: '2 min ago', read: false, icon: DollarSign, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { id: 2, type: 'message', title: 'New message', message: 'Seller replied to your question', time: '15 min ago', read: false, icon: MessageCircle, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { id: 3, type: 'win', title: 'Auction Ending Soon!', message: 'Item ends in 30 minutes', time: '1 hour ago', read: false, icon: Timer, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  { id: 4, type: 'shipping', title: 'Item Shipped', message: 'Your item has been shipped', time: '3 hours ago', read: true, icon: Package, color: 'text-green-500', bgColor: 'bg-green-500/10' }
]

export default function Categories() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Auctus Logo" className="h-10 lg:h-12 w-auto object-contain" />
            </Link>

            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="text" placeholder="Search categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
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
      <div className="bg-gradient-to-br from-auctus-navy via-[#162C46] to-[#0A1828] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl lg:text-5xl font-black text-white mb-4">Browse Categories</h1>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">Explore our diverse collection of auction categories and find exactly what you're looking for</p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <div key={category.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 hover:border-auctus-teal/50 dark:hover:border-auctus-teal/50 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/live-auctions?category=${category.id}`)}>
              <div className="relative h-48 overflow-hidden">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-auctus-teal/90 rounded-lg">
                      <category.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md text-white text-xs font-bold rounded-full">{category.count} items</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{category.name}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.featured.map((item, idx) => (
                    <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg">{item}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-auctus-teal group-hover:text-auctus-cyan transition-colors">Browse Auctions</span>
                  <ArrowUpRight className="w-5 h-5 text-auctus-teal group-hover:text-auctus-cyan group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
