import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import HomeNavbar from '../components/home/HomeNavbar';
import HeroSection from '../components/home/HeroSection';
import FeaturedLiveAuctionsSection from '../components/home/FeaturedLiveAuctionsSection';
import UpcomingAuctionsSection from '../components/home/UpcomingAuctionsSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import CTASection from '../components/home/CTASection';
import FooterSection from '../components/home/FooterSection';

export default function Home() {
  // Scroll reveal animation for all .scroll-reveal elements across components
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    const observeElements = () => {
      const elements = document.querySelectorAll('.scroll-reveal');
      elements.forEach((el) => observer.observe(el));
    };

    observeElements();
    
    // In case child components render slightly after mount
    setTimeout(observeElements, 100);

    return () => observer.disconnect();
  }, []);

  const [flashMsg, setFlashMsg] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('auctusAuthFlash');
      if (stored) {
        setFlashMsg(JSON.parse(stored));
        sessionStorage.removeItem('auctusAuthFlash');
        // Auto-hide after 6 seconds
        setTimeout(() => setFlashMsg(null), 6000);
      }
    } catch (err) {
      // ignore
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B152A] text-slate-900 dark:text-white flex flex-col font-sans relative overflow-hidden transition-colors duration-500 selection:bg-auctus-teal/30">
      {flashMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-fade-down">
          <div className={`p-4 rounded-xl border shadow-2xl flex gap-3 items-start ${
            flashMsg.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100'
              : 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-100'
          }`}>
            <div className="mt-0.5">
              {flashMsg.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-1">{flashMsg.type === 'success' ? 'Success' : 'Notice'}</h4>
              <p className="text-sm opacity-90">{flashMsg.message}</p>
            </div>
            <button onClick={() => setFlashMsg(null)} className="opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Background atmospheric glow - Hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-auctus-teal/5 dark:bg-auctus-teal/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen opacity-70"></div>

      <HomeNavbar />
      <HeroSection />
      <FeaturedLiveAuctionsSection />
      <UpcomingAuctionsSection />
      <HowItWorksSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
