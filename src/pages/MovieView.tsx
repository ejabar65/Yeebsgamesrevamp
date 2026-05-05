import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService, MediaContent } from '../services/movieService';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, getDoc } from '../lib/firebase';
import { Play, RotateCcw, Monitor, Info, Star, ChevronRight, X, ExternalLink, Calendar, Timer } from 'lucide-react';

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
  { 
    id: 'vidsrc-me', 
    name: 'Vidsrc ME', 
    movieUrl: (id: string) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    tvUrl: (id: string, s: number, e: number) => `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}`
  },
  { 
    id: 'superembed', 
    name: 'SuperEmbed', 
    movieUrl: (id: string) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
    tvUrl: (id: string, s: number, e: number) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`
  },
];

export default function MovieView({ typeOverride }: { typeOverride?: 'movie' | 'tv' }) {
  const { id, type: pathType } = useParams();
  const type = typeOverride || pathType;
  const navigate = useNavigate();
  const [media, setMedia] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState(SOURCES[0]);
  const [showPlayer, setShowPlayer] = useState(false);
  
  // TV specific state
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true);
      if (type === 'custom') {
        try {
          const docSnap = await getDoc(doc(db, 'custom_movies', id!));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMedia({
              ...data,
              title: data.title,
              name: data.title,
              vote_average: 10,
              release_date: data.createdAt,
              overview: data.description,
              isCustom: true
            });
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        const data = await movieService.getDetails(id!, type as any);
        setMedia(data);
      }
      setLoading(false);
    };
    loadMedia();
    window.scrollTo(0, 0);
  }, [id, type]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-gray-700">Synchronizing...</p>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="pt-32 px-4 text-center font-sans">
        <h1 className="text-xl font-bold text-white mb-2">Transmission Lost</h1>
        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-600 mb-8">The signal has been terminated or does not exist.</p>
        <button 
          onClick={() => navigate('/movies')}
          className="px-6 py-2 border border-white/5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:border-white/20 transition-all"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  const title = media.title || media.name;
  const date = media.release_date || media.first_air_date;
  const backdrop = media.isCustom ? media.thumbnail : movieService.getBackdropUrl(media.backdrop_path);
  const poster = media.isCustom ? media.thumbnail : movieService.getPosterUrl(media.poster_path);

  const getPlayerUrl = () => {
    if (media.isCustom) return media.url;
    if (type === 'movie') return activeSource.movieUrl(id!);
    return activeSource.tvUrl(id!, season, episode);
  };

  const playerUrl = getPlayerUrl();

  const openInNewTab = () => {
    window.open(playerUrl, '_blank');
  };

  return (
    <main className="pt-16 pb-12 font-sans">
      {/* Backdrop Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={backdrop} 
            alt={title}
            className="w-full h-full object-cover opacity-30 grayscale contrast-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#000000] via-[#000000]/60 to-transparent" />
        </div>

        <div className="absolute inset-0 flex items-end px-8 pb-16">
          <div className="max-w-7xl mx-auto w-full">
            <button 
              onClick={() => navigate('/movies')}
              className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-8 hover:text-white transition-colors"
            >
              ← System Index
            </button>
            
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 text-white">
              {title}
            </h1>

            <div className="flex items-center gap-8 mb-12">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-blue-500 fill-current" />
                <span className="font-bold text-white text-lg">{media.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-6 text-gray-500 font-bold text-[10px] uppercase tracking-[0.4em]">
                <span>{date?.split('-')[0]}</span>
                <span>{media.isCustom ? 'LINKED' : type}</span>
              </div>
            </div>

            {!showPlayer && (
              <button 
                onClick={() => setShowPlayer(true)}
                className="px-12 py-5 rounded-xl bg-white text-black font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-gray-200 transition-all shadow-2xl shadow-white/5"
              >
                Establish Connection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 relative z-10 -mt-10">
        <AnimatePresence mode="wait">
          {showPlayer ? (
            <motion.div 
              key="player"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {!media.isCustom && (
                <div className="flex flex-wrap items-center justify-between gap-6 pb-6 border-b border-white/5">
                  <div className="flex flex-wrap gap-1.5">
                    {SOURCES.map(source => (
                      <button
                        key={source.id}
                        onClick={() => setActiveSource(source)}
                        className={`px-5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                          activeSource.id === source.id 
                            ? 'bg-white text-black' 
                            : 'bg-white/[0.02] text-gray-600 hover:text-gray-300 border border-white/5'
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
                          className="px-5 py-2 bg-white/[0.02] rounded-lg text-[9px] font-bold uppercase tracking-widest border border-white/5 hover:border-white/10"
                        >
                          S{season} <span className="opacity-40 ml-2">↓</span>
                        </button>
                        {showSeasonDropdown && (
                          <div className="absolute top-full mt-2 left-0 w-32 bg-[#080808] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-64 overflow-y-auto">
                            {media.seasons.filter(s => s.season_number > 0).map(s => (
                              <button
                                key={s.season_number}
                                onClick={() => {
                                  setSeason(s.season_number);
                                  setEpisode(1);
                                  setShowSeasonDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
                              >
                                Season {s.season_number}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 bg-white/[0.02] px-4 rounded-lg border border-white/5">
                        <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">EP</span>
                        <input 
                          type="number" 
                          min="1"
                          value={episode}
                          onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                          className="w-10 bg-transparent text-white font-bold text-center text-[11px] outline-hidden"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/5 relative group shadow-2xl">
                <iframe 
                  src={playerUrl} 
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; clipboard-write"
                  referrerPolicy="no-referrer"
                  title="Player"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-red-500/80 uppercase tracking-widest">Sandbox Detected?</span>
                </div>
                
                <button
                  onClick={openInNewTab}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all group shadow-xl"
                >
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  Bypass Protocol (New Tab)
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 pt-12">
                <div className="lg:col-span-2 space-y-10">
                  <div className="space-y-6">
                    <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600">Archived Overview</h2>
                    <p className="text-gray-400 leading-relaxed text-sm font-medium max-w-2xl">
                      {media.overview}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-8">
                   <div className="space-y-6 pt-8 border-t border-white/5">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Released</span>
                         <span className="text-[9px] font-bold text-white uppercase">{date}</span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Rating</span>
                         <span className="text-[9px] font-bold text-blue-500 uppercase">{media.vote_average.toFixed(1)} / 10</span>
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
