import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, Music, ListMusic, 
  X, Minimize2, Search, Loader2, Plus, Shuffle, Repeat, Repeat1, 
  Trash2
} from 'lucide-react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { musicService, MusicTrack } from '../services/musicService';

type RepeatMode = 'none' | 'all' | 'one';

const DEFAULT_PLAYLIST: MusicTrack[] = [
  {
    id: 'hSfM9T4fN1E',
    title: 'Sweater Weather',
    artist: 'The Neighbourhood',
    videoId: 'hSfM9T4fN1E',
    cover: 'https://img.youtube.com/vi/hSfM9T4fN1E/hqdefault.jpg'
  },
  {
    id: 'jfKfPfyJRdk',
    title: 'Lofi Girl - Chill Beats',
    artist: 'Lofi Records',
    videoId: 'jfKfPfyJRdk',
    cover: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg'
  },
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio',
    artist: 'Nightride FM',
    videoId: '4xDzrJKXOOY',
    cover: 'https://img.youtube.com/vi/4xDzrJKXOOY/hqdefault.jpg'
  },
  {
    id: 'O9YhYInuY3w',
    title: 'Cyberpunk Mix 2077',
    artist: 'Infraction',
    videoId: 'O9YhYInuY3w',
    cover: 'https://img.youtube.com/vi/O9YhYInuY3w/hqdefault.jpg'
  }
];

export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState<MusicTrack[]>(() => {
    const saved = localStorage.getItem('yeebsgames_playlist');
    return saved ? JSON.parse(saved) : DEFAULT_PLAYLIST;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showQueue, setShowQueue] = useState(false);
  const [volume, setVolume] = useState(50);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [isShuffle, setIsShuffle] = useState(false);
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);

  const currentTrack = playlist[currentTrackIndex];

  // Save playlist to localStorage
  useEffect(() => {
    localStorage.setItem('yeebsgames_playlist', JSON.stringify(playlist));
  }, [playlist]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if it's a direct YouTube URL or ID
    const ytIdMatch = searchQuery.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = ytIdMatch ? ytIdMatch[1] : (searchQuery.length === 11 && !searchQuery.includes(' ') ? searchQuery : null);

    if (videoId) {
      const track: MusicTrack = {
        id: videoId,
        videoId: videoId,
        title: 'Imported Track',
        artist: 'YouTube',
        cover: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
      addToPlaylist(track);
      setSearchQuery('');
      setShowSearch(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await musicService.searchMusic(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToPlaylist = (track: MusicTrack) => {
    setPlaylist(prev => {
      if (prev.find(t => t.videoId === track.videoId)) return prev;
      return [...prev, track];
    });
    if (playlist.length === 0) setCurrentTrackIndex(0);
  };

  const removeFromPlaylist = (id: string) => {
    if (playlist.length <= 1) return;
    const newPlaylist = playlist.filter(t => t.id !== id);
    const removedIndex = playlist.findIndex(t => t.id === id);
    
    if (removedIndex === currentTrackIndex) {
      setCurrentTrackIndex(prev => Math.min(prev, newPlaylist.length - 1));
    } else if (removedIndex < currentTrackIndex) {
      setCurrentTrackIndex(prev => prev - 1);
    }
    
    setPlaylist(newPlaylist);
  };

  const clearPlaylist = () => {
    if (confirm("Clear all songs from queue?")) {
      setPlaylist(DEFAULT_PLAYLIST);
      setCurrentTrackIndex(0);
    }
  };

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const updateProgress = useCallback(() => {
    if (playerRef.current && isPlaying) {
      const time = playerRef.current.getCurrentTime();
      const dur = playerRef.current.getDuration();
      setCurrentTime(time);
      setDuration(dur);
      if (dur > 0) {
        setProgress((time / dur) * 100);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(updateProgress, 1000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, updateProgress]);

  const handleNext = useCallback(() => {
    if (isShuffle) {
      const nextIndex = Math.floor(Math.random() * playlist.length);
      setCurrentTrackIndex(nextIndex);
    } else {
      setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    }
    setIsPlaying(true);
  }, [playlist.length, isShuffle]);

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = (parseFloat(e.target.value) / 100) * duration;
    if (playerRef.current) {
      playerRef.current.seekTo(seekTo, true);
      setProgress(parseFloat(e.target.value));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume);
    if (isPlaying) playerRef.current.playVideo();
  };

  const onStateChange = (event: any) => {
    if (event.data === 1) setIsPlaying(true);
    if (event.data === 2) setIsPlaying(false);
    if (event.data === 0) {
      if (repeatMode === 'one') {
        playerRef.current.seekTo(0);
        playerRef.current.playVideo();
      } else if (repeatMode === 'all' || currentTrackIndex < playlist.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100',
    width: '100',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      enablejsapi: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined
    },
  };

  return (
    <div className="fixed bottom-20 right-6 z-50">
      {/* Background Player */}
      <div 
        className="fixed bottom-4 left-4 w-32 h-32 overflow-hidden pointer-events-none opacity-[0.01] bg-black rounded-full" 
        style={{ zIndex: -100 }}
      >
        {currentTrack && (
          <YouTube 
            videoId={currentTrack.videoId} 
            opts={opts} 
            onReady={onReady} 
            onStateChange={onStateChange}
            onError={(e) => console.error("YT Player Error:", e)}
          />
        )}
      </div>

      {/* Audio Interaction Overlay (Common for browser autoplay blocks) */}
      <AnimatePresence>
        {isPlaying && currentTime === 0 && duration > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
          >
            <div className="bg-black/90 p-8 rounded-[3rem] border border-white/10 text-center space-y-4 pointer-events-auto">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Audio Blocked by Browser</h3>
                <p className="text-sm text-gray-500">Tap anywhere to resume playback</p>
              </div>
              <button 
                onClick={() => {
                  if (playerRef.current) playerRef.current.playVideo();
                }}
                className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl"
              >
                Enable Sound
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 glass rounded-[2.5rem] border border-white/5 p-6 shadow-2xl relative overflow-hidden bg-black/90 backdrop-blur-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Music Core High-Res</span>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-blue-500 text-white' : 'hover:bg-white/5 text-gray-500'}`}
                >
                  <Search className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-gray-500"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 h-[380px] flex flex-col">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      placeholder="Search tracks or paste YouTube link..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 transition-all font-medium"
                    />
                    <button type="submit" disabled={isSearching} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isSearching ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Search className="w-4 h-4 text-gray-500" />}
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto scrollbar-none space-y-2 pr-1">
                    {searchResults.map((track) => (
                      <div key={track.id} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/5 group transition-all border border-transparent hover:border-white/5">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                          <img src={track.cover} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Plus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{track.title}</p>
                          <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-wider">{track.artist}</p>
                        </div>
                        <button onClick={() => addToPlaylist(track)} className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-black rounded-xl transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {!isSearching && searchResults.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full opacity-20 text-center">
                        <Music className="w-12 h-12 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest leading-relaxed">Search High Fidelity Audio<br/>AI-Powered Retrieval</p>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowSearch(false)} className="text-[10px] font-black uppercase text-gray-500 tracking-widest py-2 hover:text-white transition-all">Back to Player</button>
                </motion.div>
              ) : (
                <motion.div key="player" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative flex flex-col items-center mb-8">
                    <motion.div 
                      key={currentTrack?.id}
                      animate={isPlaying ? { rotate: 360 } : {}}
                      transition={isPlaying ? { repeat: Infinity, duration: 8, ease: "linear" } : {}}
                      className="relative w-48 h-48 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/5 overflow-hidden"
                    >
                      <img src={currentTrack?.cover} alt={currentTrack?.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/10 rounded-full border-[1.5rem] border-black/40 pointer-events-none" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#0a0a0a] border border-white/10" />
                      </div>
                    </motion.div>
                    <div className="text-center mt-6 space-y-1 w-full px-2">
                      <h3 className="text-xl font-black uppercase tracking-tighter text-white truncate drop-shadow-lg">{currentTrack?.title}</h3>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] italic">{currentTrack?.artist}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="relative group p-1">
                        <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all" />
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-gray-500 uppercase tracking-widest font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-2">
                      <button onClick={() => setIsShuffle(!isShuffle)} className={`p-2 transition-all ${isShuffle ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110' : 'text-gray-500 hover:text-white'}`}>
                        <Shuffle className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-4">
                        <button onClick={handlePrev} className="p-3 hover:bg-white/5 rounded-full transition-all text-white"><SkipBack className="w-6 h-6 fill-current" /></button>
                        <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
                          {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                        </button>
                        <button onClick={handleNext} className="p-3 hover:bg-white/5 rounded-full transition-all text-white"><SkipForward className="w-6 h-6 fill-current" /></button>
                      </div>
                      <button onClick={() => setRepeatMode(prev => prev === 'none' ? 'all' : prev === 'all' ? 'one' : 'none')} className={`p-2 transition-all ${repeatMode !== 'none' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] scale-110' : 'text-gray-500 hover:text-white'}`}>
                        {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 px-2">
                      <Volume2 className="w-4 h-4 text-gray-600" />
                      <input type="range" min="0" max="100" step="1" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="flex-1 h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-white" />
                    </div>
                  </div>

                  <button onClick={() => setShowQueue(!showQueue)} className="mt-8 w-full py-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all flex items-center justify-center gap-3 group">
                    <ListMusic className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">View Audio Queue</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showQueue && (
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="absolute inset-0 bg-[#0a0a0a] z-50 flex flex-col p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Audio Stream</span>
                      <span className="text-sm font-bold text-white italic uppercase">Queue Management</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={clearPlaylist} className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                      <button onClick={() => setShowQueue(false)} className="p-2 hover:bg-white/5 text-gray-500 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                    {playlist.map((track, idx) => (
                      <div key={track.id + idx} className="flex items-center gap-3 p-2.5 rounded-2xl group transition-all relative overflow-hidden">
                        {idx === currentTrackIndex && <div className="absolute inset-0 bg-blue-500/10 -z-10" />}
                        <button onClick={() => { setCurrentTrackIndex(idx); setIsPlaying(true); setShowQueue(false); }} className="flex-1 flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                            <img src={track.cover} className="w-full h-full object-cover" alt="" />
                            {idx === currentTrackIndex && isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="flex items-end gap-[2px] h-3">
                                  <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-[2px] bg-blue-500 rounded-full" />
                                  <motion.div animate={{ height: [10, 4, 10] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-[2px] bg-blue-500 rounded-full" />
                                  <motion.div animate={{ height: [6, 12, 6] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-[2px] bg-blue-500 rounded-full" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-xs font-bold truncate ${idx === currentTrackIndex ? 'text-blue-500' : 'text-white'}`}>{track.title}</p>
                            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest truncate">{track.artist}</p>
                          </div>
                        </button>
                        <button onClick={() => removeFromPlaylist(track.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -z-10 rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 blur-3xl -z-10 rounded-full transition-colors" />
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsMinimized(false)}
            className="w-16 h-16 rounded-[1.5rem] glass border border-white/10 flex items-center justify-center shadow-2xl relative group overflow-hidden"
          >
            {isPlaying && (
              <motion.div 
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute inset-[10%] rounded-full border-2 border-blue-500/20 border-dashed"
              />
            )}
            <Music className={`w-6 h-6 transition-all ${isPlaying ? 'text-blue-500 scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-gray-500'}`} />
            <div className="absolute right-full mr-4 bg-black/95 px-4 py-2 rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap shadow-2xl translate-x-2 group-hover:translate-x-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                  <img src={currentTrack?.cover} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{isPlaying ? 'Streaming Active' : 'System Idle'}</span>
                  <p className="text-xs font-bold text-white max-w-[150px] truncate">{currentTrack?.title}</p>
                </div>
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
