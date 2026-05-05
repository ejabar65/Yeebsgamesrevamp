import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import GameGrid from '../components/GameGrid';
import { useNavigate } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { Library, Film, MessageSquare, Users, Globe } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { games } = useGames();
  const [showCatalog, setShowCatalog] = React.useState(true);

  const [recentIds, setRecentIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    const history = JSON.parse(localStorage.getItem('yeebsgames_recent') || '[]');
    setRecentIds(history);
  }, []);

  const recentGames = recentIds
    .map(id => games.find(g => g.id === id))
    .filter((g): g is any => !!g);

  const directLinks = [
    { name: 'Library', icon: Library, color: 'bg-yellow-500', path: null },
    { name: 'Cinema', icon: Film, color: 'bg-purple-500', path: '/movies' },
    { name: 'Chat', icon: MessageSquare, color: 'bg-green-500', path: '/chat' },
    { name: 'Social', icon: Users, color: 'bg-blue-500', path: '/community' },
    { name: 'Browser', icon: Globe, color: 'bg-rose-500', path: '/browser' },
  ];

  return (
    <div className="min-h-full p-6 md:p-12 flex flex-col gap-12 font-sans max-w-[1600px] mx-auto relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-6 relative z-10">
        {directLinks.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => item.path ? navigate(item.path) : setShowCatalog(true)}
            className="flex flex-col items-center gap-3 cursor-pointer group"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color} shadow-lg transition-all group-hover:scale-110 active:scale-95 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]`}>
              <item.icon className="text-black w-6 h-6" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">{item.name}</span>
          </motion.div>
        ))}

        {recentGames.slice(0, 4).map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (directLinks.length + i) * 0.05 }}
            onClick={() => navigate(`/game/${game.id}`)}
            className="flex flex-col items-center gap-3 cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-all group-hover:scale-110 group-hover:shadow-lg">
               <img src={game.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white truncate w-14 text-center">{game.title}</span>
          </motion.div>
        ))}
      </div>

      <div className="space-y-12 relative z-10">
        <div className="rounded-[40px] overflow-hidden border border-white/5 bg-linear-to-br from-[#111] to-[#0a0a0a] shadow-2xl relative">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Library className="w-5 h-5 text-primary" />
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">App Library</span>
              </div>
              <button 
                onClick={() => setShowCatalog(!showCatalog)} 
                className="text-[10px] font-black text-gray-500 hover:text-white px-2 uppercase tracking-widest transition-colors"
              >
                {showCatalog ? 'Collapse' : 'Expand'}
              </button>
            </div>

            <AnimatePresence>
              {showCatalog && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-8"
                >
                  <GameGrid />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
      </div>
    </div>
  );
}
