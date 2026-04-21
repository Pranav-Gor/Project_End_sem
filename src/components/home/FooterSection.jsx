import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { apiPost } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';

export default function FooterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { ok, data } = await apiPost('/api/newsletter/subscribe', { email });
      if (ok && data?.success) {
        addToast(data.message || 'Successfully subscribed to the newsletter!', 'success');
        setEmail('');
      } else {
        addToast(data?.message || 'Failed to subscribe. Try again.', 'error');
      }
    } catch (error) {
      addToast('An error occurred while subscribing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-white dark:bg-[#060D1A] pt-20 pb-10 border-t border-slate-200 dark:border-white/5 relative z-10 transition-colors duration-500 overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-auctus-teal/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-auctus-cyan/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Link to="/" className="inline-block">
              <span className="text-3xl font-black tracking-widest text-slate-900 dark:text-white uppercase transition-colors hover:text-auctus-teal dark:hover:text-auctus-cyan">
                Auctus.
              </span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-sm">
              The world's most exclusive marketplace for premium auctions. Discover extraordinary art, vehicles, and collectibles, curated for the modern connoisseur.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-auctus-teal hover:text-white transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-auctus-teal hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-auctus-teal hover:text-white transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-auctus-teal hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="lg:col-span-2">
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 tracking-wide">Marketplace</h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="/live-auctions" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">Live Auctions</Link></li>
              <li><Link to="/upcoming-auctions" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">Upcoming Events</Link></li>
              <li><Link to="/closed-auctions" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">See All Past Auctions</Link></li>
              <li><a href="#" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">Top Sellers</a></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2">
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 tracking-wide">Required Documents</h3>
            <ul className="flex flex-col gap-4">
              <li className="text-slate-500 text-xs font-medium uppercase tracking-wider">KYC Verification</li>
              <li className="text-slate-500 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-auctus-teal"></div>
                PAN Card
              </li>
              <li className="text-slate-500 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-auctus-teal"></div>
                GST Certificate
              </li>
              <li className="text-slate-500 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-auctus-teal"></div>
                Bank Proof
              </li>
              <li className="text-slate-500 text-sm font-medium flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-auctus-teal"></div>
                Address Proof
              </li>
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="lg:col-span-2">
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 tracking-wide">Resources</h3>
            <ul className="flex flex-col gap-4">
              <li><Link to="/how-it-works" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">How it Works</Link></li>
              <li><Link to="/bidding-rules" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">Bidding Rules</Link></li>
              <li><Link to="/seller-terms" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">Seller Terms</Link></li>
              <li><Link to="/faq" className="text-slate-500 hover:text-auctus-teal transition-colors text-sm font-medium">Help & FAQ</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-4">
            <h3 className="text-slate-900 dark:text-white font-bold mb-6 tracking-wide">Stay Updated</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Join our mailing list to receive exclusive updates on high-value drops and upcoming collections.
            </p>
            <form className="relative group" onSubmit={handleSubscribe}>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-14 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-auctus-teal/50 transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={loading || !email}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-auctus-teal text-white flex items-center justify-center hover:bg-auctus-cyan transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm font-medium">
            &copy; {new Date().getFullYear()} Auctus Auction Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Privacy Policy</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Terms of Service</a>
            <a href="#" className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-medium">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
