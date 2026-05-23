import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';
import { Globe, Copy, Check, ExternalLink, X } from 'lucide-react';
import Navbar from './Navbar';

export default function OSShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [showMirrorsModal, setShowMirrorsModal] = useState(false);
  const [mirrors, setMirrors] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showMirrorsModal) {
      fetch('/api/mirrors')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setMirrors(data.filter(m => m.success));
          }
        })
        .catch(err => console.error('Error fetching mirrors:', err));
    }
  }, [showMirrorsModal]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(`https://${url}`);
    setCopiedId(url);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-svh w-full bg-[#0a0a0a] text-white flex flex-col font-sans overflow-x-hidden selection:bg-blue-500/30">
      <Navbar />
      
      <main className="flex-1 pt-14 md:pt-20 px-0 md:px-8 max-w-7xl mx-auto w-full flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col pt-0 pb-16 md:py-12 scroll-m-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="py-12 px-8 border-t border-white/5 bg-black/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold tracking-tight text-white italic">YEEBS<span className="text-blue-500">GAMES</span></h3>
            <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
              <Link to="/updates" className="hover:text-blue-500 transition-colors">Updates</Link>
              <Link to="/legal" className="hover:text-blue-500 transition-colors">About</Link>
              <Link to="/reviews" className="hover:text-blue-500 transition-colors">Contact</Link>
              <button 
                onClick={() => setShowMirrorsModal(true)} 
                className="hover:text-purple-500 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Globe className="w-3 h-3 text-purple-500 animate-pulse" />
                Bypass Filters
              </button>
            </div>
            <p className="text-[10px] text-gray-600 font-medium">Entertainment portal. Established 2026.</p>
          </div>
          
          <div className="flex items-center gap-12 text-xs font-medium text-gray-400 uppercase tracking-widest">
            <div className="flex flex-col items-center">
              <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[10px] opacity-40">LOCAL TIME</span>
            </div>
            <div className="flex flex-col items-center">
              <span>ONLINE</span>
              <span className="text-[10px] opacity-40">SERVER STATUS</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Bypass Filters Mirrors Modal */}
      <AnimatePresence>
        {showMirrorsModal && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMirrorsModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/5 rounded-2xl overflow-hidden shadow-2xl z-120 p-6 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                    <Globe className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight leading-none">Bypass School Filters</h2>
                    <p className="text-[10px] text-gray-500 mt-1">Use these dynamic temporary proxy mirrors to play anywhere safely.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowMirrorsModal(false)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {mirrors.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p className="text-xs text-gray-500">No active temporary mirrors found.</p>
                    <p className="text-[10px] text-gray-600">Please contact administrators to generate dynamic mirrors.</p>
                  </div>
                ) : (
                  mirrors.map((mirror, index) => (
                    <div 
                      key={index} 
                      className="p-3 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <span className="text-[10px] font-mono text-gray-400 truncate block">
                          {mirror.url}
                        </span>
                        <span className="text-[8px] text-gray-650 uppercase font-black tracking-wider block mt-0.5">
                          Active Mirror {index + 1}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleCopy(mirror.url)}
                          className="px-2.5 py-1.5 bg-white/[0.03] hover:bg-white/[0.08] text-[9px] font-black uppercase tracking-widest text-gray-300 rounded-lg transition-all border border-white/5 flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === mirror.url ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                        <a
                          href={`https://${mirror.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white text-black hover:bg-gray-200 rounded-lg transition-all flex items-center justify-center cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-white/5 text-[9px] text-gray-600 leading-relaxed italic">
                * Note: Filter bypass domains are updated regularly or automatically via Github Action scripts. Bookmark a working link to save your game progress!
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
