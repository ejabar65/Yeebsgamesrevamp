import { useState } from 'react';
import GameCard from './GameCard';
import { useGames } from '../context/GameContext';

export default function GameGrid() {
  const { games, searchQuery, loading, favorites, sortBy } = useGames();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredAndSortedGames = games
    .filter(game => {
      const matchesCategory = activeCategory === 'All' 
        ? true 
        : activeCategory === 'Favorites'
          ? favorites.includes(game.id)
          : game.category === activeCategory;
      
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           game.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'trending') {
        return (b.playCount || 0) - (a.playCount || 0);
      }
      if (sortBy === 'top') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return 0;
    });

  const categories = ['All', 'Favorites', ...new Set(games.map(g => g.category))];
  const isCompact = useGames().user?.settings?.compactMode;

  if (loading) {
    return (
      <section className="py-12 px-4 md:px-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section className="py-12 px-4 md:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">
            Explore <span className="text-primary">Games</span>
          </h2>
          <p className="text-gray-400 text-sm">Find your next favorite unblocked game</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${activeCategory === cat 
                  ? 'bg-primary border-primary text-dark-surface' 
                  : 'border-white/10 text-gray-400 hover:border-primary hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-6 ${
        isCompact 
          ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8' 
          : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {filteredAndSortedGames.map((game, i) => (
          <div key={`${game.id}-${i}`}>
            <GameCard game={game} />
          </div>
        ))}
      </div>
      
      {filteredAndSortedGames.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500">No games found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
        </div>
      )}
    </section>
  );
}
