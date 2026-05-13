import React from 'react';
import { motion } from 'motion/react';

export default function NeonCurlyArrow({ text = "CLICK HERE", className = "" }: { text?: string, className?: string }) {
  return (
    <motion.div 
      className={`relative flex flex-col items-center gap-2 pointer-events-none select-none ${className}`}
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        rotate: [ -5, 5, -5 ],
        y: [ 0, -10, 0 ]
      }}
      transition={{ 
        duration: 3, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
    >
      <span className="text-red-500 font-black italic text-xl uppercase tracking-tighter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] [text-shadow:0_0_15px_#ef4444]">
        {text}
      </span>
      
      <svg 
        width="120" 
        height="80" 
        viewBox="0 0 120 80" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_12px_rgba(239,68,68,0.9)]"
      >
        <motion.path
          d="M20 20C40 10 60 40 50 60C45 75 70 65 90 40C100 30 105 20 100 15M100 15L90 25M100 15L110 5"
          stroke="#ef4444"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            filter: 'drop-shadow(0 0 5px #ef4444) drop-shadow(0 0 15px #ef4444)'
          }}
        />
        {/* Glow layer */}
        <path
          d="M20 20C40 10 60 40 50 60C45 75 70 65 90 40C100 30 105 20 100 15M100 15L90 25M100 15L110 5"
          stroke="#ef4444"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-20 blur-sm"
        />
      </svg>
    </motion.div>
  );
}
