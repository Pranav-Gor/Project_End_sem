import React, { useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B152A] text-slate-900 dark:text-white flex flex-col font-sans relative overflow-hidden transition-colors duration-500 selection:bg-auctus-teal/30">
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
