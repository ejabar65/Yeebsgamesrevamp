import { useState } from 'react';
import GameCard from './GameCard';
import { useGames } from '../context/GameContext';

export default function GameGrid() {
  const { games, searchQuery, loading, favorites } = useGames();
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredGames = games
    .filter(game => {
      const matchesCategory = activeCategory === 'All' 
        ? true 
        : activeCategory === 'Favorites'
          ? favorites.includes(game.id)
          : game.category === activeCategory;
      
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           game.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

  const categories = ['All', 'Favorites', ...new Set(games.map(g => g.category))];
  const isCompact = useGames().user?.settings?.compactMode;

  if (loading) {
    return (
      <section className="py-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div className="flex flex-wrap gap-1.5 ml-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all border ${
                activeCategory === cat 
                  ? 'bg-white text-black border-white' 
                  : 'bg-white/[0.03] text-gray-600 border-white/5 hover:border-white/10 hover:text-white'
              }`}
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
        {filteredGames.map((game, i) => (
          <div key={`${game.id}-${i}`}>
            <GameCard game={game} />
          </div>
        ))}
      </div>
      
      {filteredGames.length === 0 && (
        <div className="text-center py-16 card-subtle border-dashed">
          <p className="text-sm font-medium text-gray-500">No results found in this directory.</p>
        </div>
      )}
    </section>
  );
}
