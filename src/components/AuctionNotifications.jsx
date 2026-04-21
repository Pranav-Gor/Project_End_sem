import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, CheckCircle, Mail, Phone, User } from 'lucide-react'
import { apiGet, apiPost } from '../lib/api'

export default function AuctionNotifications() {
  const [notifications, setNotifications] = useState({ won: [], sold: [] })
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Only check if logged in. Checking localStorage for a session is simple.
    const session = localStorage.getItem('auctus_session')
    if (!session) return

    const fetchNotifications = async () => {
      try {
        const { ok, data } = await apiGet('/api/auctions/notifications/pending')
        if (ok && data?.success && data.data) {
          setNotifications(data.data)
        }
      } catch (err) {
        console.error('Failed to fetch pending notifications', err)
      }
    }
    
    // Fetch immediately
    fetchNotifications()
    
    // And set up a poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const currentNotification = () => {
    const totalWon = notifications.won.length
    if (currentIndex < totalWon) {
      return { type: 'won', data: notifications.won[currentIndex] }
    }
    const soldIndex = currentIndex - totalWon
    if (soldIndex < notifications.sold.length) {
      return { type: 'sold', data: notifications.sold[soldIndex] }
    }
    return null
  }

  const handleAcknowledge = async () => {
    const curr = currentNotification()
    if (!curr) return

    try {
      await apiPost('/api/auctions/notifications/mark-read', {
        type: curr.type === 'sold' ? 'seller' : 'winner',
        auctionId: curr.data.auctionId
      })
      
      // Move to next notification
      setCurrentIndex(prev => prev + 1)
    } catch (err) {
      console.error('Failed to mark notification read', err)
      // Optimistically move to next anyway
      setCurrentIndex(prev => prev + 1)
    }
  }

  const notification = currentNotification()

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, type: 'spring' }}
          className="fixed bottom-6 right-6 z-[100] w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className={`p-4 flex items-center justify-between ${notification.type === 'won' ? 'bg-gradient-to-r from-auctus-teal to-auctus-cyan' : 'bg-gradient-to-r from-emerald-500 to-green-500'}`}>
              <div className="flex items-center gap-3 text-white">
                {notification.type === 'won' ? <Trophy size={24} /> : <CheckCircle size={24} />}
                <h3 className="font-bold text-lg">
                  {notification.type === 'won' ? 'Congratulations! You Won' : 'Auction Sold!'}
                </h3>
              </div>
              <button onClick={handleAcknowledge} className="text-white/80 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <p className="font-semibold text-slate-800 dark:text-white text-lg mb-4">
                {notification.data.title}
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Final Price</span>
                  <span className="font-bold text-slate-900 dark:text-white text-lg">₹{notification.data.finalBid?.toLocaleString('en-IN')}</span>
                </div>
                
                <div className="h-px w-full bg-slate-200 dark:bg-slate-700"></div>
                
                {notification.type === 'won' ? (
                  <>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Seller Contact Details:</p>
                    {notification.data.seller ? (
                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2"><User size={14} className="text-auctus-teal"/> {notification.data.seller.name}</div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-auctus-teal"/> {notification.data.seller.email}</div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-auctus-teal"/> {notification.data.seller.phone}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Seller details not available</p>
                    )}
                    <div className="mt-4 p-3 bg-auctus-teal/10 rounded-lg text-sm text-auctus-teal font-medium">
                      The seller will contact you shortly to arrange payment and shipping.
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Winner Contact Details:</p>
                    {notification.data.winner ? (
                      <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2"><User size={14} className="text-emerald-500"/> {notification.data.winner.name}</div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-emerald-500"/> {notification.data.winner.email}</div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-emerald-500"/> {notification.data.winner.phone}</div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No winner details available</p>
                    )}
                    <div className="mt-4 p-3 bg-emerald-500/10 rounded-lg text-sm text-emerald-600 font-medium">
                      Please contact the winner to finalize the transaction.
                    </div>
                  </>
                )}
              </div>
              
              <button 
                onClick={handleAcknowledge}
                className={`mt-6 w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95
                  ${notification.type === 'won' ? 'bg-gradient-to-r from-auctus-teal to-auctus-cyan shadow-auctus-teal/20' : 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/20'}`}
              >
                Acknowledge
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
