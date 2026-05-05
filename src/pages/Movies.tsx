import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { movieService, MediaContent } from '../services/movieService';
import { useNavigate } from 'react-router-dom';
import { Film, Monitor, Search, Play, Star, TrendingUp } from 'lucide-react';

import { db, collection, getDocs } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const MediaCard: React.FC<{ item: any, index: number, type: string, onClick: () => void | Promise<void>, isCustom?: boolean }> = ({ item, index, type, onClick, isCustom }) => {
  const title = item.title || item.name;
  const date = item.release_date || item.first_air_date || item.createdAt;
  const posterPath = isCustom ? item.thumbnail : movieService.getPosterUrl(item.poster_path);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="aspect-[2/3] rounded-xl overflow-hidden bg-white/[0.02] border border-white/5 relative transition-all duration-500 group-hover:border-blue-500/30">
          <img 
            src={posterPath} 
            alt={title} 
            className="w-full h-full object-cover transition-all duration-700 opacity-80 group-hover:opacity-100 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center translate-y-2 group-hover:translate-y-0 transition-transform">
               <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </div>
          
          {!isCustom && item.vote_average && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/40 rounded-lg flex items-center gap-1">
              <span className="text-[10px] font-bold text-white opacity-80">{item.vote_average.toFixed(1)}</span>
            </div>
          )}
          {isCustom && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/80 rounded-md">
              <span className="text-[8px] font-bold text-white uppercase tracking-widest">Linked</span>
            </div>
          )}
        </div>

        <div className="px-1">
          <h3 className="font-bold text-xs text-gray-300 group-hover:text-white transition-colors line-clamp-1 truncate tracking-tight">
            {title}
          </h3>
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">
            {type} • {date?.split('-')[0] || '2026'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Movies() {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv' | 'custom'>('movie');
  const [popular, setPopular] = useState<MediaContent[]>([]);
  const [customMovies, setCustomMovies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (activeTab === 'custom') {
        try {
          const snapshot = await getDocs(collection(db, 'custom_movies'));
          setCustomMovies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
          handleFirestoreError(error, OperationType.LIST, 'custom_movies');
        }
      } else {
        const data = await movieService.getPopular(activeTab);
        setPopular(data);
      }
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
    <div className="flex flex-col gap-16 font-sans">
      {/* Header Selection */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">Cinema.</h1>
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'movie', label: 'Movies' },
              { id: 'tv', label: 'TV Shows' },
              { id: 'custom', label: 'Linked' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.2em] transition-all border shrink-0 ${activeTab === tab.id ? 'bg-white text-black border-white' : 'bg-white/[0.03] text-gray-500 border-white/5 hover:border-white/10 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSearch} className="w-full max-w-sm relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Database..." 
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[13px] focus:border-blue-500/30 outline-hidden transition-all"
          />
        </form>
      </div>

      <div className="space-y-12">
        {isSearching ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-white">Query Results</h2>
              <button 
                onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                className="text-[9px] font-bold text-gray-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
              >
                Terminate
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <AnimatePresence mode="popLayout">
                {searchResults.length > 0 ? (
                  searchResults.map((item, i) => (
                    <MediaCard key={item.id} item={item} index={i} type={activeTab} onClick={() => navigate(`/media/${activeTab}/${item.id}`)} />
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center card-subtle border-dashed">
                    <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-700">No content identified.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-xl font-bold tracking-tight text-white border-l-2 border-blue-500 pl-4 py-1">
              {activeTab === 'custom' ? 'Linked Assets' : `Popular ${activeTab === 'movie' ? 'Movies' : 'Television'}`}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {loading ? (
                Array(12).fill(0).map((_, i) => (
                  <div key={i} className="aspect-[2/3] bg-white/[0.01] border border-white/5 rounded-xl animate-pulse" />
                ))
              ) : activeTab === 'custom' ? (
                customMovies.map((item, i) => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    index={i} 
                    type={item.type} 
                    isCustom 
                    onClick={() => navigate(`/media/custom/${item.id}`)} 
                  />
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
    </div>
  );
}
