import { useState, useEffect } from 'react'
import { formatINR } from '../lib/currency'
import { Link, useNavigate } from 'react-router-dom'
import {
  Gavel, PlusCircle, Wallet2, BarChart3,
  ArrowRight, ArrowUpRight, CheckCircle2,
  Store, LogOut, Home, TrendingUp, DollarSign, Package, Eye,
  Activity, Award, Zap, Shield, Bell, Star, Target,
  ChevronRight, CircleDollarSign, Layers, Clock, Loader2,
  Calendar, Users, Briefcase, Settings, HelpCircle, Search
} from 'lucide-react'
import { apiGet } from '../lib/api'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

function sessionUser() {
  try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function SellerDashboard() {
  const u = sessionUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [period, setPeriod] = useState('14d')
  
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('accessToken')
        const res = await apiGet(`/api/analytics/dashboard?period=${period}`, token)
        if (res.ok && res.data?.success) {
          setAnalytics(res.data.data)
        }
      } catch (err) {
        console.error('Failed to load analytics', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [period])

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#060813] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-black tracking-widest text-xs uppercase">Initializing Hub...</p>
      </div>
    )
  }

  const stats = [
    { label: 'Revenue (14d)', value: formatINR(analytics?.summary.totalGross || 0), change: '+12.5%', icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Active Lots', value: analytics?.summary.live || '0', change: 'Live Now', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Bid Engagement', value: analytics?.summary.avgBidsPerAuction || '0', change: 'Bids/Lot', icon: Users, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { label: 'Sales Velocity', value: `${analytics?.summary.successRate || 0}%`, change: 'Success', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060813] text-slate-900 dark:text-white flex transition-colors">
      
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} hidden lg:flex flex-col bg-white dark:bg-[#0B0F21] border-r border-slate-200 dark:border-white/5 transition-all duration-300 z-50`}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && <span className="font-black text-xl tracking-tight">AUCTUS</span>}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <NavItem icon={Package} label="Auctions" to="/seller/dashboard" active={true} open={sidebarOpen} />
          <NavItem icon={PlusCircle} label="New Auction" to="/seller/auctions/new" open={sidebarOpen} />
          <NavItem icon={Wallet2} label="Payouts" to="/seller/payouts" open={sidebarOpen} />
          <div className="pt-4 pb-2 px-2">
            <div className="h-px bg-slate-200 dark:bg-white/5" />
          </div>
          <NavItem icon={Home} label="Back to Platform" to="/" open={sidebarOpen} />
          <NavItem icon={Settings} label="Settings" open={sidebarOpen} />
          <NavItem icon={HelpCircle} label="Support" open={sidebarOpen} />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <button onClick={logout} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold text-sm">
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Canvas ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto max-h-screen">
        
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#060813]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Search bar removed per simplification request */}
            </div>
            <div className="flex items-center gap-4">
              {/* Notifications removed per simplification request */}
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-white/10">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black">{u?.name || 'Seller'}</p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Enterprise Seller</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/10 flex items-center justify-center font-black text-blue-500">
                  {u?.name?.[0] || 'S'}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10">
          
          {/* Welcome Area */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                Market Performance Overview
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Real-time database insights for your auction empire.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-white dark:bg-[#0B0F21] border border-slate-200 dark:border-white/5 rounded-xl p-1 shadow-sm">
                <button onClick={() => setPeriod('14d')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${period === '14d' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}>14 Days</button>
                <button onClick={() => setPeriod('month')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${period === 'month' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}>Month</button>
                <button onClick={() => setPeriod('all')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${period === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}>All</button>
              </div>
              <Link to="/seller/auctions/new" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> New Lot
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(s => (
              <div key={s.label} className="bg-white dark:bg-[#0B0F21] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm group hover:border-blue-500/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${s.bg}`}>
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">{s.change}</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-3xl font-black mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Trend Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-[#0B0F21] rounded-[32px] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-blue-500" /> Revenue History
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black">Daily sales volume across all lots</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0F21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold' }}
                      formatter={(v) => formatINR(v)}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-white dark:bg-[#0B0F21] rounded-[32px] p-8 border border-slate-200 dark:border-white/5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8">Category Spread</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics?.categorySplit || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {analytics?.categorySplit.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0B0F21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {analytics?.categorySplit.slice(0, 4).map((c, idx) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-bold text-slate-500">{c.name}</span>
                    </div>
                    <span className="font-black">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Pipelines and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pipeline Stages */}
            <div className="bg-white dark:bg-[#0B0F21] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
              <h3 className="text-xl font-black mb-8 flex items-center gap-2">
                <Package className="w-6 h-6 text-indigo-500" /> Listing Status
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <StatusItem label="UPCOMING (7D)" count={analytics?.summary.upcoming} icon={Clock} color="text-blue-500" bg="bg-blue-500/10" />
                <StatusItem label="LIVE" count={analytics?.summary.live} icon={Activity} color="text-emerald-500" bg="bg-emerald-500/10" />
                <StatusItem label="CLOSED" count={analytics?.summary.closed} icon={CheckCircle2} color="text-slate-400" bg="bg-slate-500/10" />
              </div>
            </div>

            {/* Recent Activity Mock */}
            <div className="bg-white dark:bg-[#0B0F21] p-8 rounded-[32px] border border-slate-200 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Zap className="w-6 h-6 text-amber-500" /> Recent Activity
                </h3>
                <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">LIVE FEED</span>
              </div>
              <div className="space-y-6">
                {(analytics?.recentActivity || []).length > 0 ? (
                  analytics.recentActivity.map((activity, i) => (
                    <ActivityItem 
                      key={i}
                      title={activity.title} 
                      desc={activity.desc} 
                      time={activity.timeLabel} 
                      icon={activity.type === 'auction' ? Gavel : activity.type === 'bid' ? TrendingUp : Wallet2} 
                    />
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No activity in this period.</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

function NavItem({ icon: Icon, label, to, active, open }) {
  return (
    <Link to={to || '#'} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      {open && <span className="font-bold text-sm tracking-tight">{label}</span>}
    </Link>
  )
}

function StatusItem({ label, count, icon: Icon, color, bg }) {
  return (
    <div className="text-center">
      <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center ${bg} mb-3`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <p className="text-2xl font-black tracking-tight">{count}</p>
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">{label}</p>
    </div>
  )
}

function ActivityItem({ title, desc, time, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 group">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{time}</span>
    </div>
  )
}
