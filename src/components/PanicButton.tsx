import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PanicButton() {
  const [panicSite, setPanicSite] = useState(() => localStorage.getItem('panic_site') || 'https://classroom.google.com');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Emergency Escape: Esc key or ` key
      if (e.key === 'Escape' || e.key === '`') {
        triggerPanic();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panicSite]);

  const triggerPanic = () => {
    // Instantly redirect
    window.location.replace(panicSite);
  };

  return (
    <motion.div 
      initial={{ opacity: 0.1, scale: 0.8 }}
      animate={{ 
        opacity: isHovered ? 1 : 0.05,
        scale: isHovered ? 1 : 0.8,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-[101]"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={triggerPanic}
        className="group relative flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-colors cursor-pointer"
        title="Emergency Escape (Esc or `)"
      >
        <Shield className="w-5 h-5" />
        <span className="absolute right-full mr-3 px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Panic Button (Esc)
        </span>
      </motion.button>
    </motion.div>
  );
}
