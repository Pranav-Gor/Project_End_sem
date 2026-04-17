import React from 'react';

export default function FooterSection() {
  return (
    <footer className="py-8 text-center text-slate-500 text-sm border-t border-slate-200 dark:border-white/5 relative z-10 bg-slate-100 dark:bg-[#060D1A] transition-colors duration-500">
      <p>&copy; {new Date().getFullYear()} Auctus Auction Platform. All rights reserved.</p>
    </footer>
  );
}
