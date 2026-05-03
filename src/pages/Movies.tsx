import React, { useEffect, useState } from 'react';
import { Film, Search, TrendingUp, Star, Play, Zap, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { movieService, MediaContent } from '../services/movieService';
import { useNavigate } from 'react-router-dom';

function MediaCard({ item, index, type, onClick }: { item: MediaContent, index: number, type: 'movie' | 'tv', onClick: () => void, key?: any }) {
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-dark-card relative shadow-[0_10px_30px_rgba(0,0,0,0.3)] group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all duration-500">
        <img 
          src={movieService.getPosterUrl(item.poster_path)} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-50 group-hover:grayscale-0 opacity-80 group-hover:opacity-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-dark-surface/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Type Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {type === 'movie' ? <Film className="w-3 h-3 text-primary" /> : <Monitor className="w-3 h-3 text-accent" />}
          <span className="text-[8px] font-black text-white uppercase tracking-tighter">{type}</span>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Star className="w-3 h-3 text-primary fill-current" />
          <span className="text-[10px] font-black text-white">{item.vote_average.toFixed(1)}</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.6)] animate-pulse">
            <Play className="w-8 h-8 text-dark-surface fill-current ml-1" />
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <h3 className="text-sm font-black uppercase tracking-tight text-white mb-1 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
              {date?.split('-')[0] || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Movies() {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const [trending, setTrending] = useState<MediaContent[]>([]);
  const [popular, setPopular] = useState<MediaContent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [trendingData, popularData] = await Promise.all([
        movieService.getTrending(activeTab),
        movieService.getPopular(activeTab)
      ]);
      setTrending(trendingData);
      setPopular(popularData);
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = await movieService.searchMedia(searchQuery, activeTab);
    setSearchResults(results);
  };

  return (
    <main className="pt-24 pb-12">
      <section className="px-4 md:px-8 mb-12">
        <div className="relative rounded-3xl overflow-hidden h-[400px] flex items-center justify-center border border-primary/20 bg-dark-card shadow-[0_0_50px_rgba(250,204,21,0.1)]">
          <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-accent/20" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center grayscale contrast-125 opacity-20 mix-blend-overlay" />
          
          <div className="relative z-10 text-center max-w-4xl px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em] mb-8 backdrop-blur-md"
            >
              <Zap className="w-3 h-3 fill-current animate-pulse" />
              CINEMATIC PORTAL • {activeTab === 'movie' ? 'FILM' : 'SERIES'} MODE
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-display font-black tracking-tighter mb-8 uppercase leading-[0.8]"
            >
              YEEBS<span className="text-gradient">{activeTab === 'movie' ? 'MOVIES' : 'SHOWS'}</span>
            </motion.h1>

            <div className="flex justify-center gap-4 mb-8">
              <button 
                onClick={() => setActiveTab('movie')}
                className={`px-8 py-3 rounded-xl font-display font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'movie' ? 'bg-primary text-dark-surface shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                <Film className="w-4 h-4" />
                Movies
              </button>
              <button 
                onClick={() => setActiveTab('tv')}
                className={`px-8 py-3 rounded-xl font-display font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'tv' ? 'bg-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]' : 'bg-white/5 text-gray-500 hover:text-white'}`}
              >
                <Monitor className="w-4 h-4" />
                TV Shows
              </button>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search for a ${activeTab === 'movie' ? 'movie' : 'show'}...`} 
                className="w-full bg-dark-surface/80 border-2 border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-mono placeholder:text-gray-600 focus:border-primary outline-hidden transition-all backdrop-blur-md"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-primary w-6 h-6" />
              <button 
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-dark-surface px-6 py-2 rounded-xl font-display font-black text-xs uppercase hover:bg-white transition-all shadow-lg"
              >
                Transmit
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="px-4 md:px-8 space-y-12">
        {isSearching ? (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Search className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-display font-black uppercase italic tracking-tight">Search <span className="text-primary italic">Results</span></h2>
              </div>
              <button 
                onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                className="text-xs font-black uppercase text-gray-500 hover:text-white transition-colors tracking-widest"
              >
                Clear Search
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <AnimatePresence>
                {searchResults.length > 0 ? (
                  searchResults.map((item, i) => (
                    <MediaCard key={item.id} item={item} index={i} type={activeTab} onClick={() => navigate(`/media/${activeTab}/${item.id}`)} />
                  ))
                ) : (
                  <div className="col-span-full h-64 flex flex-col items-center justify-center glass rounded-3xl border border-white/5">
                    <Film className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">No transmissions found matching that frequency.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <>
            {/* Trending Section */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className={`w-6 h-6 ${activeTab === 'movie' ? 'text-primary' : 'text-accent'} shadow-[0_0_15px_rgba(250,204,21,0.5)]`} />
                <h2 className="text-3xl font-display font-black uppercase italic tracking-tight">Trending <span className={`${activeTab === 'movie' ? 'text-primary' : 'text-accent'} italic`}>{activeTab === 'movie' ? 'This Week' : 'Shows'}</span></h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="aspect-[2/3] glass rounded-2xl animate-pulse" />
                  ))
                ) : (
                  trending.slice(0, 12).map((item, i) => (
                    <MediaCard key={item.id} item={item} index={i} type={activeTab} onClick={() => navigate(`/media/${activeTab}/${item.id}`)} />
                  ))
                )}
              </div>
            </div>

            {/* Popular Section */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Zap className={`w-6 h-6 ${activeTab === 'movie' ? 'text-accent' : 'text-primary'}`} />
                <h2 className="text-3xl font-display font-black uppercase italic tracking-tight">All-Time <span className={`${activeTab === 'movie' ? 'text-accent' : 'text-primary'} italic`}>Favorites</span></h2>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {loading ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="aspect-[2/3] glass rounded-2xl animate-pulse" />
                  ))
                ) : (
                  popular.slice(0, 12).map((item, i) => (
                    <MediaCard key={item.id} item={item} index={i} type={activeTab} onClick={() => navigate(`/media/${activeTab}/${item.id}`)} />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
