import { Play, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Game } from '../types';
import { motion } from 'motion/react';
import { useGames } from '../context/GameContext';

interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const { toggleFavorite, isFavorite } = useGames();
  const favorite = isFavorite(game.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="absolute top-3 right-3 z-10">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(game.id);
          }}
          className={`p-2 rounded-lg backdrop-blur-md transition-all ${
            favorite 
              ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
              : 'bg-black/40 text-white/60 hover:bg-black/60 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
        </button>
      </div>
      <Link to={`/game/${game.id}`}>
        <div className="aspect-video rounded-xl overflow-hidden bg-dark-card border border-white/5 card-hover relative">
          <img
            src={game.thumbnail}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-linear-to-t from-dark-surface/90 via-dark-surface/20 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.5)]">
              <Play className="w-5 h-5 text-dark-surface fill-current ml-1" />
            </div>
          </div>
        </div>
        <div className="mt-3 px-1">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
              {game.title}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent px-2 py-0.5 rounded-full border border-accent/30 bg-accent/5">
              {game.category}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {game.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
