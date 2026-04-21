import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, Settings, Clock, Zap, Shield,
  Save, Loader2, CheckCircle2, Store
} from 'lucide-react'

export default function SellerSettings() {
  const [activeTab, setActiveTab] = useState('timing')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load from local storage initially
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('sellerSettings')
      if (stored) return JSON.parse(stored)
    } catch {}
    return {
      defaultDurationDays: '3',
      autoExtendMinutes: '5',
      autoExtendCondition: 'bids-last-5-min',
      notifyOnOutbid: true,
      notifyOnEnd: true
    }
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setLoading(true)
    // Simulate backend call
    await new Promise(resolve => setTimeout(resolve, 800))
    localStorage.setItem('sellerSettings', JSON.stringify(settings))
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060813] text-slate-900 dark:text-white transition-colors">
      
      {/* ── Sidebar (Hidden on mobile, just for consistency if needed, but here we'll use simple header) ── */}
      <div className="bg-gradient-to-br from-[#0D1535] via-[#0B1228] to-[#070A18] border-b border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <Link to="/seller/dashboard" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-4 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg border border-white/10">
              <Settings className="w-6 h-6 text-slate-300" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                Seller Configuration
              </h1>
              <p className="mt-1 text-sm text-slate-400 font-medium">Manage default behaviors, timing preferences, and notifications.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row gap-8">
        
        {/* Tabs sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <button 
            onClick={() => setActiveTab('timing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'timing' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Clock className="w-5 h-5" /> Auction Timing
          </button>
          <button 
            onClick={() => setActiveTab('store')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'store' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Store className="w-5 h-5" /> Store Profile
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            <Shield className="w-5 h-5" /> Security & Privacy
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 bg-white dark:bg-[#0B1028] rounded-3xl border border-slate-200 dark:border-white/5 p-6 sm:p-8 shadow-xl">
          
          {activeTab === 'timing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> Crucial Timing Settings
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Auction timing makes a huge difference in bidder engagement. Configure how your lots handle the critical final minutes.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Default Duration (Days)</label>
                  <select 
                    name="defaultDurationDays" 
                    value={settings.defaultDurationDays} 
                    onChange={handleChange}
                    className="w-full md:w-1/2 h-12 px-4 rounded-xl border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/20 focus:ring-2 focus:ring-blue-500/40 outline-none text-sm font-medium"
                  >
                    <option value="1">1 Day (Rapid)</option>
                    <option value="2">2 Days</option>
                    <option value="3">3 Days (Recommended)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Anti-Sniper Settings (Auto-Extend)</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        name="notifyOnOutbid"
                        checked={settings.notifyOnOutbid}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-100 dark:bg-black/20 border-slate-300 dark:border-white/10"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Enable Smart Extension</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Automatically extend the auction time if a bid is placed near the end.</p>
                      </div>
                    </div>

                    {settings.notifyOnOutbid && (
                      <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Extend By (Minutes)</label>
                          <select 
                            name="autoExtendMinutes" 
                            value={settings.autoExtendMinutes} 
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/20 outline-none text-sm"
                          >
                            <option value="1">1 Minute</option>
                            <option value="3">3 Minutes</option>
                            <option value="5">5 Minutes</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Condition</label>
                          <select 
                            name="autoExtendCondition" 
                            value={settings.autoExtendCondition} 
                            onChange={handleChange}
                            className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-black/20 outline-none text-sm"
                          >
                            <option value="bids-last-1-min">Bid in last 1 minute</option>
                            <option value="bids-last-3-min">Bid in last 3 minutes</option>
                            <option value="bids-last-5-min">Bid in last 5 minutes</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab !== 'timing' && (
            <div className="py-12 text-center">
              <Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Under Construction</h3>
              <p className="text-sm text-slate-500 mt-2">These settings are being migrated to the new backend schema.</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-white/5 flex items-center justify-end gap-4">
            {saved && (
              <span className="text-sm font-bold text-emerald-500 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> Settings saved!
              </span>
            )}
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Preferences
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
