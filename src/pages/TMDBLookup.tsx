import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Film, Tv, Clock, Star, Copy, Check, ExternalLink, ChevronRight } from 'lucide-react';

interface TMDBResult {
  id: number;
  title: string;
  release_date?: string;
  type: string;
}

export default function TMDBLookup() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'movie' | 'tv'>('movie');
  const [results, setResults] = useState<TMDBResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tmdb-search?query=${encodeURIComponent(query)}&type=${type}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 bg-[#050505]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">TMDB ID Lookup</h1>
          <p className="text-gray-500 font-medium uppercase text-[10px] tracking-[0.3em]">Find movie and show IDs for the streaming tool</p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-8">
          <div className="flex flex-col sm:flex-row gap-4 p-2 bg-[#111] border border-white/10 rounded-2xl">
            <div className="flex bg-black/40 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setType('movie')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'movie' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => setType('tv')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${type === 'tv' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                TV Shows
              </button>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search for a ${type}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent text-sm text-white focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-white text-black hover:bg-blue-500 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.2em] rounded-xl disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Engine'}
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest text-center"
            >
              {error}
            </motion.div>
          )}

          <motion.div 
            className="grid gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {results.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#111] border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                    {type === 'movie' ? <Film className="w-5 h-5 text-blue-500" /> : <Tv className="w-5 h-5 text-indigo-500" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        {item.release_date?.split('-')[0] || 'Unknown Date'}
                      </span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded-sm bg-blue-500/10 text-blue-500 font-black uppercase tracking-tighter">
                        TMDB ID: {item.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => copyToClipboard(item.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy ID
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => window.open(`https://www.themoviedb.org/${type}/${item.id}`, '_blank')}
                    className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-gray-400 hover:text-white transition-all"
                    title="View on TMDB"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}

            {results.length === 0 && !loading && !error && query && (
              <div className="py-20 text-center">
                <Search className="w-8 h-8 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No results found for your query</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
