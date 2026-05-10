import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GameGrid from '../components/GameGrid';
import { useNavigate } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { Film, MessageSquare, Users, Shield, Globe, ExternalLink } from 'lucide-react';
import { launchAboutBlank } from '../cloakUtils';
import { MASCOT_URL } from '../constants';

export default function Home() {
  const navigate = useNavigate();
  const { games } = useGames();
  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = React.useState(false);
  const mascotRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mascotRef.current) {
      const rect = mascotRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('yeebsgames_recent') || '[]');
    setRecentIds(history);
  }, []);

  const recentGames = recentIds
    .map(id => games.find(g => g.id === id))
    .filter((g): g is any => !!g);

  return (
    <div className="flex flex-col gap-16 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-center lg:items-center py-8 lg:py-16">
        <motion.div 
          ref={mascotRef}
          initial={{ opacity: 0, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-[3rem] overflow-hidden shrink-0 border border-white/5 shadow-2xl shadow-blue-500/20 group cursor-none"
        >
          {/* Grayscale Base */}
          <img 
            src={MASCOT_URL} 
            alt="Mascot" 
            className="w-full h-full object-cover grayscale opacity-25 filter blur-[2px] scale-110 transition-all duration-700" 
          />
          
          {/* Color Reveal Layer */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              clipPath: isHovering 
                ? `circle(80px at ${mousePos.x}px ${mousePos.y}px)` 
                : `circle(0px at ${mousePos.x}px ${mousePos.y}px)`
            }}
            transition={{ type: 'spring', damping: 30, stiffness: 250, mass: 0.5 }}
          >
            <img 
              src={MASCOT_URL} 
              alt="Mascot" 
              className="w-full h-full object-cover scale-110" 
            />
          </motion.div>

          {/* Glint Effect */}
          <div 
            className="absolute inset-0 pointer-events-none bg-linear-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
          />
        </motion.div>
        
        <div className="text-center lg:text-left space-y-4 max-w-2xl">
          <h1 className="text-6xl sm:text-7xl lg:text-[10rem] font-bold tracking-tighter text-white leading-[0.8] uppercase italic">
            Yeebs<span className="text-blue-500">Games</span>
          </h1>
          <p className="text-gray-500 text-sm sm:text-lg font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
            The best web games in one place.
            Play without distractions.
          </p>
        </div>
      </div>
      
      {/* Quick Launch */}
      {recentGames.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-500/80">Recents</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentGames.slice(0, 6).map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/game/${game.id}`)}
                className="card-subtle p-3 flex flex-col items-start gap-3 text-left group"
              >
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-white/[0.02] border border-white/5">
                  <img src={game.thumbnail} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                </div>
                <div className="w-full px-1">
                  <h3 className="font-bold text-xs truncate w-full text-gray-300 group-hover:text-white transition-colors">{game.name}</h3>
                  <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mt-0.5">Play Now</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <h2 className="text-xl font-bold tracking-tight text-white">All Games</h2>
          <div className="flex items-center gap-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <button className="hover:text-white transition-colors">All</button>
            <button className="hover:text-white transition-colors">Categories</button>
          </div>
        </div>
        
        <GameGrid />
      </div>

      {/* Minimal Footer CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="card-subtle p-8 flex flex-col items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/5 flex items-center justify-center text-blue-500/60">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Privacy First</h3>
            <p className="text-sm text-gray-500 mt-1">Your data and browsing history are cleared when you close the tab.</p>
          </div>
        </div>
        
        <div className="card-subtle p-8 flex flex-col items-start justify-between gap-6 group cursor-pointer" onClick={() => launchAboutBlank()}>
          <div className="space-y-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/5 flex items-center justify-center text-indigo-500/60">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Maximum Stealth</h3>
              <p className="text-sm text-gray-500 mt-1">Open this app in a new about:blank tab for maximum privacy.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 group-hover:text-white transition-colors">
            Open Now <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
