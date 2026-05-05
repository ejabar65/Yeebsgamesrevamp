import { Link } from 'react-router-dom';
import { Game } from '../types';
import { motion } from 'motion/react';
import { useGames } from '../context/GameContext';
import { Heart, Play } from 'lucide-react';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { toggleFavorite, isFavorite, user } = useGames();
  const favorite = isFavorite(game.id);
  const isCompact = user?.settings?.compactMode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className={`absolute z-10 ${isCompact ? 'top-1 right-1' : 'top-2 right-2'}`}>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(game.id);
          }}
          className={`${isCompact ? 'p-1.5' : 'p-2'} rounded-xl backdrop-blur-md transition-all ${
            favorite 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' 
              : 'bg-black/40 text-white/60 hover:bg-black/60 hover:text-white'
          }`}
        >
          <Heart className={`w-3 h-3 ${favorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <Link to={`/game/${game.id}`}>
        <div className={`relative overflow-hidden rounded-2xl bg-[#111] border border-white/5 transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-[0_0_20px_rgba(250,204,21,0.1)] ${isCompact ? 'aspect-square' : 'aspect-[4/3]'}`}>
          {game.thumbnail ? (
            <img
              src={game.thumbnail}
              alt={game.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <span className="text-[10px] font-black text-white/10 uppercase tracking-widest">No Preview</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className={`w-full py-2 bg-primary text-black flex justify-center rounded-xl items-center gap-2 shadow-lg`}>
               <Play className="w-3 h-3 fill-current" />
               <span className="text-[10px] font-black uppercase tracking-widest">Play Now</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-sans font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors truncate ${isCompact ? 'text-[10px]' : 'text-sm'}`}>
              {game.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] font-black uppercase tracking-widest text-primary px-1.5 py-0.5 rounded-md bg-primary/10">
               {game.category}
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block">
               • EXE
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
