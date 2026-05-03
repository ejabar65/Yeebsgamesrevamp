import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService, Movie } from '../services/movieService';
import { ChevronLeft, Star, Clock, Calendar, Info, Play, MessageSquare, Share2, Layers, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const SOURCES = [
  { id: 'vidking', name: 'VidKing (Pro)', url: (id: string) => `https://vidking.net/embed/movie/${id}` },
  { id: 'vidsrc', name: 'VidSrc', url: (id: string) => `https://vidsrc.to/embed/movie/${id}` },
  { id: 'vidsrc_me', name: 'VidSrc.me', url: (id: string) => `https://vidsrc.me/embed/movie/${id}` },
];

export default function MovieView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSource, setActiveSource] = useState(SOURCES[0]);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    const loadMovie = async () => {
      if (!id) return;
      setLoading(true);
      const data = await movieService.getMovieDetails(id);
      setMovie(data);
      setLoading(false);
    };
    loadMovie();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="pt-32 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="pt-32 px-4 text-center">
        <h1 className="text-2xl font-display font-black text-white mb-4">TRANSMISSION LOST</h1>
        <p className="text-gray-400 mb-8">The requested movie ID could not be found in the database.</p>
        <button 
          onClick={() => navigate('/movies')}
          className="px-6 py-2 bg-primary text-dark-surface font-black rounded-lg uppercase tracking-wider"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  return (
    <main className="pt-16 pb-12">
      {/* Backdrop Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={movieService.getPosterUrl(movie.backdrop_path || movie.poster_path, 'original')} 
            alt={movie.title}
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
                src={movieService.getPosterUrl(movie.poster_path)} 
                alt={movie.title}
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
              
              <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl md:text-6xl lg:text-7xl font-display font-black uppercase tracking-tighter mb-4 leading-tight"
              >
                {movie.title}
              </motion.h1>

              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                  <Star className="w-4 h-4 text-primary fill-current" />
                  <span className="font-display font-black text-primary">{movie.vote_average.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 font-mono text-xs uppercase tracking-widest">
                  <Calendar className="w-4 h-4" />
                  {movie.release_date}
                </div>
                {movie.genre_ids && (
                  <div className="flex gap-2">
                    {/* Placeholder for genres as I don't have the genre mapping here */}
                    <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400">Movie</span>
                  </div>
                )}
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
        {showPlayer ? (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Player Container */}
            <div className="flex flex-col gap-4">
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

              <div className="aspect-video w-full rounded-[40px] overflow-hidden bg-black border-4 border-white/5 shadow-2xl relative group">
                <iframe 
                  src={activeSource.url(id!)} 
                  className="w-full h-full"
                  allowFullScreen
                  title="Movie Player"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="glass p-8 rounded-[40px] border border-white/5">
                  <h2 className="text-2xl font-display font-black uppercase mb-4 tracking-tight">Intelligence <span className="text-primary italic">Report</span></h2>
                  <p className="text-gray-400 leading-relaxed font-medium">
                    {movie.overview}
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
                    <DetailItem label="Release" value={movie.release_date} />
                    <DetailItem label="Signal Strength" value={`${(movie.vote_average * 10).toFixed(0)}%`} />
                    <DetailItem label="Type" value="Full Motion Picture" />
                  </div>
                </div>

                <div className="glass p-6 rounded-[32px] border border-white/5 flex flex-col gap-4">
                   <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-dark-surface transition-all flex items-center justify-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Open Comm Channel
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
          <div className="max-w-3xl space-y-8 mt-12">
            <div>
              <h2 className="text-3xl font-display font-black uppercase mb-6 tracking-tight">Plot <span className="text-primary italic">Overview</span></h2>
              <p className="text-xl text-gray-300 leading-relaxed font-medium">
                {movie.overview}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-white/5">
              <DetailBox label="Rating" value={movie.vote_average.toFixed(1)} icon={Star} />
              <DetailBox label="Year" value={movie.release_date?.split('-')[0]} icon={Calendar} />
              <DetailBox label="Status" value="Ready" icon={Zap} />
              <DetailBox label="Security" value="Encrypted" icon={Info} />
            </div>
          </div>
        )}
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
