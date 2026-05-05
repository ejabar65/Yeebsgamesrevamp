import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService, MediaContent } from '../services/movieService';
import { motion, AnimatePresence } from 'motion/react';

const SOURCES = [
  { 
    id: 'vidking', 
    name: 'VidKing', 
    movieUrl: (id: string) => `https://vidking.net/embed/movie/${id}?autoPlay=true`,
    tvUrl: (id: string, s: number, e: number) => `https://vidking.net/embed/tv/${id}/${s}/${e}?autoPlay=true`
  },
  { 
    id: 'vidsrc-xyz', 
    name: 'Vidsrc XYZ', 
    movieUrl: (id: string) => `https://vidsrc.xyz/embed/movie/${id}`,
    tvUrl: (id: string, s: number, e: number) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
  },
  { 
    id: 'vidsrc-to', 
    name: 'Vidsrc TO', 
    movieUrl: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  { 
    id: 'embedso', 
    name: 'EmbedSO', 
    movieUrl: (id: string) => `https://embed.so/embed/movie/${id}`,
    tvUrl: (id: string, s: number, e: number) => `https://embed.so/embed/tv/${id}/${s}/${e}`
  },
];

export default function MovieView() {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState<MediaContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState(SOURCES[0]);
  const [showPlayer, setShowPlayer] = useState(false);
  
  // TV specific state
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      if (!id) return;
      setLoading(true);
      const data = await movieService.getDetails(id, type as 'movie' | 'tv');
      setMedia(data);
      setLoading(false);
    };
    loadMedia();
    window.scrollTo(0, 0);
  }, [id, type]);

  if (loading) {
    return (
      <div className="pt-32 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
      </div>
    );
  }

  if (!media) {
    return (
      <div className="pt-32 px-4 text-center">
        <h1 className="text-2xl font-display font-black text-white mb-4">TRANSMISSION LOST</h1>
        <p className="text-gray-400 mb-8">The requested digital signal could not be found in the database.</p>
        <button 
          onClick={() => navigate('/movies')}
          className="px-6 py-2 bg-primary text-dark-surface font-black rounded-lg uppercase tracking-wider"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  const title = media.title || media.name;
  const date = media.release_date || media.first_air_date;
  const rawUrl = type === 'movie' 
    ? activeSource.movieUrl(id!) 
    : activeSource.tvUrl(id!, season, episode);

  // Ultraviolet Proxy Helper
  const getProxyUrl = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).__uv$config) {
      return (window as any).__uv$config.prefix + (window as any).__uv$config.encodeUrl(url);
    }
    return url;
  };

  const playerUrl = getProxyUrl(rawUrl);

  const openInNewTab = () => {
    window.open(rawUrl, '_blank');
  };

  return (
    <main className="pt-16 pb-12 font-sans">
      {/* Backdrop Header */}
      <div className="relative h-[50vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={movieService.getPosterUrl(media.backdrop_path || media.poster_path, 'original')} 
            alt={title}
            className="w-full h-full object-cover opacity-20 contrast-125"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#050505] to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end px-8 pb-12">
          <div className="max-w-7xl mx-auto w-full">
            <button 
              onClick={() => navigate('/movies')}
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-6 hover:text-white"
            >
              ← Back
            </button>
            
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
              {title}
            </h1>

            <div className="flex items-center gap-6 mb-8">
              <span className="font-black text-primary text-xl">{media.vote_average.toFixed(1)}</span>
              <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">{date?.split('-')[0]}</span>
              <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">{type}</span>
            </div>

            {!showPlayer && (
              <button 
                onClick={() => setShowPlayer(true)}
                className="px-12 py-5 rounded-2xl bg-primary text-black font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                Watch Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <AnimatePresence mode="wait">
          {showPlayer ? (
            <motion.div 
              key="player"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-wrap items-center justify-between gap-6">
                <div className="flex gap-2">
                  {SOURCES.map(source => (
                    <button
                      key={source.id}
                      onClick={() => setActiveSource(source)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeSource.id === source.id 
                          ? 'bg-primary text-black' 
                          : 'bg-white/5 text-gray-500 hover:text-white'
                      }`}
                    >
                      {source.name}
                    </button>
                  ))}
                </div>

                {type === 'tv' && media.seasons && (
                  <div className="flex gap-4">
                    <div className="relative">
                      <button 
                        onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                        className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10"
                      >
                        Season {season} ↓
                      </button>
                      {showSeasonDropdown && (
                        <div className="absolute top-full mt-2 left-0 w-32 bg-[#0f0f0f] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto">
                          {media.seasons.filter(s => s.season_number > 0).map(s => (
                            <button
                              key={s.season_number}
                              onClick={() => {
                                setSeason(s.season_number);
                                setEpisode(1);
                                setShowSeasonDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left text-[10px] font-bold uppercase hover:bg-primary hover:text-black transition-colors"
                            >
                              Season {s.season_number}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 rounded-xl border border-white/10">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">EP</span>
                      <input 
                        type="number" 
                        min="1"
                        value={episode}
                        onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                        className="w-10 bg-transparent text-white font-bold text-center"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="aspect-video w-full rounded-[40px] overflow-hidden bg-black border border-white/10 relative shadow-2xl group">
                <iframe 
                  src={playerUrl} 
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                  referrerPolicy="no-referrer"
                  title="Player"
                />
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-8 pointer-events-none group-active:pointer-events-auto backdrop-blur-xs">
                    <h3 className="text-xl font-black uppercase mb-2">Signal Issue?</h3>
                    <p className="text-sm text-gray-400 mb-6">If the player is blocked, use the external portal button below.</p>
                    <button 
                      onClick={openInNewTab}
                      className="pointer-events-auto px-8 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary"
                    >
                      Open External Portal
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <h2 className="text-xl font-black uppercase mb-4 tracking-tight">About</h2>
                    <p className="text-gray-400 leading-relaxed text-sm font-medium">
                      {media.overview}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                   <button 
                     onClick={openInNewTab}
                     className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                   >
                      External Window
                   </button>
                   <div className="glass p-6 rounded-[32px] border border-white/5 space-y-6">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-gray-500 uppercase">Released</span>
                         <span className="text-[10px] font-black text-white">{date}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-gray-500 uppercase">Rating</span>
                         <span className="text-[10px] font-black text-primary">{media.vote_average.toFixed(1)} / 10</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-2xl mt-12">
              <h2 className="text-2xl font-black uppercase mb-6 tracking-tight">Overview</h2>
              <p className="text-lg text-gray-400 leading-relaxed font-medium">
                {media.overview}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
