import { Play, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Game } from '../types';
import { motion } from 'motion/react';
import { useGames } from '../context/GameContext';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { toggleFavorite, isFavorite, user } = useGames();
  const favorite = isFavorite(game.id);
  const isCompact = user?.settings?.compactMode;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className={`absolute z-10 ${isCompact ? 'top-1 right-1' : 'top-3 right-3'}`}>
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(game.id);
          }}
          className={`${isCompact ? 'p-1.5' : 'p-2'} rounded-lg backdrop-blur-md transition-all ${
            favorite 
              ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : 'bg-black/40 text-white/60 hover:bg-black/60 hover:text-white'
          }`}
        >
          <Heart className={`${isCompact ? 'w-3 h-3' : 'w-4 h-4'} ${favorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <Link to={`/game/${game.id}`}>
        <div className={`${isCompact ? 'aspect-square' : 'aspect-video'} rounded-xl overflow-hidden bg-dark-card border border-white/5 card-hover relative`}>
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-dark-surface/90 via-dark-surface/20 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className={`${isCompact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)]`}>
              <Play className={`${isCompact ? 'w-4 h-4' : 'w-5 h-5'} text-dark-surface fill-current ml-1`} />
            </div>
          </div>
        </div>
        <div className={`${isCompact ? 'mt-2' : 'mt-3'} px-1`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className={`font-display font-semibold text-white group-hover:text-primary transition-colors line-clamp-1 ${isCompact ? 'text-[11px]' : 'text-sm'}`}>
              {game.title}
            </h3>
            {!isCompact && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent px-2 py-0.5 rounded-full border border-accent/30 bg-accent/5">
                {game.category}
              </span>
            )}
          </div>
          {!isCompact && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
              {game.description}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
