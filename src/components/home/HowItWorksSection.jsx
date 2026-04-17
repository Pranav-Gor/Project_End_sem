import React, { useEffect, useState, useRef } from 'react';
import { UserPlus, Shield, Wallet, Gavel, Trophy } from 'lucide-react';

export default function HowItWorksSection() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRef = useRef(null);
  const [stepProgress, setStepProgress] = useState([0, 0, 0, 0, 0]);

  // Handle scroll to grow the tree trunk and branches
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const { top, height } = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how far down the section we've scrolled (0 to 1)
      // We want the line to start drawing as soon as the top of the section enters the screen
      const start = windowHeight;
      const end = -height;

      // Calculate global trunk progress
      let newProgress = (start - top) / (start - end);
      newProgress = Math.min(Math.max(newProgress, 0), 1);
      setScrollProgress(newProgress);

      // Enhanced parallax effect for step cards
      const steps = document.querySelectorAll('.scroll-step');
      const newStepProgress = [0, 0, 0, 0, 0];

      steps.forEach((step, index) => {
        const rect = step.getBoundingClientRect();
        const stepCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;
        const distance = (stepCenter - viewportCenter) / windowHeight;

        // Parallax transform
        const translateY = distance * -70;
        const opacity = Math.max(0.2, 1 - Math.abs(distance) * 0.8);
        const scale = Math.max(0.85, 1 - Math.abs(distance) * 0.15);

        if (rect.top < windowHeight && rect.bottom > 0) {
          step.style.transform = `translateY(${translateY}px) scale(${scale})`;
          step.style.opacity = opacity;

          // Determine if the branch should be visible (if the card is in the middle 60% of viewport)
          if (Math.abs(distance) < 0.3) {
            newStepProgress[index] = 1;
            step.classList.add('active-step');
          } else {
            newStepProgress[index] = 0;
            step.classList.remove('active-step');
          }
        } else {
          step.style.transform = 'translateY(50px) scale(0.8)';
          step.style.opacity = '0';
          newStepProgress[index] = 0;
          step.classList.remove('active-step');
        }
      });

      setStepProgress(newStepProgress);
    };

    let ticking = false;
    const optimizedScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', optimizedScroll, { passive: true });
    handleScroll(); // Initial map
    return () => window.removeEventListener('scroll', optimizedScroll);
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-slate-50 dark:bg-[#0B152A] border-t border-slate-200 dark:border-white/5 relative z-10 overflow-hidden transition-colors duration-500">
      {/* Background atmospheric decorators */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-auctus-cyan/10 blur-[200px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-auctus-teal/10 blur-[200px] rounded-full pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-28">
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tight drop-shadow-xl transition-colors">How Auctus Works</h2>
        </div>

        {/* Tree Timeline Container */}
        <div className="relative py-10 flex flex-col gap-24 md:gap-40">

          {/* Main Central Trunk */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1.5 md:w-2 bg-slate-200 dark:bg-white/5 rounded-full hidden md:block z-0">
            {/* Growing glowing trunk */}
            <div
              className="w-full bg-gradient-to-b from-auctus-teal via-blue-500 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(24,160,152,0.8)] dark:shadow-[0_0_20px_rgba(24,160,152,1)] transition-all duration-300 ease-out origin-top"
              style={{ height: `${scrollProgress * 100}%` }}
            />
          </div>

          {/* STEP 1 */}
          <div className="scroll-step relative flex items-center justify-end md:pr-[50%] md:pr-8" style={{ zIndex: 10 }}>
            <div className="relative flex items-center gap-6 max-w-sm md:max-w-md transform-gpu transition-all duration-700 ease-out group">

              {/* Branch connecting perfectly to the trunk */}
              <div
                className="absolute right-[-2rem] top-1/2 -translate-y-1/2 h-1 bg-auctus-teal shadow-[0_0_10px_rgba(24,160,152,0.8)] rounded-full hidden md:block origin-left transition-all duration-700 ease-out"
                style={{ width: stepProgress[0] ? '2rem' : '0px', opacity: stepProgress[0] ? 1 : 0 }}
              />

              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-auctus-teal to-auctus-cyan border-4 border-slate-100 dark:border-[#0B152A] flex items-center justify-center shadow-2xl shadow-auctus-teal/40 z-10 relative">
                <UserPlus className="w-8 h-8 md:w-10 md:h-10 text-white group-[.active-step]:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-2xl bg-auctus-teal/40 blur-xl opacity-0 group-[.active-step]:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* CARD: Removed overlapping bg-white and dark:bg-gradient to fix pure white bug */}
              <div className="flex-1 rounded-2xl p-5 md:p-6 transition-all duration-500 group cursor-default shadow-lg dark:shadow-none bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/10 hover:border-auctus-teal/50">
                <div className="flex items-center gap-4">
                  <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-auctus-teal/80 dark:from-auctus-teal/40 to-transparent tracking-tighter">01</span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white group-[.active-step]:text-auctus-teal transition-colors duration-300 leading-tight">Create an<br />Account</h3>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 */}
          <div className="scroll-step relative flex items-center justify-start md:pl-[50%] md:pl-8" style={{ zIndex: 10 }}>
            <div className="relative flex items-center gap-6 max-w-sm md:max-w-md flex-row-reverse transform-gpu transition-all duration-700 ease-out group">

              {/* Branch connecting horizontally */}
              <div
                className="absolute left-[-2rem] top-1/2 -translate-y-1/2 h-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] rounded-full hidden md:block origin-right transition-all duration-700 ease-out"
                style={{ width: stepProgress[1] ? '2rem' : '0px', opacity: stepProgress[1] ? 1 : 0 }}
              />

              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-slate-100 dark:border-[#0B152A] flex items-center justify-center shadow-2xl shadow-blue-500/40 z-10 relative">
                <Shield className="w-8 h-8 md:w-10 md:h-10 text-white group-[.active-step]:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-2xl bg-blue-500/40 blur-xl opacity-0 group-[.active-step]:opacity-100 transition-opacity duration-500"></div>
              </div>

              <div className="flex-1 rounded-2xl p-5 md:p-6 transition-all duration-500 group cursor-default shadow-lg dark:shadow-none bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-500/50">
                <div className="flex items-center justify-end gap-4 flex-row-reverse">
                  <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-500/80 dark:from-blue-500/40 to-transparent tracking-tighter">02</span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white group-[.active-step]:text-blue-500 transition-colors duration-300 leading-tight text-right">Verify Your<br />Identity</h3>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div className="scroll-step relative flex items-center justify-end md:pr-[50%] md:pr-8" style={{ zIndex: 10 }}>
            <div className="relative flex items-center gap-6 max-w-sm md:max-w-md transform-gpu transition-all duration-700 ease-out group">
              <div
                className="absolute right-[-2rem] top-1/2 -translate-y-1/2 h-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] rounded-full hidden md:block origin-left transition-all duration-700 ease-out"
                style={{ width: stepProgress[2] ? '2rem' : '0px', opacity: stepProgress[2] ? 1 : 0 }}
              />
              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 border-4 border-slate-100 dark:border-[#0B152A] flex items-center justify-center shadow-2xl shadow-purple-500/40 z-10 relative">
                <Wallet className="w-8 h-8 md:w-10 md:h-10 text-white group-[.active-step]:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-2xl bg-purple-500/40 blur-xl opacity-0 group-[.active-step]:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="flex-1 rounded-2xl p-5 md:p-6 transition-all duration-500 group cursor-default shadow-lg dark:shadow-none bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/10 hover:border-purple-500/50">
                <div className="flex items-center gap-4">
                  <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-500/80 dark:from-purple-500/40 to-transparent tracking-tighter">03</span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white group-[.active-step]:text-purple-500 transition-colors duration-300 leading-tight">Deposit<br />Funds</h3>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div className="scroll-step relative flex items-center justify-start md:pl-[50%] md:pl-8" style={{ zIndex: 10 }}>
            <div className="relative flex items-center gap-6 max-w-sm md:max-w-md flex-row-reverse transform-gpu transition-all duration-700 ease-out group">
              <div
                className="absolute left-[-2rem] top-1/2 -translate-y-1/2 h-1 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] rounded-full hidden md:block origin-right transition-all duration-700 ease-out"
                style={{ width: stepProgress[3] ? '2rem' : '0px', opacity: stepProgress[3] ? 1 : 0 }}
              />
              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 border-4 border-slate-100 dark:border-[#0B152A] flex items-center justify-center shadow-2xl shadow-orange-500/40 z-10 relative">
                <Gavel className="w-8 h-8 md:w-10 md:h-10 text-white group-[.active-step]:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-2xl bg-orange-500/40 blur-xl opacity-0 group-[.active-step]:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="flex-1 rounded-2xl p-5 md:p-6 transition-all duration-500 group cursor-default shadow-lg dark:shadow-none bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/10 hover:border-orange-500/50">
                <div className="flex items-center justify-end gap-4 flex-row-reverse">
                  <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-500/80 dark:from-orange-500/40 to-transparent tracking-tighter">04</span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white group-[.active-step]:text-orange-500 transition-colors duration-300 leading-tight text-right">Start<br />Bidding</h3>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 5 */}
          <div className="scroll-step relative flex items-center justify-end md:pr-[50%] md:pr-8" style={{ zIndex: 10 }}>
            <div className="relative flex items-center gap-6 max-w-sm md:max-w-md transform-gpu transition-all duration-700 ease-out group">
              <div
                className="absolute right-[-2rem] top-1/2 -translate-y-1/2 h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-full hidden md:block origin-left transition-all duration-700 ease-out"
                style={{ width: stepProgress[4] ? '2rem' : '0px', opacity: stepProgress[4] ? 1 : 0 }}
              />
              <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 border-4 border-slate-100 dark:border-[#0B152A] flex items-center justify-center shadow-2xl shadow-emerald-500/40 z-10 relative">
                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white group-[.active-step]:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/40 blur-xl opacity-0 group-[.active-step]:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="flex-1 rounded-2xl p-5 md:p-6 transition-all duration-500 group cursor-default shadow-lg dark:shadow-none bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-white/10 dark:to-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50">
                <div className="flex items-center gap-4">
                  <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-500/80 dark:from-emerald-500/40 to-transparent tracking-tighter">05</span>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white group-[.active-step]:text-emerald-500 transition-colors duration-300 leading-tight">Win &<br />Receive</h3>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
