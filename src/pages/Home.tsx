import React from 'react';
import { Gamepad2, Zap, Trophy, TrendingUp, Sparkles, Shuffle } from 'lucide-react';
import { motion } from 'motion/react';
import GameGrid from '../components/GameGrid';
import { useNavigate } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { MASCOT_URL } from '../constants';

export default function Home() {
  const navigate = useNavigate();
  const { games } = useGames();
  const [onlineCount, setOnlineCount] = React.useState(1200 + Math.floor(Math.random() * 300));

  React.useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const change = Math.floor(Math.random() * 7) - 3;
        return Math.max(800, prev + change);
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalPlays = games.reduce((acc, game) => acc + (game.playCount || 0), 0);
  const trendingGame = [...games].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0]?.title || 'None';
  const topRatedGame = [...games].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

  return (
    <main className="pt-24 pb-12">
      {/* Hero Section */}
      <section className="px-4 md:px-8 mb-12">
        <div className="relative rounded-3xl overflow-hidden h-[500px] flex items-center justify-center border border-primary/20 bg-dark-card shadow-[0_0_50px_rgba(250,204,21,0.1)]">
          <div className="absolute inset-0 bg-linear-to-br from-primary/20 via-transparent to-accent/20" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center grayscale contrast-150 opacity-10 mix-blend-overlay" />
          
          <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
            >
              <Zap className="w-3 h-3 fill-current animate-pulse" />
              SYSTEM ONLINE • {onlineCount.toLocaleString()} PLAYERS ACTIVE
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-6 relative group"
            >
              <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150 opacity-50 group-hover:opacity-80 transition-opacity" />
              <img 
                src={MASCOT_URL} 
                alt="Yeebs Moth Mascot"
                className="w-40 h-40 md:w-56 md:h-56 object-contain relative z-10 brightness-125 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)] group-hover:scale-110 transition-transform duration-500 hover:rotate-3"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-7xl md:text-9xl font-display font-black tracking-tighter mb-4 leading-[0.8] uppercase"
            >
              YEEBS<span className="text-gradient">GAMES</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium"
            >
              The most legendary collection of unblocked web games.
            </motion.p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                onClick={() => document.getElementById('games')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-10 py-5 rounded-2xl bg-primary text-dark-surface font-display font-black hover:bg-white transition-all flex items-center gap-3 shadow-[0_0_40px_rgba(250,204,21,0.4)] group"
              >
                <Gamepad2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                PLAY NOW
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* Real Stats Section */}
      <section className="px-4 md:px-8 mb-12 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Cloud Library', value: games.length, icon: Sparkles, color: 'text-primary' },
          { label: 'Online Now', value: onlineCount.toLocaleString(), icon: Zap, color: 'text-orange-500', live: true },
          { label: 'Trending', value: trendingGame, icon: Trophy, color: 'text-primary' },
          { label: 'Top Rated', value: topRatedGame ? `${topRatedGame.rating?.toFixed(1)} ★` : '0.0 ★', sub: topRatedGame?.title, icon: TrendingUp, color: 'text-blue-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + (i * 0.1) }}
            className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center group hover:bg-white/5 transition-all relative overflow-hidden"
          >
            {stat.live && (
              <div className="absolute top-3 right-3 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[8px] font-black text-orange-500 uppercase">Live</span>
              </div>
            )}
            <stat.icon className={`w-5 h-5 mb-2 ${stat.color} group-hover:scale-110 transition-transform`} />
            <span className="text-xl font-display font-black text-white truncate w-full px-2" title={stat.value.toString()}>{stat.value}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">{stat.label}</span>
            {stat.sub && <span className="text-[8px] uppercase text-gray-600 mt-0.5 truncate w-full">{stat.sub}</span>}
          </motion.div>
        ))}
      </section>

      {/* Game Content */}
      <div id="games" className="scroll-mt-24">
        <GameGrid />
      </div>
    </main>
  );
}
