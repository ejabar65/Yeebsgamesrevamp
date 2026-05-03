import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService, MediaContent } from '../services/movieService';
import { ChevronLeft, Star, Clock, Calendar, Info, Play, MessageSquare, Share2, Layers, Zap, Monitor, ExternalLink, ChevronDown, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SOURCES = [
  { 
    id: 'vidking', 
    name: 'VidKing (Pro)', 
    movieUrl: (id: string) => `https://vidking.net/embed/movie/${id}?color=facc15&autoPlay=true`,
    tvUrl: (id: string, s: number, e: number) => `https://vidking.net/embed/tv/${id}/${s}/${e}?color=facc15&autoPlay=true&episodeSelector=true`
  },
  { 
    id: 'vidsrc', 
    name: 'VidSrc', 
    movieUrl: (id: string) => `https://vidsrc.to/embed/movie/${id}`,
    tvUrl: (id: string, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
  },
  { 
    id: 'vidsrc_me', 
    name: 'VidSrc.me', 
    movieUrl: (id: string) => `https://vidsrc.me/embed/movie/${id}`,
    tvUrl: (id: string, s: number, e: number) => `https://vidsrc.me/embed/tv/${id}/${s}/${e}`
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
  const playerUrl = type === 'movie' 
    ? activeSource.movieUrl(id!) 
    : activeSource.tvUrl(id!, season, episode);

  const openInNewTab = () => {
    window.open(playerUrl, '_blank');
  };

  return (
    <main className="pt-16 pb-12">
      {/* Backdrop Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={movieService.getPosterUrl(media.backdrop_path || media.poster_path, 'original')} 
            alt={title}
            className="w-full h-full object-cover grayscale contrast-125 opacity-30"
          />
          <div className="absolute inset-0 bg-linear-to-t from-dark-surface via-dark-surface/60 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end px-4 md:px-12 pb-12">
          <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-8 items-end">
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="shrink-0 hidden md:block"
            >
              <img 
                src={movieService.getPosterUrl(media.poster_path)} 
                alt={title}
                className="w-56 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
              />
            </motion.div>

            <div className="flex-1">
              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/movies')}
                className="flex items-center gap-2 text-gray-400 hover:text-primary mb-6 group transition-colors"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">Back to Portal</span>
              </motion.button>
              
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary mb-4">
                {type === 'movie' ? <Film className="w-3 h-3" /> : <Monitor className="w-3 h-3 text-accent" />}
                {type}
              </div>

              <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl md:text-6xl lg:text-7xl font-display font-black uppercase tracking-tighter mb-4 leading-tight"
              >
                {title}
              </motion.h1>

              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                  <Star className="w-4 h-4 text-primary fill-current" />
                  <span className="font-display font-black text-primary">{media.vote_average.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 font-mono text-xs uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  {date}
                </div>
              </div>

              {!showPlayer && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPlayer(true)}
                  className="px-10 py-5 rounded-2xl bg-primary text-dark-surface font-display font-black flex items-center gap-3 shadow-[0_0_40px_rgba(250,204,21,0.4)] group"
                >
                  <Play className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  START TRANSMISSION
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10">
        <AnimatePresence mode="wait">
          {showPlayer ? (
            <motion.div 
              key="player"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-4">
                {/* Control Panel */}
                <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-[32px] border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 animate-pulse">
                      <Play className="w-5 h-5 text-primary fill-current" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Signal Source</p>
                      <p className="text-sm font-display font-bold text-white uppercase">{activeSource.name}</p>
                    </div>
                  </div>
                  
                  {type === 'tv' && media.seasons && (
                    <div className="flex gap-4 flex-1 justify-center md:justify-end">
                      {/* Season Selector */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                          className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2 hover:bg-white/10 transition-all"
                        >
                          Season {season}
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <AnimatePresence>
                          {showSeasonDropdown && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute bottom-full mb-2 left-0 w-32 bg-dark-card border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto"
                            >
                              {media.seasons.filter(s => s.season_number > 0).map(s => (
                                <button
                                  key={s.season_number}
                                  onClick={() => {
                                    setSeason(s.season_number);
                                    setEpisode(1);
                                    setShowSeasonDropdown(false);
                                  }}
                                  className={`w-full px-4 py-2 text-left text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-dark-surface transition-colors ${season === s.season_number ? 'bg-primary/20 text-primary' : 'text-gray-400'}`}
                                >
                                  Season {s.season_number}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Episode Inputs */}
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">EP</span>
                        <input 
                          type="number" 
                          min="1"
                          max={media.seasons.find(s => s.season_number === season)?.episode_count || 50}
                          value={episode}
                          onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                          className="w-12 bg-transparent text-white font-black text-center focus:outline-hidden"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {SOURCES.map(source => (
                      <button
                        key={source.id}
                        onClick={() => setActiveSource(source)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeSource.id === source.id 
                            ? 'bg-primary text-dark-surface shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                            : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {source.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player Container */}
                <div className="relative group">
                  <div className="aspect-video w-full rounded-[40px] overflow-hidden bg-black border-4 border-white/5 shadow-2xl relative">
                    <iframe 
                      src={playerUrl} 
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; encrypted-media; picture-in-picture; clipboard-write; display-capture"
                      referrerPolicy="no-referrer"
                      title="Media Player"
                    />
                    
                    {/* Fallback overlay if iframe is blocked by sandbox */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm pointer-events-none group-active:pointer-events-auto">
                        <Info className="w-12 h-12 text-primary mb-4" />
                        <h3 className="text-xl font-display font-black uppercase mb-2">Signal Blocked?</h3>
                        <p className="text-sm text-gray-300 max-w-md mb-6 font-medium">If the player is stuck or showing error, try opening the transmission directly in a new portal window.</p>
                        <button 
                          onClick={openInNewTab}
                          className="pointer-events-auto px-8 py-3 bg-primary text-dark-surface rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white transition-all shadow-xl"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open External Link
                        </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="glass p-8 rounded-[40px] border border-white/5">
                    <h2 className="text-2xl font-display font-black uppercase mb-4 tracking-tight">Intelligence <span className="text-primary italic">Report</span></h2>
                    <p className="text-gray-400 leading-relaxed font-medium">
                      {media.overview}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="glass p-6 rounded-[32px] border border-white/5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Transmission Details
                    </h3>
                    <div className="space-y-4">
                      <DetailItem label="Status" value="Decrypted" color="text-green-500" />
                      <DetailItem label="Release" value={date || 'Unknown'} />
                      <DetailItem label="Signal Strength" value={`${(media.vote_average * 10).toFixed(0)}%`} />
                      <DetailItem label="Type" value={type === 'movie' ? 'Full Motion Picture' : 'Serialized Content'} />
                      {type === 'tv' && <DetailItem label="Seasons" value={media.number_of_seasons?.toString() || '1'} />}
                    </div>
                  </div>

                  <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
                     <button 
                       onClick={openInNewTab}
                       className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-dark-surface transition-all flex items-center justify-center gap-2"
                     >
                        <ExternalLink className="w-4 h-4" />
                        External Portal
                     </button>
                     <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-dark-surface transition-all flex items-center justify-center gap-2">
                        <Share2 className="w-4 h-4" />
                        Redirect Signal
                     </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="info"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl space-y-8 mt-12"
            >
              <div>
                <h2 className="text-3xl font-display font-black uppercase mb-6 tracking-tight">Plot <span className="text-primary italic">Overview</span></h2>
                <p className="text-xl text-gray-300 leading-relaxed font-medium">
                  {media.overview}
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/5">
                <DetailBox label="Rating" value={media.vote_average.toFixed(1)} icon={Star} />
                <DetailBox label="Year" value={date?.split('-')[0] || 'N/A'} icon={Calendar} />
                <DetailBox label="Status" value="Ready" icon={Zap} />
                <DetailBox label="Security" value="Encrypted" icon={Info} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );

  function DetailItem({ label, value, color }: { label: string, value: string, color?: string }) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${color || 'text-white'}`}>{value}</span>
      </div>
    );
  }

  function DetailBox({ label, value, icon: Icon }: { label: string, value: string, icon: any }) {
    return (
      <div className="glass p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center">
        <Icon className="w-5 h-5 text-primary mb-2" />
        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-sm font-black text-white uppercase">{value}</p>
      </div>
    );
  }
}
