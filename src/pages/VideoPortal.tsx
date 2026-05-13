import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Tv, Search, Info, ExternalLink, Play, Clock, Star, X, Loader2 } from 'lucide-react';
import { movieService, MediaContent } from '../services/movieService';

interface MoviePlayerProps {
  id?: string;
}

export default function VideoPortal({ id }: MoviePlayerProps) {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [tmdbId, setTmdbId] = useState('1078605'); // Default: Oppenheimer
  const [mediaDetails, setMediaDetails] = useState<MediaContent | null>(null);
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaContent[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  React.useEffect(() => {
    const fetchDetails = async () => {
      try {
        const details = await movieService.getDetails(tmdbId, mediaType);
        setMediaDetails(details);
      } catch (err) {
        console.error("Failed to fetch details:", err);
      }
    };
    fetchDetails();
  }, [tmdbId, mediaType]);

  const getEmbedUrl = () => {
    if (mediaType === 'movie') {
      return `https://www.vidking.net/embed/movie/${tmdbId}?color=007AFF&autoPlay=true`;
    }
    return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=007AFF&autoPlay=true&nextEpisode=true&episodeSelector=true`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if it's a TMDB ID
    if (!isNaN(Number(searchQuery))) {
      setTmdbId(searchQuery);
      setSearchResults([]);
      setIsPlaying(true);
    } else {
      setIsLoadingResults(true);
      try {
        const results = await movieService.searchMedia(searchQuery, mediaType);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed:", err);
        alert("Search failed. Please try again.");
      } finally {
        setIsLoadingResults(false);
      }
    }
  };

  const handleSelectResult = (item: MediaContent) => {
    setTmdbId(item.id.toString());
    setSearchResults([]);
    setSearchQuery('');
    if (mediaType === 'tv') {
      setSeason('1');
      setEpisode('1');
    }
    setIsPlaying(true);
  };

  if (isPlaying) {
    return (
      <div className="flex flex-col h-full bg-black">
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlaying(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white uppercase tracking-wider">Now Playing</span>
              <span className="text-[10px] text-blue-500 font-mono">ID: {tmdbId} {mediaType === 'tv' && `(S${season} E${episode})`}</span>
            </div>
          </div>
          <button 
            onClick={() => window.open(getEmbedUrl(), '_blank')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-gray-300 transition-all border border-white/10"
          >
            <ExternalLink className="w-3 h-3" />
            External
          </button>
        </div>
        
        <div className="flex-1 w-full relative group">
          <iframe 
            src={getEmbedUrl()} 
            className="w-full h-full border-none"
            allowFullScreen 
            allow="autoplay; encrypted-media"
            title="Vidking Player"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-white p-8 overflow-y-auto scrollbar-none">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-mono">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            VIDKING CORE ACTIVE
          </div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
            STREAMING<span className="text-blue-500">_</span>INTERFACE
          </h1>
          <p className="text-gray-500 max-w-xl text-sm leading-relaxed">
            Endless content streaming infrastructure. Enter a TMDB ID to initiate cinematic transmission or browse active frequencies.
          </p>
        </div>

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-900/50 p-8 rounded-3xl border border-white/5 backdrop-blur-xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Media Classification</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setMediaType('movie')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${mediaType === 'movie' ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  <Film className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase italic">Movie</span>
                </button>
                <button 
                  onClick={() => setMediaType('tv')}
                  className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${mediaType === 'tv' ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                  <Tv className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase italic">Series</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Identification Key (TMDB ID or Name)</label>
              <form onSubmit={handleSearch} className="flex gap-2 relative z-50">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter ID or Movie Name..."
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button 
                  type="submit"
                  disabled={isLoadingResults}
                  className="px-6 bg-white text-black rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-black"
                >
                  {isLoadingResults ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                </button>
              </form>

              {/* Search Results Dropdown/Overlay */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-[400px] overflow-y-auto scrollbar-none"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2">Sector Scan Results</span>
                      <button onClick={() => setSearchResults([])} className="p-1 hover:bg-white/10 rounded-md">
                        <X className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="p-2 grid grid-cols-1 gap-1">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectResult(item)}
                          className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all text-left group"
                        >
                          <div className="w-12 h-18 rounded-lg overflow-hidden shrink-0 border border-white/5">
                            <img 
                              src={movieService.getPosterUrl(item.poster_path, 'small')} 
                              alt="" 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{item.title || item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-[10px] font-mono text-gray-400">{item.vote_average?.toFixed(1) || '0.0'}</span>
                              <span className="text-[10px] font-mono text-blue-500">ID: {item.id}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{item.overview}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {mediaType === 'tv' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest text-left">Season</label>
                  <input 
                    type="number" 
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Episode</label>
                  <input 
                    type="number" 
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col h-full bg-black/40 rounded-2xl border border-white/5 p-6 space-y-6">
            <div className="relative aspect-video rounded-xl overflow-hidden group cursor-pointer" onClick={() => setIsPlaying(true)}>
              <img 
                src={mediaDetails?.backdrop_path 
                  ? movieService.getBackdropUrl(mediaDetails.backdrop_path) 
                  : (mediaType === 'movie' ? `https://image.tmdb.org/t/p/w500/8Gxv0mYmUpeD9uS3M3zS6j7PZob.jpg` : `https://image.tmdb.org/t/p/w500/dfS6B-M-f67f-H-j6G-U-D-X-H-j-U-D.jpg`)} 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                alt="Preview"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 fill-white text-white ml-1" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold italic uppercase leading-none truncate">{mediaDetails?.title || mediaDetails?.name || 'Initialization Ready'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="block text-[9px] text-gray-500 font-mono uppercase tracking-widest">Source</span>
                  <span className="text-xs font-bold text-white">Vidking Player</span>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="block text-[9px] text-gray-500 font-mono uppercase tracking-widest">Status</span>
                  <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsPlaying(true)}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 rounded-xl font-black italic uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)] active:scale-[0.98]"
              >
                Launch Theater
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-3">
            <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-400" />
            </div>
            <h4 className="font-bold text-xs uppercase tracking-widest">TMDB Integration</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Integrated with The Movie Database IDs for precise content loading and metadata syncing.</p>
          </div>
          <div className="p-6 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-3">
            <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="font-bold text-xs uppercase tracking-widest">Auto-Recovery</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Streaming buffer management ensures playback continues even during low bandwidth events.</p>
          </div>
          <div className="p-6 bg-zinc-900/40 rounded-2xl border border-white/5 space-y-3">
            <div className="p-2 w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <h4 className="font-bold text-xs uppercase tracking-widest">4K Playback</h4>
            <p className="text-xs text-gray-500 leading-relaxed">Ultra high definition support available for all compatible titles with native HLS optimization.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
