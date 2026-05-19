import React, { useState, useEffect } from 'react';
import { Search, Gamepad2, Plus, Play, ExternalLink, Loader2, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGames } from '../context/GameContext';
import { addGame } from '../services/gameService';
import { Game } from '../types';

export default function Discover() {
  const [externalGames, setExternalGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [importing, setImporting] = useState<string | null>(null);
  const { user, refreshGames } = useGames();

  useEffect(() => {
    fetchExternalGames();
  }, []);

  const fetchExternalGames = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Discover: Starting fetch from /api/games-discovery');
      const response = await fetch('/api/games-discovery');
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Discover: Received non-JSON response:', text.substring(0, 500));
        throw new Error('Server returned an invalid response format (HTML instead of JSON). The server might be restarting or encountered a fatal error.');
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Discover: Successfully received data:', data.length, 'games');
      setExternalGames(data);
    } catch (err) {
      console.error('Discover: Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred connecting to the discovery engine');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (game: Game) => {
    if (!user?.isAdmin && !user?.isMod) return;
    
    setImporting(game.id);
    try {
      const success = await addGame({
        ...game,
        playCount: 0,
        rating: 5
      });
      if (success) {
        await refreshGames();
        // Feedback would be nice here
      }
    } catch (err) {
      console.error(err);
    } finally {
      setImporting(null);
    }
  };

  const categories = ['All', ...Array.from(new Set(externalGames.map(g => g.category)))];
  
  const filteredGames = externalGames.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto min-h-screen font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Discovery <span className="text-blue-500">Node</span></h1>
          </div>
          <p className="text-gray-500 text-sm font-bold uppercase tracking-widest max-w-md">
            Scanning global game servers for the latest HTML5 titles.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search local node..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 rounded-2xl bg-white/[0.03] border border-white/5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.05] transition-all w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-4 scrollbar-none">
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 mr-2">
          <Filter className="w-3 h-3 text-gray-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Categories</span>
        </div>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
              ${selectedCategory === cat ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 animate-pulse">Syncing with Upstream Repositories...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-500/5 rounded-3xl border border-red-500/10">
          <Gamepad2 className="w-12 h-12 text-red-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-white font-bold text-lg">Discovery Failure</h3>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
          <button onClick={fetchExternalGames} className="mt-6 px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-red-500 transition-all">
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group relative bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all shadow-2xl"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-widest text-white border border-white/10">
                      {game.category}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-white font-black uppercase tracking-tight text-lg mb-2 truncate group-hover:text-blue-500 transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-gray-500 text-xs line-clamp-2 mb-6 font-medium leading-relaxed">
                    {game.description}
                  </p>

                  <div className="flex gap-2">
                    <a 
                      href={game.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-white text-white hover:text-blue-500 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play Now
                    </a>
                    
                    {(user?.isAdmin || user?.isMod) && (
                      <button 
                        onClick={() => handleImport(game)}
                        disabled={importing === game.id}
                        className="p-3 bg-white/5 hover:bg-green-500 text-gray-400 hover:text-white rounded-2xl transition-all border border-white/5"
                        title="Import to Library"
                      >
                        {importing === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredGames.length === 0 && !loading && (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm text-[10px]">No games found in the discovery matrix.</p>
        </div>
      )}
    </div>
  );
}
