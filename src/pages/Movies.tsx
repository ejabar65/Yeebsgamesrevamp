import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { movieService, MediaContent } from '../services/movieService';
import { useNavigate } from 'react-router-dom';
import { Film, Monitor, Search, Play, Star, TrendingUp } from 'lucide-react';

function MediaCard({ item, index, type, onClick }: { item: MediaContent, index: number, type: 'movie' | 'tv', onClick: () => void, key?: any }) {
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 bg-[#111] relative transition-all duration-500 shadow-lg group-hover:shadow-primary/20">
        <img 
          src={movieService.getPosterUrl(item.poster_path)} 
          alt={title} 
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80" />
        
        <div className="absolute top-4 left-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
          {type === 'movie' ? <Film className="w-3 h-3 text-primary" /> : <Monitor className="w-3 h-3 text-accent" />}
          <span className="text-[8px] font-black text-white uppercase tracking-widest">{type}</span>
        </div>

        <div className="absolute top-4 right-4 px-3 py-1 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          <span className="text-[10px] font-black text-white">{item.vote_average.toFixed(1)}</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100">
           <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)]">
              <Play className="w-8 h-8 text-black fill-current ml-1" />
           </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {title}
          </h3>
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">
            {date?.split('-')[0] || '2024'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Movies() {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const [popular, setPopular] = useState<MediaContent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await movieService.getPopular(activeTab);
      setPopular(data);
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
    <main className="p-6 md:p-12 max-w-[1600px] mx-auto min-h-screen">
      <section className="mb-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 p-12 rounded-[40px] border border-white/5 bg-linear-to-br from-primary/5 via-transparent to-transparent relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
            <TrendingUp className="w-64 h-64 text-primary" />
          </div>

          <div className="space-y-4 text-center md:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest mb-2">
              <Star className="w-3 h-3 fill-current" />
              Featured Selection
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tighter leading-none italic">Cinema<span className="text-primary">.tv</span></h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Accessing local media stream</p>
          </div>

          <div className="flex flex-col gap-8 w-full max-w-xl relative z-10">
             <div className="flex justify-center md:justify-end gap-3">
                <button 
                  onClick={() => setActiveTab('movie')}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${activeTab === 'movie' ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                >
                  <Film className="w-4 h-4" />
                  Films
                </button>
                <button 
                  onClick={() => setActiveTab('tv')}
                  className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border flex items-center gap-2 ${activeTab === 'tv' ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                >
                  <Monitor className="w-4 h-4" />
                  Shows
                </button>
             </div>

             <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-gray-600 group-focus-within:text-primary transition-colors" />
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter keywords..." 
                  className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 pl-14 pr-8 text-sm font-medium focus:border-primary/50 outline-hidden transition-all uppercase placeholder:text-gray-700"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-2.5 bottom-2.5 bg-primary text-black px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-md active:scale-95"
                >
                  Search
                </button>
             </form>
          </div>
        </div>
      </section>

      <div className="space-y-12">
        {isSearching ? (
          <div>
            <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Search Results</h2>
              </div>
              <button 
                onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                className="text-[8px] font-black uppercase text-gray-600 hover:text-white transition-colors tracking-widest"
              >
                [ Clear Results ]
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              <AnimatePresence>
                {searchResults.length > 0 ? (
                  searchResults.map((item, i) => (
                    <MediaCard key={item.id} item={item} index={i} type={activeTab} onClick={() => navigate(`/media/${activeTab}/${item.id}`)} />
                  ))
                ) : (
                  <div className="col-span-full h-80 flex flex-col items-center justify-center bg-white/[0.01] rounded-[40px] border border-dashed border-white/5 space-y-4">
                    <Search className="w-12 h-12 text-gray-800" />
                    <p className="text-gray-700 font-black text-[10px] uppercase tracking-[0.4em]">No transmissions found</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-10 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Popular {activeTab === 'movie' ? 'Films' : 'Shows'}</h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
              {loading ? (
                Array(12).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-white/[0.02] rounded-3xl animate-pulse" />
                ))
              ) : (
                popular.map((item, i) => (
                  <MediaCard key={item.id} item={item} index={i} type={activeTab} onClick={() => navigate(`/media/${activeTab}/${item.id}`)} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
