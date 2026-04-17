import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Eye, BellRing, X, ChevronLeft, TrendingUp, Users, Sparkles, Image as ImageIcon, Loader2, PackageSearch } from 'lucide-react';
import { useSessionUser } from '../../hooks/useSessionUser';
import { apiGet } from '../../lib/api';

// ---------------------------------------------------------------------------
// Skeleton card shown while loading
// ---------------------------------------------------------------------------
function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white dark:bg-[#0B152A] border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col animate-pulse">
      <div className="h-56 bg-slate-200 dark:bg-white/5" />
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="h-5 rounded-full bg-slate-200 dark:bg-white/5 w-3/4" />
        <div className="h-4 rounded-full bg-slate-200 dark:bg-white/5 w-1/2" />
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <div className="h-4 rounded-full bg-slate-200 dark:bg-white/5 w-1/3" />
          <div className="h-9 w-28 rounded-xl bg-slate-200 dark:bg-white/5" />
        </div>
      </div>
    </div>
  );
}

export default function UpcomingAuctionsSection() {
  const navigate = useNavigate();
  const user = useSessionUser();

  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedAuction, setSelectedAuction] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ---------------------------------------------------------------------------
  // Fetch upcoming auctions from the backend
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await apiGet('/api/auctions/upcoming');
        if (!cancelled) {
          if (res.ok && res.data?.data?.auctions) {
            setAuctions(res.data.data.auctions);
          } else {
            setError(res.data?.message || 'Failed to load auctions.');
          }
        }
      } catch (err) {
        if (!cancelled) setError('Could not connect to server.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleViewAllClick = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth?reason=login');
    } else {
      navigate('/upcoming-auctions');
    }
  };

  const openModal = (auction) => {
    setSelectedAuction(auction);
    setCurrentImageIndex(0);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedAuction(null);
    document.body.style.overflow = 'unset';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (selectedAuction) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedAuction.images.length);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (selectedAuction) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedAuction.images.length) % selectedAuction.images.length);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <section className="py-24 bg-slate-100 dark:bg-[#060D1A] transition-colors duration-500 relative z-10 border-t border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 scroll-reveal">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Calendar className="w-4 h-4" />
                Starting Soon
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Upcoming <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-auctus-cyan">Masterpieces</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-3 font-medium max-w-xl">
                Preview the most anticipated collections hitting the auction block this week. Register your interest and set reminders before bidding opens.
              </p>
            </div>

            <button
              onClick={handleViewAllClick}
              className="group flex items-center gap-2 text-blue-500 font-bold hover:text-blue-400 transition-colors"
            >
              View All Upcoming
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* ---- Loading State ---- */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* ---- Error State ---- */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <PackageSearch className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">{error}</p>
            </div>
          )}

          {/* ---- Empty State ---- */}
          {!loading && !error && auctions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300">No upcoming auctions in the next 7 days</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm">Check back soon — new masterpieces are added regularly.</p>
            </div>
          )}

          {/* ---- Auctions Grid ---- */}
          {!loading && !error && auctions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {auctions.map((auction, index) => (
                <div
                  key={auction.id}
                  onClick={() => openModal(auction)}
                  className="scroll-reveal group cursor-pointer rounded-3xl bg-white dark:bg-[#0B152A] border border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 flex flex-col"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Image Container */}
                  <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-[#050A14] flex items-center justify-center p-4">
                    {auction.images.length > 0 ? (
                      <img
                        src={auction.images[0]}
                        alt={auction.title}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <ImageIcon className="w-10 h-10 opacity-30" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent pointer-events-none" />

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-bold shadow-sm">
                      {auction.category}
                    </div>

                    {/* Images count */}
                    {auction.images.length > 1 && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <ImageIcon className="w-3.5 h-3.5" />
                        {auction.images.length}
                      </div>
                    )}
                  </div>

                  {/* Content Container */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-500 transition-colors">
                      {auction.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-6">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-500/20">
                        <Eye className="w-3.5 h-3.5" />
                        Est. Value: {auction.estimatedValue}
                      </span>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Starts In</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          {auction.startsIn}
                        </p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-blue-500 hover:text-white dark:hover:bg-blue-500 transition-colors border border-slate-200 dark:border-white/10 group-hover:border-blue-500/50"
                      >
                        <BellRing className="w-4 h-4" />
                        Remind Me
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* Item Details Modal */}
      {selectedAuction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative bg-white dark:bg-[#060D1A] rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row shadow-2xl border border-slate-200 dark:border-blue-500/20 overflow-hidden">

            {/* Close Button */}
            <button onClick={closeModal} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-100/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white backdrop-blur-md transition-colors shadow-sm">
              <X className="w-5 h-5" />
            </button>

            {/* Left: Image Carousel */}
            <div className="w-full md:w-1/2 relative bg-slate-100 dark:bg-[#03070E] flex flex-col items-center justify-center h-[350px] md:h-auto shrink-0 p-4">
              {selectedAuction.images.length > 0 ? (
                <img
                  src={selectedAuction.images[currentImageIndex]}
                  alt={`${selectedAuction.title} - View ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain md:absolute md:inset-0 md:p-6"
                  loading="lazy"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <ImageIcon className="w-16 h-16 opacity-20" />
                  <span className="text-sm">No images available</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

              {selectedAuction.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/80 transition-colors backdrop-blur-md hover:scale-105 z-10">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/80 transition-colors backdrop-blur-md hover:scale-105 z-10">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20 w-max bg-black/20 p-2 rounded-2xl backdrop-blur-sm">
                    {selectedAuction.images.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 bg-slate-200 dark:bg-white/5 ${idx === currentImageIndex ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={imgSrc} alt="thumbnail" className="w-full h-full object-contain" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: Info Area */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white dark:bg-[#060D1A] overflow-y-auto">
              <div className="mb-6 border-b border-slate-200 dark:border-white/10 pb-6 shrink-0 pr-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-block px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/20">
                    {selectedAuction.category}
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-500/20 shadow-sm shadow-blue-500/10">
                    <Sparkles className="w-4 h-4" />
                    Highly Anticipated
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{selectedAuction.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed">
                  {selectedAuction.description}
                </p>
              </div>

              {/* Hype Stats */}
              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-5 mb-8 border border-slate-200 dark:border-white/5 shrink-0 flex items-center justify-around">
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg mb-2">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="block font-black text-slate-900 dark:text-white text-lg">{selectedAuction.hypeStats.followers}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Watching</span>
                </div>
                <div className="w-px h-12 bg-slate-200 dark:bg-white/10"></div>
                <div className="text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg mb-2">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="block font-black text-slate-900 dark:text-white text-lg">{selectedAuction.hypeStats.expectedBidders}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Est. Bidders</span>
                </div>
              </div>

              {/* Remind Me Block */}
              <div className="flex-1 shrink-0 pb-4 flex flex-col justify-end">
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-5 rounded-2xl border border-blue-500/30 mb-5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-400/20 blur-2xl group-hover:bg-blue-400/30 transition-colors"></div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-2">Estimated Value</p>
                    <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 mb-6 drop-shadow-sm">
                      {selectedAuction.estimatedValue}
                    </p>
                    <button className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-lg shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all flex items-center justify-center gap-3 group/btn hover:-translate-y-0.5">
                      <BellRing className="w-6 h-6 group-hover/btn:animate-bounce" />
                      Set Reminder • {selectedAuction.startsIn}
                    </button>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 font-medium flex items-center gap-1.5 justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                      We'll notify you 1 hour before bidding goes live
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
