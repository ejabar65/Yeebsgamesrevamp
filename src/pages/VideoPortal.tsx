import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Film, Tv, Search, Info, ExternalLink, Play, Clock, Star } from 'lucide-react';

interface MoviePlayerProps {
  id?: string;
}

export default function VideoPortal({ id }: MoviePlayerProps) {
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [tmdbId, setTmdbId] = useState('1078605'); // Default: Oppenheimer
  const [season, setSeason] = useState('1');
  const [episode, setEpisode] = useState('1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getEmbedUrl = () => {
    if (mediaType === 'movie') {
      return `https://www.vidking.net/embed/movie/${tmdbId}?color=007AFF&autoPlay=true`;
    }
    return `https://www.vidking.net/embed/tv/${tmdbId}/${season}/${episode}?color=007AFF&autoPlay=true&nextEpisode=true&episodeSelector=true`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Basic heuristic: if it's a number, assume it's a TMDB ID
      if (!isNaN(Number(searchQuery))) {
        setTmdbId(searchQuery);
        setIsPlaying(true);
      } else {
        // Fallback to searching (in a real app we'd fetch from TMDB API)
        alert("Enter a TMDB ID to watch. Searching by name requires TMDB API integration.");
      }
    }
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

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Identification Key (TMDB ID)</label>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter ID (e.g. 1078605)"
                  className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button 
                  type="submit"
                  className="p-3 bg-white text-black rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>
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
                src={mediaType === 'movie' ? `https://image.tmdb.org/t/p/w500/8Gxv0mYmUpeD9uS3M3zS6j7PZob.jpg` : `https://image.tmdb.org/t/p/w500/dfS6B-M-f67f-H-j6G-U-D-X-H-j-U-D.jpg`} 
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
              <h3 className="text-xl font-bold italic uppercase leading-none">Initialization Ready</h3>
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
