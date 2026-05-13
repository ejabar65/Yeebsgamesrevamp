import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Loader2, Image as ImageIcon, Camera, Wand2 } from 'lucide-react';

interface AvatarSearchModalProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function AvatarSearchModal({ onSelect, onClose }: AvatarSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // Using Unsplash source as a fallback for search results
      // In a real app, we'd use the proper Unsplash Search API with a key
      // and a backend proxy to avoid CORS
      
      // For this demo/app, we'll use a list of curated keywords + random seeds
      // to make it feel like a search engine
      const searchTerms = query.split(' ');
      const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      
      const mockedResults = seeds.map(seed => {
        const keyword = searchTerms[seed % searchTerms.length];
        return {
          id: `${seed}-${keyword}`,
          url: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000000)}?q=80&w=400&auto=format&fit=crop&sig=${seed}&${keyword}`,
          alt: `${query} avatar ${seed}`
        };
      });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setResults(mockedResults);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col max-h-[80vh] shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Avatar <span className="text-blue-500">Search</span></h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Find your perfect digital identity</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white/5 text-gray-500 hover:text-white rounded-2xl transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 space-y-8">
           <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for 'Anime', 'Cyberpunk', 'Space', 'Retro'..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-5 pr-16 text-sm font-medium text-white focus:outline-hidden focus:border-blue-500 transition-all placeholder:text-gray-700"
                autoFocus
              />
              <button 
                type="submit"
                className="absolute right-3 top-3 bottom-3 px-6 bg-blue-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : 'Search'}
              </button>
           </form>

           <div className="flex-1 overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
                   <Wand2 className="w-12 h-12 text-blue-500 animate-pulse" />
                   <p className="text-[10px] font-bold text-white uppercase tracking-widest">Searching the grid...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-1">
                   {results.map((result) => (
                      <motion.button
                        key={result.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onSelect(result.url)}
                        className="aspect-square rounded-2xl overflow-hidden border border-white/5 relative group bg-white/5"
                      >
                         <img 
                           src={result.url} 
                           alt={result.alt}
                           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                         />
                         <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-[8px] font-black text-white uppercase tracking-widest">Select Avatar</p>
                         </div>
                      </motion.button>
                   ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4 opacity-10">
                   <ImageIcon className="w-12 h-12 text-white mx-auto" />
                   <p className="text-[10px] font-bold text-white uppercase tracking-widest">Type a keyword to discover avatars</p>
                </div>
              )}
           </div>
        </div>

        <div className="p-6 bg-white/[0.02] border-t border-white/5 text-center">
           <p className="text-[8px] font-bold text-gray-700 uppercase tracking-[0.3em]">Images provided via Global Stock Index</p>
        </div>
      </motion.div>
    </div>
  );
}
