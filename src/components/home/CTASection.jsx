import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel, UserPlus } from 'lucide-react';
import { useSessionUser } from '../../hooks/useSessionUser';

export default function CTASection() {
  const user = useSessionUser();

  return (
    <section className="py-20 px-6 relative z-10 bg-slate-50 dark:bg-[#0B152A] transition-colors duration-500">
      <div className="max-w-6xl mx-auto relative overflow-hidden rounded-[3rem] p-10 md:p-20 text-center border border-slate-200 dark:border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
        {/* Animated Blobs similar to Login Page */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-auctus-teal/40 rounded-full mix-blend-color-dodge filter blur-[120px] opacity-70 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-auctus-cyan/30 rounded-full mix-blend-color-dodge filter blur-[140px] opacity-60 animate-blob" style={{ animationDelay: '3000ms' }}></div>
        <div className="absolute top-[30%] left-[30%] w-[400px] h-[400px] bg-blue-500/30 rounded-full mix-blend-color-dodge filter blur-[100px] opacity-50 animate-blob" style={{ animationDelay: '5000ms' }}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-[#162C46]/90 dark:to-[#0A1828]/90 z-0"></div>
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 pointer-events-none"></div>

        <div className="relative z-10 scroll-reveal">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 drop-shadow-lg tracking-tight">
            {user ? 'Ready to Win Your Next' : 'Ready to Win Your First'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-auctus-cyan to-auctus-teal">Auction</span>?
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto mb-10 drop-shadow-md">
            {user 
              ? 'Browse live auctions, place your bids, and win extraordinary items. Your wallet is ready for action.'
              : 'Create an account instantly. Verify your identity and deposit funds to start placing real-time bids on the world\'s most exclusive items.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
            {user ? (
              <Link to="/live-auctions" className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white font-extrabold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-glow focus:ring-4 focus:ring-white/30 text-lg flex justify-center items-center gap-2 group">
                <Gavel className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Browse Live Auctions
              </Link>
            ) : (
              <Link to="/auth" className="w-full sm:w-auto px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-auctus-navy font-extrabold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-glow focus:ring-4 focus:ring-slate-400/30 dark:focus:ring-white/30 text-lg flex justify-center items-center gap-2 group">
                <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Join Auctus Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
