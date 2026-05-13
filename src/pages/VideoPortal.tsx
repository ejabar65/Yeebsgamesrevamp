import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Play, Film, Tv, TrendingUp, Info, X, 
  ChevronRight, Star, Calendar, Clock, Volume2, Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { movieService, MediaContent } from '../services/movieService';

export default function VideoPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [trending, setTrending] = useState<MediaContent[]>([]);
  const [popular, setPopular] = useState<MediaContent[]>([]);
  const [results, setResults] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const [trendingData, popularData] = await Promise.all([
        movieService.getTrending(activeTab),
        movieService.getPopular(activeTab)
      ]);
      setTrending(trendingData);
      setPopular(popularData);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      const searchResults = await movieService.searchMedia(searchQuery, activeTab);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const featured = trending[0];

  return (
    <div className="min-h-screen pt-20 px-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Film className="w-5 h-5 text-blue-500" />
              </div>
              <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Streaming portal</h1>
            </div>
            <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
              <button 
                onClick={() => setActiveTab('movie')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'movie' ? 'bg-white text-black shadow-xl ring-4 ring-white/10' : 'text-gray-500 hover:text-white'}`}
              >
                Movies
              </button>
              <button 
                onClick={() => setActiveTab('tv')}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'tv' ? 'bg-white text-black shadow-xl ring-4 ring-white/10' : 'text-gray-500 hover:text-white'}`}
              >
                TV Shows
              </button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative group w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'movie' ? 'movies' : 'series'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all font-medium"
            />
          </form>
        </div>

        {/* Search Results */}
        <AnimatePresence mode="wait">
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white uppercase italic tracking-tight">Search Results</h2>
                <button 
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-2"
                >
                  <X className="w-3 h-3" /> Clear Results
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {results.map((item) => (
                  <MediaCard key={item.id} item={item} type={activeTab} />
                ))}
              </div>
              {results.length === 0 && !loading && (
                <div className="py-20 text-center opacity-30">
                  <Film className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No results found in {activeTab === 'movie' ? 'Cinema' : 'TV'} core</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!isSearching && (
          <>
            {/* Hero Featured */}
            {featured && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative h-[600px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/5"
              >
                <img 
                  src={movieService.getBackdropUrl(featured.backdrop_path, 'original')} 
                  alt={featured.title || featured.name}
                  className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-12 space-y-6 max-w-2xl">
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 bg-blue-500 rounded-lg text-[10px] font-black uppercase tracking-widest text-white">Featured {activeTab === 'movie' ? 'Motion Picture' : 'Direct Stream'}</div>
                    <div className="flex items-center gap-1.5 text-yellow-500">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm font-black italic">{featured.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                  <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none drop-shadow-2xl">
                    {featured.title || featured.name}
                  </h2>
                  <p className="text-gray-400 text-lg line-clamp-3 font-medium leading-relaxed">
                    {featured.overview}
                  </p>
                  <div className="flex items-center gap-4 pt-4">
                    <button 
                      onClick={() => navigate(`/media/${activeTab}/${featured.id}`)}
                      className="px-8 py-4 bg-white text-black rounded-2xl flex items-center gap-3 font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all hover:scale-105"
                    >
                      <Play className="w-5 h-5 fill-current" /> Play Now
                    </button>
                    <button className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white/20 transition-all">
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trending Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1 border-r border-white/5 pr-8 space-y-6">
                <div className="space-y-1">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Global Pulse</h3>
                  <p className="text-2xl font-black text-white italic uppercase tracking-tighter">Trending Now</p>
                </div>
                <div className="space-y-4">
                  {trending.slice(1, 5).map((item, idx) => (
                    <button 
                      key={item.id}
                      onClick={() => navigate(`/media/${activeTab}/${item.id}`)}
                      className="flex items-center gap-4 group w-full text-left"
                    >
                      <span className="text-4xl font-black text-white/10 group-hover:text-blue-500/20 transition-colors italic">0{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-blue-500 transition-colors uppercase italic">{item.title || item.name}</p>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{activeTab === 'movie' ? item.release_date?.substring(0, 4) : item.first_air_date?.substring(0, 4)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-3 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-600 uppercase tracking-[0.3em]">Popular Access</h3>
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {popular.slice(0, 10).map((item) => (
                    <MediaCard key={item.id} item={item} type={activeTab} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface MediaCardProps {
  item: MediaContent;
  type: 'movie' | 'tv';
}

const MediaCard: React.FC<MediaCardProps> = ({ item, type }) => {
  const navigate = useNavigate();
  
  return (
    <motion.button
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/media/${type}/${item.id}`)}
      className="flex flex-col gap-4 text-left group"
    >
      <div className="relative aspect-[2/3] rounded-3xl overflow-hidden border border-white/5 shadow-xl bg-white/[0.02]">
        <img 
          src={movieService.getPosterUrl(item.poster_path)} 
          alt={item.title || item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-0 flex items-center justify-center translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform delay-100">
            <Play className="w-6 h-6 fill-current ml-1" />
          </div>
        </div>
        <div className="absolute top-4 right-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500 fill-current" />
          <span className="text-[10px] font-black text-white">{item.vote_average.toFixed(1)}</span>
        </div>
      </div>
      <div className="px-1 space-y-1">
        <h4 className="text-xs font-black text-white uppercase italic tracking-tight truncate group-hover:text-blue-500 transition-colors">
          {item.title || item.name}
        </h4>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
            {type === 'movie' ? item.release_date?.substring(0, 4) : item.first_air_date?.substring(0, 4)}
          </span>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <span className="text-[9px] font-black text-blue-500/60 uppercase tracking-widest italic">{type === 'movie' ? 'Film' : 'Series'}</span>
        </div>
      </div>
    </motion.button>
  );
}
