import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService, MediaContent } from '../services/movieService';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, getDoc } from '../lib/firebase';
import { Play, RotateCcw, Monitor, Info, Star, ChevronRight, X, ExternalLink, Calendar, Timer, Activity, Zap, Shield } from 'lucide-react';
import { MASCOT_URL } from '../constants';

const SOURCES = [
  { 
    id: 'vidking', 
    name: 'VidKing', 
    movieUrl: (id: string, color: string = '3b82f6') => `https://vidking.net/embed/movie/${id}?color=${color.replace('#', '')}&autoPlay=true`,
    tvUrl: (id: string, s: number, e: number, color: string = '3b82f6') => `https://vidking.net/embed/tv/${id}/${s}/${e}?color=${color.replace('#', '')}&autoPlay=true&nextEpisode=true&episodeSelector=true`
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

  const title = media?.title || media?.name;
  const date = media?.release_date || media?.first_air_date;
  const backdrop = media?.isCustom ? media?.thumbnail : (media ? movieService.getBackdropUrl(media.backdrop_path, 'original') : '');

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'PLAYER_EVENT' && data.data.event === 'timeupdate') {
            const progressData = {
              id: id,
              type: type,
              time: data.data.currentTime,
              duration: data.data.duration,
              percentage: data.data.progress,
              updatedAt: Date.now(),
              title: media?.title || media?.name,
              backdrop: backdrop,
              season: season,
              episode: episode
            };
            localStorage.setItem(`yeebs_progress_${id}`, JSON.stringify(progressData));
            
            // Also store in a central "continue watching" list
            const continueList = JSON.parse(localStorage.getItem('yeebs_continue_watching') || '[]');
            const filtered = continueList.filter((i: any) => i.id !== id);
            localStorage.setItem('yeebs_continue_watching', JSON.stringify([progressData, ...filtered].slice(0, 10)));
          }
        }
      } catch (e) {
        // Not a player event or malformed JSON, ignore
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [id, type, media, backdrop, season, episode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-[#020202] gap-12">
        <div className="relative">
          <div className="w-16 h-16 border-b-2 border-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500/60 animate-pulse">Loading Cinematic Experience...</p>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Negotiating with Stream Hubs...</p>
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

  if (!media) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh bg-[#020202] text-center p-6 gap-8">
        <Activity className="w-12 h-12 text-red-500/20" />
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Content Missing</h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">The requested media is currently out of orbital range.</p>
        </div>
        <button 
          onClick={() => navigate('/movies')}
          className="px-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/10 transition-all"
        >
          Return to Cinema
        </button>
      </div>
    );
  }

  let savedProgress = null;
  try {
    savedProgress = JSON.parse(localStorage.getItem(`yeebs_progress_${id}`) || 'null');
  } catch (e) {
    console.error("Failed to parse progress", e);
  }
  
  const startProgress = savedProgress?.time ? `&progress=${Math.floor(savedProgress.time)}` : '';
  const playerColor = '&color=3b82f6'; // Yeebs Blue

  const getUrl = (baseUrl: string) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}autoPlay=true${playerColor}${startProgress}&nextEpisode=true&episodeSelector=true`;
  };

  const playerUrl = media.isCustom 
    ? media.url 
    : (type === 'movie' 
        ? getUrl(activeSource.id === 'vidking' ? (activeSource as any).movieUrl(id!, '3b82f6') : activeSource.movieUrl(id!)) 
        : getUrl(activeSource.id === 'vidking' ? (activeSource as any).tvUrl(id!, season, episode, '3b82f6') : activeSource.tvUrl(id!, season, episode)));

  return (
    <main className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-500 pb-32">
      {/* Background Media */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img 
          src={backdrop} 
          alt="" 
          className="w-full h-full object-cover opacity-20 grayscale brightness-50"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-148501743735a-949467933039?auto=format&fit=crop&q=80&w=1280';
          }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#020202] via-[#020202]/80 to-[#020202]/40" />
      </div>

      {/* Floating Header */}
      <header className="fixed top-0 inset-x-0 h-16 sm:h-24 flex items-center justify-between px-4 sm:px-10 z-50 backdrop-blur-md border-b border-white/5 bg-black/20">
        <button 
          onClick={() => navigate('/movies')}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
            <X className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 group-hover:text-white transition-colors">Back</span>
        </button>

        <div className="hidden md:flex items-center gap-8">
           <div className="flex items-center gap-2">
             <Star className="w-4 h-4 text-yellow-500 fill-current" />
             <span className="font-black text-lg">{(media.vote_average || 0).toFixed(1)}</span>
           </div>
           <div className="h-4 w-px bg-white/10" />
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 truncate max-w-[200px]">{title}</p>
        </div>

        <button 
          onClick={() => window.open(playerUrl, '_blank')}
          className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-blue-600 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Open Direct</span>
          <span className="sm:hidden">Open</span>
        </button>
      </header>

      {/* Hero Banner Section (Hidden when player is active) */}
      {!showPlayer && (
        <section className="relative min-h-[90svh] flex flex-col justify-end px-4 sm:px-12 pb-24 md:pb-32 max-w-7xl mx-auto z-10 w-full pt-32 sm:pt-0">
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             className="space-y-6 sm:space-y-8"
           >
             <div className="space-y-4">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-1 bg-blue-500" />
                   <p className="text-[10px] sm:text-[11px] font-black text-blue-500 uppercase tracking-[0.6em]">{media.isCustom ? 'LOCAL ASSET' : type === 'movie' ? 'MOVIE' : 'SERIES'}</p>
                </div>
                <h1 className="text-4xl sm:text-7xl md:text-[8rem] lg:text-[10rem] font-black uppercase italic tracking-[calc(-0.04em)] leading-[0.85] sm:leading-[0.75] text-white text-shadow-2xl">
                  {title}
                </h1>
             </div>

             <div className="flex flex-wrap items-center gap-6 sm:gap-10 text-gray-500 font-black text-[10px] sm:text-[12px] uppercase tracking-[0.3em]">
               <div className="flex items-center gap-2">
                 <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                 <span>{date?.split('-')[0]}</span>
               </div>
               {!media.isCustom && media.runtime && (
                 <div className="flex items-center gap-2">
                   <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                   <span>{Math.floor(media.runtime / 60)}h {media.runtime % 60}m</span>
                 </div>
               )}
               {media.genres && (
                 <div className="flex gap-4">
                   {media.genres.slice(0, 2).map((g: any) => (
                     <span key={g.id} className="text-white/40">{g.name}</span>
                   ))}
                 </div>
               )}
             </div>

             <p className="text-lg sm:text-2xl text-gray-400 font-medium leading-relaxed max-w-3xl line-clamp-4 sm:line-clamp-none">
               {media.overview}
             </p>

             <button 
               onClick={() => setShowPlayer(true)}
               className="group flex items-center justify-center gap-4 sm:gap-6 px-10 sm:px-16 py-6 sm:py-8 bg-white text-black rounded-[2rem] sm:rounded-[2.5rem] font-black text-[12px] sm:text-[14px] uppercase tracking-[0.3em] sm:tracking-[0.4em] hover:bg-blue-500 hover:text-white transition-all duration-700 shadow-2xl shadow-blue-500/20 w-full sm:w-auto"
             >
               <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current group-hover:scale-125 transition-transform duration-500" />
               Watch Now
             </button>
           </motion.div>
        </section>
      )}

      {/* Immersive Player Section */}
      {showPlayer && (
        <section className="relative z-10 pt-20 sm:pt-32 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8 sm:space-y-12">
          {/* Controls Bar */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-between gap-6 sm:gap-8 bg-white/[0.03] p-4 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 backdrop-blur-3xl shadow-2xl"
          >
            <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pb-2 sm:pb-0 justify-start sm:justify-center">
               {SOURCES.map(source => (
                 <button
                   key={source.id}
                   onClick={() => setActiveSource(source)}
                   className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                     activeSource.id === source.id 
                       ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40' 
                       : 'text-gray-500 hover:text-white hover:bg-white/5'
                   }`}
                 >
                   {source.name}
                 </button>
               ))}
            </div>

            {type === 'tv' && media.seasons && (
              <div className="flex flex-row items-center gap-4 w-full sm:w-auto justify-between sm:justify-center">
                 <div className="relative">
                   <button 
                     onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
                     className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white/5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-white/10 hover:border-white/20 transition-all flex items-center gap-3"
                   >
                     S{season} <ChevronRight className={`w-3 h-3 transition-transform ${showSeasonDropdown ? 'rotate-90' : ''}`} />
                   </button>
                   <AnimatePresence>
                     {showSeasonDropdown && (
                       <motion.div 
                         initial={{ opacity: 0, scale: 0.95 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className="absolute top-full mt-2 left-0 w-48 bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-3xl z-50 max-h-80 overflow-y-auto"
                       >
                         {media.seasons.filter((s: any) => s.season_number > 0).map((s: any) => (
                           <button
                             key={s.season_number}
                             onClick={() => {
                               setSeason(s.season_number);
                               setEpisode(1);
                               setShowSeasonDropdown(false);
                             }}
                             className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all border-b border-white/5"
                           >
                             Season {s.season_number}
                             <span className="block text-[8px] opacity-40 mt-1">{s.episode_count} Episodes</span>
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
                 
                 <div className="flex items-center gap-4 bg-white/5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border border-white/10">
                   <span className="text-[9px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest">Ep</span>
                   <input 
                     type="number" 
                     min="1"
                     value={episode}
                     onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                     className="w-8 sm:w-12 bg-transparent text-white font-black text-center text-sm outline-hidden focus:text-blue-500 transition-colors"
                   />
                 </div>
              </div>
            )}
          </motion.div>

          {/* Video Containment */}
          <motion.div 
            layoutId="player-container"
            className="aspect-video w-full rounded-2xl sm:rounded-[3rem] overflow-hidden bg-black border border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] relative group sm:scale-100"
          >
             <iframe 
               src={playerUrl} 
               className="w-full h-full"
               allowFullScreen
               allow="autoplay; encrypted-media; fullscreen; picture-in-picture; accelerometer; gyroscope; clipboard-write; payment; geolocation"
               referrerPolicy="no-referrer"
               title="Archive Playback"
             />
             
             {/* Player Overlay Guard (Visible on Hover) */}
             <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-full border border-white/10">
                   <Activity className="w-3 h-3 text-blue-500" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Stream Source: {activeSource.name}</span>
                </div>
             </div>
          </motion.div>

          {/* Meta Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pt-12">
             <div className="lg:col-span-8 space-y-12">
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-[2px] bg-white/10" />
                      <h2 className="text-[12px] font-black uppercase tracking-[0.5em] text-gray-700">Description</h2>
                   </div>
                   <p className="text-xl text-gray-400 font-medium leading-relaxed">
                     {media.overview}
                   </p>
                </div>

                {media.genres && (
                  <div className="flex flex-wrap gap-4">
                    {media.genres.map((g: any) => (
                      <span key={g.id} className="px-5 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
             </div>

             <div className="lg:col-span-4 space-y-8">
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-8 backdrop-blur-xl">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-500">Movie Details</h3>
                   <div className="space-y-6">
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                         <span className="text-gray-600 italic">Release Date</span>
                         <span className="text-white">{date}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                         <span className="text-gray-600 italic">Rating</span>
                         <span className="text-blue-500">{(media?.vote_average || 0).toFixed(1)} / 10</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                         <span className="text-gray-600 italic">Type</span>
                         <span className="text-white">{type === 'movie' ? 'Cinematic' : 'Series'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest">
                         <span className="text-gray-600 italic">Custom</span>
                         <span className={media.isCustom ? 'text-green-500' : 'text-gray-800'}>{media.isCustom ? 'YES' : 'NO'}</span>
                      </div>
                   </div>
                   
                   <div className="pt-8 border-t border-white/5">
                      <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-[9px] font-black text-blue-500/80 uppercase tracking-widest">Safe Stream Connected</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </section>
      )}
    </main>
  );
}
