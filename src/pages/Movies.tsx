import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { movieService, MediaContent } from '../services/movieService';
import { useNavigate } from 'react-router-dom';
import { Search, Play, Star, ChevronRight, ChevronLeft, TrendingUp, Monitor, Film, Plus, Activity } from 'lucide-react';
import { db, collection, getDocs } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { MASCOT_URL } from '../constants';

const MediaCard: React.FC<{ item: any, index: number, type: string, onClick: () => void }> = ({ item, index, type, onClick }) => {
  const title = item.title || item.name;
  const posterPath = item.isCustom ? item.thumbnail : movieService.getPosterUrl(item.poster_path);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="group relative cursor-pointer aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden bg-white/5 border border-white/5 shadow-lg shadow-black/40 hover:shadow-blue-500/10 transition-all duration-500"
      onClick={onClick}
    >
      <img 
        src={posterPath} 
        alt={title} 
        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-50"
        referrerPolicy="no-referrer"
      />
      
      <div className="absolute inset-0 p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 bg-linear-to-t from-black/80 via-transparent text-shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-[10px] font-black text-white">{item.vote_average?.toFixed(1) || '0.0'}</span>
          </div>
          <h3 className="font-bold text-xs text-white line-clamp-2 leading-tight uppercase tracking-tighter">
            {title}
          </h3>
          <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
            {type} • {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || '2026'}
          </p>
        </div>
      </div>

      {item.isCustom && (
        <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500 rounded-md shadow-lg z-10">
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Linked Asset</span>
        </div>
      )}
    </motion.div>
  );
}

export default function Movies() {
  const [activeTab, setActiveTab] = useState<'movie' | 'tv' | 'custom'>('movie');
  const [trending, setTrending] = useState<MediaContent[]>([]);
  const [popular, setPopular] = useState<MediaContent[]>([]);
  const [customMovies, setCustomMovies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem('yeebs_continue_watching') || '[]');
      setContinueWatching(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to parse continue watching list:', e);
      setContinueWatching([]);
    }
  }, []);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'custom') {
          const snapshot = await getDocs(collection(db, 'custom_movies'));
          setCustomMovies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isCustom: true })));
          setTrending([]);
          setPopular([]);
        } else {
          const [trendingData, popularData] = await Promise.all([
            movieService.getTrending(activeTab),
            movieService.getPopular(activeTab)
          ]);
          
          if (trendingData.length === 0 && popularData.length === 0) {
            throw new Error(`No ${activeTab === 'movie' ? 'movies' : 'shows'} found from provider.`);
          }

          setTrending(trendingData);
          setPopular(popularData);
        }
      } catch (error) {
        console.error(error);
        setError(error instanceof Error ? error.message : 'Connection to movie database failed');
      }
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (trending.length > 0) {
      const timer = setInterval(() => {
        setHeroIndex(prev => (prev + 1) % Math.min(trending.length, 5));
      }, 8000);
      return () => clearInterval(timer);
    }
  }, [trending]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = await movieService.searchMedia(searchQuery, activeTab === 'custom' ? 'movie' : activeTab);
    setSearchResults(results);
  };

  if (loading && trending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-[#020202] gap-8">
        <div className="relative">
          <div className="w-20 h-20 border-b-2 border-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500 animate-pulse">Initializing Cinema</p>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Connecting to Orbital Relay...</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-all"
          >
            Timed Out? Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentHero = trending[heroIndex];

  return (
    <div className="min-h-svh bg-[#020202] text-white font-sans selection:bg-blue-500 selection:text-white pb-24 relative overflow-x-hidden">
      {/* Dynamic Background Noise/Aura */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-full h-full bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-full h-full bg-purple-600/5 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-12 sm:space-y-16">
        {/* Navigation & Search */}
        <header className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-center justify-between">
          <div className="space-y-6 w-full lg:w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-left duration-1000">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/20 border border-white/10 shrink-0">
                <img src={MASCOT_URL} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-black tracking-[calc(-0.06em)] uppercase italic leading-[0.75] text-center sm:text-left">
                Yeebs<span className="text-blue-500 block text-3xl sm:text-5xl md:text-7xl not-italic mt-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Cinema™</span>
              </h1>
            </div>
            <nav className="flex overflow-x-auto gap-2 bg-white/5 p-1 rounded-2xl backdrop-blur-3xl border border-white/10 shadow-2xl w-full sm:w-fit no-scrollbar">
              {[
                { id: 'movie', label: 'Movies' },
                { id: 'tv', label: 'TV Shows' },
                { id: 'custom', label: 'Local' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className={`flex-1 sm:flex-none px-6 sm:px-8 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-white text-black scale-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5 scale-95'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSearch} className="w-full max-w-lg relative group">
            <div className="absolute inset-0 bg-blue-500/10 rounded-[2rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 transition-colors group-focus-within:text-blue-500" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-[1.8rem] py-4 sm:py-5 pl-14 pr-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] focus:bg-white/[0.07] focus:border-blue-500/40 outline-hidden transition-all placeholder:text-gray-800 backdrop-blur-md shadow-xl"
            />
          </form>
        </header>

        {isSearching ? (
          <motion.section 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-12"
          >
            <div className="flex items-end justify-between border-b border-white/5 pb-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em]">Searching Database...</p>
                <h2 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter">Search Results</h2>
              </div>
              <button 
                onClick={() => { setIsSearching(false); setSearchQuery(''); }}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-red-500/10 text-red-500 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
              >
                Cancel
              </button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-8">
              {searchResults.length > 0 ? (
                searchResults.map((item, i) => (
                  <MediaCard 
                    key={item.id} 
                    item={item} 
                    index={i} 
                    type={activeTab} 
                    onClick={() => navigate(`/media/${activeTab}/${item.id}`)} 
                  />
                ))
              ) : (
                <div className="col-span-full py-24 sm:py-40 text-center">
                  <p className="text-[10px] sm:text-[12px] font-black text-gray-800 uppercase tracking-[0.5em]">No results found.</p>
                </div>
              )}
            </div>
          </motion.section>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-12 sm:space-y-20"
            >
              {/* Error State */}
              {error && (
                <div className="py-20 text-center space-y-8 bg-red-500/5 rounded-[3rem] border border-red-500/10">
                  <Activity className="w-16 h-16 text-red-500/20 mx-auto" />
                  <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Database Unreachable</h3>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest max-w-md mx-auto">{error}</p>
                  </div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all"
                  >
                    Retry Connection
                  </button>
                </div>
              )}

              {/* Hero Section */}
              {!loading && !error && trending.length > 0 && activeTab !== 'custom' && (
                <section className="relative h-[55svh] sm:h-[75vh] w-full rounded-2xl sm:rounded-[3rem] md:rounded-[4rem] overflow-hidden group shadow-3xl border border-white/5 animate-in fade-in zoom-in duration-1000">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentHero.id}
                      initial={{ opacity: 0, scale: 1.15, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0.9, filter: 'blur(20px)' }}
                      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0"
                    >
                      <img 
                        src={movieService.getBackdropUrl(currentHero.backdrop_path || currentHero.poster_path, 'original')} 
                        alt={currentHero.title || currentHero.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=1280';
                        }}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-[#020202]/40 to-transparent" />
                      <div className="absolute inset-0 bg-linear-to-r from-[#020202] via-transparent to-transparent opacity-60" />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-20 space-y-6 sm:space-y-10">
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                      className="space-y-4 sm:space-y-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="px-3 py-1 sm:px-4 sm:py-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/30">
                          <span className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-[0.2em]">Trending</span>
                        </div>
                        <div className="flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/10">
                          <Star className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-yellow-500 fill-current" />
                          <span className="text-xs sm:text-sm font-black text-white">{(currentHero.vote_average || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <h2 className="text-[clamp(1.75rem,8vw,7.5rem)] font-black uppercase italic tracking-tighter leading-[0.9] max-w-4xl text-shadow-xl line-clamp-2 md:line-clamp-none group-hover:scale-[1.02] transition-transform duration-1000">
                        {currentHero.title || currentHero.name || 'Untitled Content'}
                      </h2>
                      <p className="text-gray-400 font-medium text-xs sm:text-lg md:text-xl max-w-2xl line-clamp-2 md:line-clamp-3">
                        {currentHero.overview}
                      </p>
                    </motion.div>

                    <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-8">
                      <button 
                        onClick={() => navigate(`/media/${activeTab}/${currentHero.id}`)}
                        className="w-full md:w-auto flex items-center justify-center gap-3 sm:gap-4 px-8 sm:px-14 py-4 sm:py-6 bg-white text-black rounded-[1.5rem] sm:rounded-[2rem] font-black text-[11px] sm:text-[13px] uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-blue-500 hover:text-white transition-all duration-700 group shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-blue-500/30"
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current group-hover:scale-125 transition-transform duration-500" />
                        Watch Now
                      </button>
                      
                      <div className="flex gap-2 sm:gap-3 bg-white/5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/10">
                         {trending.slice(0, 5).map((_, i) => (
                           <button 
                             key={i} 
                             onClick={() => setHeroIndex(i)}
                             className={`h-1.5 sm:h-2 rounded-full transition-all duration-700 ${heroIndex === i ? 'w-10 sm:w-16 bg-white' : 'w-1.5 sm:w-2 bg-white/20 hover:bg-white/40'}`}
                           />
                         ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Continue Watching */}
              {continueWatching.length > 0 && (
                <section className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-[2px] bg-blue-500" />
                    <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.5em]">Resume Watching</p>
                  </div>
                  <div className="flex overflow-x-auto gap-8 pb-8 no-scrollbar scroll-smooth">
                    {continueWatching.map((item, i) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => navigate(`/media/${item.type}/${item.id}`)}
                        className="group relative min-w-[300px] aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/5 cursor-pointer flex-shrink-0"
                      >
                        <img src={item.backdrop} alt={item.title} className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-transparent p-6 flex flex-col justify-end">
                           <h4 className="text-sm font-black uppercase tracking-tighter mb-2">{item.title}</h4>
                           <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${item.percentage}%` }} />
                           </div>
                           <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mt-2">
                             {item.type === 'tv' ? `S${item.season} E${item.episode}` : 'Resume'} • {Math.round(item.percentage)}%
                           </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Grid Section */}
              <section className="space-y-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-[2px] bg-blue-500" />
                    <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.5em]">Browse Collections</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                      {activeTab === 'custom' ? 'Custom Local' : `Recent ${activeTab === 'movie' ? 'Movies' : 'TV Shows'}`}
                    </h2>
                    <div className="hidden md:flex gap-4">
                       <Monitor className="w-5 h-5 text-gray-800" />
                       <Film className="w-5 h-5 text-gray-800" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-8">
                  {loading ? (
                    Array(12).fill(0).map((_, i) => (
                      <div key={i} className="aspect-[2/3] bg-white/[0.03] rounded-xl sm:rounded-[2rem] animate-pulse border border-white/5" />
                    ))
                  ) : (
                    activeTab === 'custom' ? (
                      customMovies.length > 0 ? (
                        customMovies.map((item, i) => (
                          <MediaCard key={item.id} item={item} index={i} type={item.type || 'Custom'} onClick={() => navigate(`/media/custom/${item.id}`)} />
                        ))
                      ) : (
                        <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-2xl sm:rounded-[3rem] bg-white/[0.01]">
                          <Plus className="w-12 h-12 text-white/5 mx-auto mb-6" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">No local movies or shows added yet.</p>
                        </div>
                      )
                    ) : (
                      popular.length > 0 ? (
                        popular.map((item, i) => (
                          <MediaCard key={item.id} item={item} index={i} type={activeTab} onClick={() => navigate(`/media/${activeTab}/${item.id}`)} />
                        ))
                      ) : (
                        <div className="col-span-full py-40 text-center border-2 border-dashed border-white/5 rounded-2xl sm:rounded-[3rem] bg-white/[0.01]">
                          <Activity className="w-12 h-12 text-white/5 mx-auto mb-6" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">No content available in this sector.</p>
                        </div>
                      )
                    )
                  )}
                </div>
              </section>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
