import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ChevronRight, Calendar, Shield, Users, ArrowDownCircle } from 'lucide-react';

export default function HeroSection() {
  return (
    <>
      <main className="flex flex-col items-center justify-center px-4 pt-24 pb-16 relative z-10 text-center animate-fade-up min-h-[75vh]">
        
        {/* Active Auctions Pill */}
        <div className="inline-flex items-center gap-2 bg-white dark:bg-[#162640] border border-slate-200 dark:border-auctus-teal/20 rounded-full px-5 py-2 mb-8 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-[#1A2E4C] transition-colors cursor-default">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse"></div>
          <span className="text-sm font-semibold text-slate-700 dark:text-teal-50 tracking-wide">
            127 Active Auctions Right Now
          </span>
        </div>

        {/* Hero Headlines */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 tracking-tight text-slate-900 dark:text-white leading-[1.1]">
          Discover Extraordinary<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-auctus-teal to-auctus-cyan drop-shadow-sm">Auctions & Deals</span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Join thousands of collectors and enthusiasts in the world's most trusted premium auction marketplace. Unmatched quality, verified sellers.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-5 mb-16">
          <Link to="/live-auctions" className="group flex items-center gap-2 bg-gradient-to-r from-auctus-teal to-auctus-cyan text-white px-8 py-4 rounded-xl font-bold transition-all hover:shadow-glow-hover hover:-translate-y-1 active:scale-95 text-lg">
            <Zap className="w-5 h-5 fill-white/20" />
            Start Bidding Now
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </Link>
          <Link to="/upcoming-auctions" className="group flex items-center gap-2 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/20 text-slate-900 dark:text-white px-8 py-4 rounded-xl font-bold hover:bg-white/90 dark:hover:bg-white/10 hover:-translate-y-1 transition-all active:scale-95 text-lg">
            <Calendar className="w-5 h-5 text-auctus-cyan group-hover:rotate-12 transition-transform" />
            Explore Upcoming
          </Link>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer group" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
          <span className="text-sm font-bold text-auctus-teal tracking-widest uppercase">Scroll to explore</span>
          <ArrowDownCircle className="w-8 h-8 text-auctus-cyan animate-bounce shadow-auctus-cyan/50 drop-shadow-lg" />
        </div>
      </main>

      {/* Footer Features (Hero Extension) */}
      <div className="w-full max-w-5xl mx-auto px-4 pb-20 relative z-10 scroll-reveal" style={{ animationDelay: '200ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="scroll-reveal scroll-delay-100 flex items-center gap-4 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 dark:hover:border-white/20 group">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#162A45] flex items-center justify-center border border-slate-200 dark:border-auctus-teal/20 group-hover:scale-110 transition-transform">
              <Shield className="w-6 h-6 text-auctus-teal" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">Escrow Protected</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Every transaction</p>
            </div>
          </div>
          
          <div className="scroll-reveal scroll-delay-200 flex items-center gap-4 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 dark:hover:border-white/20 group">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#162A45] flex items-center justify-center border border-slate-200 dark:border-auctus-cyan/20 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-auctus-cyan" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">50K+ Verified Users</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Worldwide community</p>
            </div>
          </div>

          <div className="scroll-reveal scroll-delay-300 flex items-center gap-4 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/[0.07] border border-slate-200 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 dark:hover:border-white/20 group">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#162A45] flex items-center justify-center border border-slate-200 dark:border-auctus-teal/20 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-auctus-teal" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">Real-time Bidding</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Instant notifications</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
