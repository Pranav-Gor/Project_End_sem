import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Shield } from 'lucide-react';

export default function RazorpayMockModal({ amount, purpose, onSuccess, onClose }) {
  const [status, setStatus] = useState('processing'); // processing, success
  
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setStatus('success');
    }, 2000);
    
    const timer2 = setTimeout(() => {
      onSuccess();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onSuccess]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-inner">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-wide">TEST MODE</h3>
            <p className="text-blue-100 text-xs">Auctus secure payment</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8 flex flex-col items-center justify-center text-center">
          {status === 'processing' ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h4 className="text-lg font-bold text-slate-800">Processing Payment...</h4>
              <p className="text-sm text-slate-500 mt-2">
                Simulating {purpose || 'transaction'} for ₹{(amount || 0).toLocaleString('en-IN')}
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-xl font-bold text-emerald-600">Payment Successful</h4>
              <p className="text-sm text-slate-500 mt-2">
                Redirecting...
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Secured by Razorpay (Mock)</span>
          {status === 'processing' && (
            <button 
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
