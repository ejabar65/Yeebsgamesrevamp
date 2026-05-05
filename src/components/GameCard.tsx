import { Link } from 'react-router-dom';
import { Game } from '../types';
import { motion } from 'motion/react';
import { useGames } from '../context/GameContext';
import { Heart, Play } from 'lucide-react';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { toggleFavorite, isFavorite } = useGames();
  const favorite = isFavorite(game.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link to={`/game/${game.id}`} className="block space-y-3">
        <div className="relative aspect-video rounded-lg bg-white/[0.02] overflow-hidden border border-white/5 transition-all duration-500 group-hover:border-blue-500/30">
          {game.thumbnail ? (
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-white/[0.01] flex items-center justify-center">
              <span className="text-[9px] font-bold text-white/5 uppercase tracking-widest text-center px-4">No Asset Found</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center translate-y-2 group-hover:translate-y-0 transition-transform">
               <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>

          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(game.id);
            }}
            className={`absolute top-2 right-2 p-2 rounded-lg transition-all z-20 ${
              favorite 
                ? 'bg-red-500 text-white' 
                : 'bg-black/40 text-white/20 hover:text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-3 h-3 ${favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <div className="px-1 flex justify-between items-start gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-[13px] text-gray-300 group-hover:text-white transition-colors truncate tracking-tight">
              {game.title}
            </h3>
            <p className="text-[10px] text-gray-600 font-medium uppercase tracking-[0.05em] mt-0.5">Initialize</p>
          </div>
          <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest pt-1">
             {game.category}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
