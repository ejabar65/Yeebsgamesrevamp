import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';

export default function OSShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
    </div>
  );
}
