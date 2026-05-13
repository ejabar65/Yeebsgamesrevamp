import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Play, Film, Tv, Info, X, 
  Star, ExternalLink, Zap, Activity, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../services/movieService';

export default function VideoPortal() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const [method, setMethod] = useState<'search' | 'id'>('search');
  const [query, setQuery] = useState('');
  const [tmdbId, setTmdbId] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await movieService.searchMedia(query, activeTab);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIdAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmdbId.trim()) return;
    navigate(`/media/${activeTab}/${tmdbId}`);
  };

  return (
    <div className="min-h-screen pt-24 px-4 sm:px-6 pb-20 bg-[#020202] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        <header className="text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-2xl shadow-blue-500/10">
              <Zap className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">Stream <span className="text-blue-500">Core</span></h1>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.4em]">Direct Orbital Link Established</p>
            </div>
          </motion.div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <button 
              onClick={() => { setMethod('search'); setResults([]); }}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'search' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
            >
              Search Engine
            </button>
            <button 
              onClick={() => { setMethod('id'); setResults([]); }}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${method === 'id' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 hover:text-white'}`}
            >
              Direct ID Method
            </button>
          </div>
        </header>

        <motion.div 
          layout
          className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 sm:p-12 backdrop-blur-3xl shadow-3xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => setActiveTab('movie')}
              className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${activeTab === 'movie' ? 'bg-white text-black font-black' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'}`}
            >
              <Film className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-widest font-black">Cinema</span>
            </button>
            <button 
              onClick={() => setActiveTab('tv')}
              className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${activeTab === 'tv' ? 'bg-white text-black font-black' : 'bg-white/5 text-gray-500 hover:text-white border border-white/5'}`}
            >
              <Tv className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-widest font-black">Series</span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {method === 'search' ? (
              <motion.form 
                key="search"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSearch}
                className="space-y-6"
              >
                <div className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Enter ${activeTab === 'movie' ? 'movie' : 'show'} title...`}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-6 py-6 text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-gray-800"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-blue-500 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-4"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      Ping Database
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="id"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleIdAccess}
                className="space-y-6"
              >
                <div className="relative group">
                  <Globe className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text"
                    value={tmdbId}
                    onChange={(e) => setTmdbId(e.target.value)}
                    placeholder="Enter TMDB ID (e.g. 157336)..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl pl-16 pr-6 py-6 text-sm font-bold text-white focus:outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-gray-800"
                  />
                </div>
                <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest text-center leading-relaxed">
                    Direct access mode bypasses search and connects strictly to the TMDB ID provided. High efficiency for power users.
                  </p>
                </div>
                <button 
                  type="submit"
                  className="w-full py-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-blue-500 hover:text-white transition-all shadow-xl flex items-center justify-center gap-4"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Request Link
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Grid */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.5em]">Global Search Results</h3>
                <div className="h-px flex-1 bg-white/5" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {results.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ y: -5 }}
                    onClick={() => navigate(`/media/${activeTab}/${item.id}`)}
                    className="flex flex-col gap-3 text-left group"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-white/5 shadow-xl">
                      <img 
                        src={movieService.getPosterUrl(item.poster_path)} 
                        alt={item.title || item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <div className="flex items-center gap-2">
                           <Star className="w-3 h-3 text-yellow-500 fill-current" />
                           <span className="text-[10px] font-black">{item.vote_average?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-1">
                      <h4 className="text-[11px] font-black text-white uppercase italic truncate group-hover:text-blue-500 transition-colors">
                        {item.title || item.name}
                      </h4>
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">
                        {activeTab === 'movie' ? item.release_date?.substring(0, 4) : item.first_air_date?.substring(0, 4)}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="text-center pt-20">
           <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/[0.02] border border-white/5 rounded-full backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Activity className="w-3 h-3 text-green-500" />
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Proxy Active</span>
              </div>
              <div className="w-px h-3 bg-white/10" />
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-blue-500" />
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Global Relay SSL</span>
              </div>
           </div>
        </footer>
      </div>
    </div>
  );
}

