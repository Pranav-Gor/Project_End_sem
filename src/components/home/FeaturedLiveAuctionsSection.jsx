import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Gavel, ChevronRight, User, ShieldCheck, History, Award, X, ChevronLeft, TrendingUp, CheckCircle2, Image as ImageIcon } from 'lucide-react';
const mockPastAuctions = [
  {
    id: '1',
    title: '1962 Ferrari 250 GTO',
    images: [
      'https://ik.imagekit.io/p0pef1v4i/ferrari-250-gto-1962-743704.jpg',
      'https://ik.imagekit.io/p0pef1v4i/ferrari-250-gto-1962-743703.jpg',
      'https://ik.imagekit.io/p0pef1v4i/ferrari-250-gto-1962-743702.jpg',
      'https://ik.imagekit.io/p0pef1v4i/ferrari-250-gto-1962-743701.jpg'
    ],
    winningBid: '₹34,50,00,000',
    totalBids: 42,
    category: 'Classic Cars',
    description: 'A monument to automotive supremacy and unparalleled provenance, this 1962 Ferrari 250 GTO represents the golden era of motorsport...',
    winner: {
      name: 'Alexander R.',
      country: '🇮🇹 Italy',
      verified: true,
      time: 'Auction Closed'
    },
    history: {
      startingBid: '₹20,00,00,000',
      finalPrice: '₹34,50,00,000'
    }
  },

  {
    id: '2',
    title: 'Patek Philippe Grandmaster Chime',
    images: [
      'https://ik.imagekit.io/p0pef1v4i/33393291-tc2tehpbbxe3hz1k33uivt5b-ExtraLarge.jpg',
      'https://ik.imagekit.io/p0pef1v4i/6300gr-001-8-_x4000.jpg',
      'https://ik.imagekit.io/p0pef1v4i/patek-philippe-grand-complications-grandmaster-chime-6300gr-001-5.jpg',
      'https://ik.imagekit.io/p0pef1v4i/Patek-Philippe-Grandmaster-Chime-main.jpg'
    ],
    winningBid: '₹21,00,00,000',
    totalBids: 89,
    category: 'Luxury Watches',
    description: 'An absolute masterpiece of haute horlogerie representing over 100,000 hours of development...',
    winner: {
      name: 'Eleanor H.',
      country: '🇨🇭 Switz.',
      verified: true,
      time: 'Auction Closed'
    },
    history: {
      startingBid: '₹10,00,00,000',
      finalPrice: '₹21,00,00,000'
    }
  },

  {
    id: '3',
    title: '2025 Red Bull Racing RB21 (Max Verstappen)',
    images: [
      'https://ik.imagekit.io/p0pef1v4i/first-hq-picture-of-the-rb21-v0-p4yxcoe39ble1.jpeg_width=1080&crop=smart&auto=webp&s=91570aa3604977e0d2761b7dc036bc8c48195ca9',
      'https://ik.imagekit.io/p0pef1v4i/red-bull-rb-21-liam-lawson-in-bahrain2.jpg',
      'https://ik.imagekit.io/p0pef1v4i/rb21-lighting-edited-photos-v0-9mjw01yr1ale1.jpg_width=1080&crop=smart&auto=webp&s=021fdb5b32597f70767595f0c83146dea89e1912',
      'https://ik.imagekit.io/p0pef1v4i/some-pics-of-the-rb21-on-display-at-laguna-seca-earlier-v0-l5a1dcvn7nlf1.jpg_width=1080&crop=smart&auto=webp&s=f134ebee8998f513a78c225bfe6a62e58a02284b'
    ],
    winningBid: '₹55,00,00,000',
    totalBids: 184,
    category: 'F1 Memorabilia',
    description: 'Driven by Max Verstappen, the RB21 is the 2025 Formula One car designed and constructed by Red Bull Racing...',
    winner: {
      name: 'Christian H.',
      country: '🇬🇧 UK',
      verified: true,
      time: 'Auction Closed'
    },
    history: {
      startingBid: '₹30,00,00,000',
      finalPrice: '₹55,00,00,000'
    }
  }
];

export default function FeaturedLiveAuctionsSection() {
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openModal = (auction) => {
    setSelectedAuction(auction);
    setCurrentImageIndex(0);
    // Prevent scrolling when modal is open
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

  return (
    <>
      <section className="py-24 bg-white dark:bg-[#08101F] transition-colors duration-500 relative z-10 border-t border-slate-200 dark:border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 scroll-reveal">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Completed Auctions
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                Featured Highlights
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-3 font-medium max-w-xl">
                Explore the record-breaking sales from our exclusive past collections.
              </p>
            </div>
          </div>

          {/* Auctions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockPastAuctions.map((auction, index) => (
              <div
                key={auction.id}
                onClick={() => openModal(auction)}
                className="scroll-reveal group cursor-pointer rounded-3xl bg-slate-50 dark:bg-[#0B152A] border border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-2xl hover:shadow-auctus-teal/20 transition-all duration-500 flex flex-col relative"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Image Container */}
                <div className="relative h-64 overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 dark:bg-[#050A14] p-4">
                  <img
                    src={auction.images[0]}
                    alt={auction.title}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>

                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg">
                    {auction.category}
                  </div>

                  {/* Multiple Images Indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-bold shadow-lg">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {auction.images.length}
                  </div>

                  {/* Bids Info */}
                  <div className="absolute bottom-4 left-4 flex items-center justify-between w-[calc(100%-2rem)]">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/90 backdrop-blur-md text-white font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                      <Award className="w-4 h-4" />
                      Sold
                    </div>
                    <div className="flex items-center gap-1.5 text-white/90 text-sm font-semibold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                      <Gavel className="w-4 h-4" />
                      {auction.totalBids} Bids
                    </div>
                  </div>
                </div>

                {/* Content Container */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-auctus-teal transition-colors">
                    {auction.title}
                  </h3>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2">
                    {auction.description}
                  </p>

                  <div className="mt-auto flex items-end justify-between pt-5 border-t border-slate-200 dark:border-white/10">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1.5">Winning Bid</p>
                      <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
                        {auction.winningBid}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-auctus-teal transition-colors duration-300">
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Item Details Modal - Moved OUTSIDE of the section to prevent overflow clipping */}
      {selectedAuction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={closeModal}></div>
          {/* Modal Wrapper - Fixed max height, overflow hidden */}
          <div className="relative bg-white dark:bg-[#0B152A] rounded-3xl w-full max-w-5xl max-h-[90vh] md:max-h-[85vh] flex flex-col md:flex-row shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">

            {/* Close Button styled visibly inside the modal panel */}
            <button onClick={closeModal} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-slate-100/50 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white backdrop-blur-md transition-colors shadow-sm">
              <X className="w-5 h-5" />
            </button>

            {/* Left: Image Carousel (Fixed height on mobile, flex on desktop) */}
            <div className="w-full md:w-1/2 relative bg-slate-100 dark:bg-[#050A14] flex flex-col items-center justify-center h-[350px] md:h-auto shrink-0 p-4">
              <img
                src={selectedAuction.images[currentImageIndex]}
                alt={`${selectedAuction.title} - View ${currentImageIndex + 1}`}
                className="w-full h-full object-contain md:absolute md:inset-0 md:p-4"
              />
              {/* Dark gradient overlay for controls */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>

              {/* Carousel Controls */}
              {selectedAuction.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/80 transition-colors backdrop-blur-md hover:scale-105 z-10">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/80 transition-colors backdrop-blur-md hover:scale-105 z-10">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  {/* Thumbnails */}
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20 w-max bg-black/20 p-2 rounded-2xl backdrop-blur-sm">
                    {selectedAuction.images.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 bg-slate-200 dark:bg-white/5 ${idx === currentImageIndex ? 'border-auctus-teal ring-2 ring-auctus-teal/30 scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        <img src={imgSrc} alt="thumbnail" className="w-full h-full object-contain" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Right: Info Area (Scrollable) */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col bg-white dark:bg-[#0B152A] overflow-y-auto">
              <div className="mb-6 border-b border-slate-200 dark:border-white/10 pb-6 shrink-0 pr-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="inline-block px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 text-xs font-bold shadow-sm">
                    {selectedAuction.category}
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    Auction Completed
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">{selectedAuction.title}</h2>
                <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed">
                  {selectedAuction.description}
                </p>
              </div>

              {/* Winner Info */}
              <div className="bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 mb-8 border border-slate-200 dark:border-white/5 shrink-0">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Winning Bidder</span>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg ring-4 ring-white dark:ring-[#0B152A] shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-white text-lg">{selectedAuction.winner.name}</span>
                      {selectedAuction.winner.verified && <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Bidder" />}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{selectedAuction.winner.country}</span>
                  </div>
                </div>
              </div>

              {/* Bid History Stats */}
              <div className="flex-1 shrink-0 pb-4">
                <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-auctus-teal" />
                  Pricing History
                </h4>

                <div className="grid grid-cols-1 gap-5 relative before:absolute before:inset-y-4 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                  {/* Start */}
                  <div className="flex items-center gap-4 relative z-10 group">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0B152A] border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0 transition-colors group-hover:border-slate-400">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-200 dark:border-white/5 flex justify-between items-center transition-colors group-hover:bg-slate-100 dark:group-hover:bg-white/5 shadow-sm">
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Opening Bid</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{selectedAuction.history.startingBid}</span>
                    </div>
                  </div>

                  {/* Final */}
                  <div className="flex items-center gap-4 relative z-10 pt-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-4 ring-emerald-500/20">
                      <Gavel className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-5 rounded-xl border border-emerald-500/30 flex flex-col justify-center shadow-md">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5">Final Winning Bid</span>
                      <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300">
                        {selectedAuction.history.finalPrice}
                      </span>
                    </div>
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
