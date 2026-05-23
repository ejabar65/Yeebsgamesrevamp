import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Music, ListMusic, X, Minimize2, Search, Loader2, Plus } from 'lucide-react';
import YouTube, { YouTubeProps } from 'react-youtube';

interface Track {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  cover: string;
}

const DEFAULT_PLAYLIST: Track[] = [
  {
    id: '1',
    title: 'Half Full Glass of Wine',
    artist: 'Tame Impala',
    videoId: 'zfcHq0hs5zU',
    cover: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&h=300&fit=crop'
  }
];

export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState<Track[]>(() => {
    const saved = localStorage.getItem('yeebs_player_playlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved playlist', e);
      }
    }
    return DEFAULT_PLAYLIST;
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() => {
    const saved = localStorage.getItem('yeebs_player_current_track_index');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return 0;
  });

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    const saved = localStorage.getItem('yeebs_player_is_playing');
    if (saved !== null) {
      return saved === 'true';
    }
    return true; // Play automatically on first load!
  });

  const [progress, setProgress] = useState(0);

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    const saved = localStorage.getItem('yeebs_player_is_minimized');
    if (saved !== null) {
      return saved === 'true';
    }
    return true;
  });

  const [showPlaylist, setShowPlaylist] = useState(false);

  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('yeebs_player_volume');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return 50;
  });

  const [isHovered, setIsHovered] = useState(false);
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Sync state helpers to localStorage
  useEffect(() => {
    localStorage.setItem('yeebs_player_playlist', JSON.stringify(playlist));
    if (currentTrackIndex >= playlist.length) {
      setCurrentTrackIndex(0);
    }
  }, [playlist]);

  useEffect(() => {
    localStorage.setItem('yeebs_player_current_track_index', currentTrackIndex.toString());
  }, [currentTrackIndex]);

  useEffect(() => {
    localStorage.setItem('yeebs_player_is_playing', isPlaying.toString());
  }, [isPlaying]);

  useEffect(() => {
    localStorage.setItem('yeebs_player_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('yeebs_player_is_minimized', isMinimized.toString());
  }, [isMinimized]);

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);

  const currentTrack = playlist[currentTrackIndex] || playlist[0] || DEFAULT_PLAYLIST[0];

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const apiKey = "AIzaSyBUOinM4-wQ1dI2axGQgwfh5iFGAV5OIso";

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(searchQuery)}&type=video&videoEmbeddable=true&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const results: Track[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        videoId: item.id.videoId,
        cover: item.snippet.thumbnails.high.url
      }));

      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addToPlaylist = (track: Track) => {
    setPlaylist(prev => [...prev, { ...track, id: `${track.id}-${Date.now()}` }]); // Ensure unique IDs for duplicate additions
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeFromPlaylist = (index: number) => {
    if (playlist.length <= 1) return; // Keep at least one track
    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 1);
    
    // If we removed the current track, adjust index
    if (index === currentTrackIndex) {
      setCurrentTrackIndex(prev => Math.min(prev, newPlaylist.length - 1));
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex(prev => prev - 1);
    }
    
    setPlaylist(newPlaylist);
  };

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const currentTime = playerRef.current.getCurrentTime();
            const duration = playerRef.current.getDuration();
            if (duration > 0) {
              setProgress((currentTime / duration) * 100);
              localStorage.setItem('yeebs_player_current_time', currentTime.toString());
            }
          } catch (e) {
            console.error("Failed to fetch current track time", e);
          }
        }
      }, 1000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (playerRef.current) {
      try {
        if (isPlaying) {
          playerRef.current.pauseVideo();
        } else {
          playerRef.current.playVideo();
        }
        setIsPlaying(!isPlaying);
      } catch (err) {
        console.error("Player toggle failed:", err);
        setIsPlaying(!isPlaying);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = useCallback(() => {
    localStorage.removeItem('yeebs_player_current_time');
    setProgress(0);
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
    setIsPlaying(true);
  }, [playlist.length]);

  const handlePrev = () => {
    localStorage.removeItem('yeebs_player_current_time');
    setProgress(0);
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = (parseFloat(e.target.value) / 100) * (playerRef.current?.getDuration() || 0);
    if (playerRef.current) {
      playerRef.current.seekTo(seekTo, true);
    }
  };

  const onReady = (event: any) => {
    playerRef.current = event.target;
    playerRef.current.setVolume(volume);

    // Exact elapsed time recovery from localStorage
    const savedTimeRaw = localStorage.getItem('yeebs_player_current_time');
    if (savedTimeRaw) {
      const savedTime = parseFloat(savedTimeRaw);
      if (!isNaN(savedTime) && savedTime > 0) {
        playerRef.current.seekTo(savedTime, true);
      }
    }

    if (isPlaying) {
      playerRef.current.playVideo();
    }
  };

  const onStateChange = (event: any) => {
    if (event.data === 1) setIsPlaying(true);
    if (event.data === 2) setIsPlaying(false);
  };

  const opts: YouTubeProps['opts'] = {
    height: '100',
    width: '100',
    playerVars: {
      autoplay: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      iv_load_policy: 3,
      enablejsapi: 1,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0.1, scale: 0.8 }}
      animate={{ 
        opacity: (!isMinimized || isHovered) ? 1 : 0.05,
        scale: (!isMinimized || isHovered) ? 1 : 0.8,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-36 z-[102]"
    >
      {/* Invisible YouTube Player */}
      <div 
        className="fixed bottom-4 left-4 w-10 h-10 overflow-hidden pointer-events-none opacity-[0.01] bg-black rounded-full" 
        style={{ zIndex: -100 }}
        aria-hidden="true"
      >
        {currentTrack && (
          <YouTube 
            videoId={currentTrack.videoId} 
            opts={opts} 
            onReady={onReady} 
            onStateChange={onStateChange}
            onEnd={handleNext}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </div>

      <AnimatePresence>
        {!isMinimized ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 glass rounded-3xl border border-white/10 p-6 shadow-2xl relative overflow-hidden bg-black/80 backdrop-blur-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Media System v2.0</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowSearch(!showSearch)}
                  className={`p-1.5 rounded-lg transition-colors ${showSearch ? 'bg-blue-500 text-white' : 'hover:bg-white/10 text-gray-500'}`}
                >
                  <Search className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-500"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="text"
                      placeholder="Search songs or artists..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                    />
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" /> : <Search className="w-4 h-4 text-gray-500" />}
                    </button>
                  </form>

                  <div className="max-h-[300px] overflow-y-auto scrollbar-none space-y-2">
                    {searchResults.map((track) => (
                      <div key={track.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 group border border-transparent hover:border-white/5 transition-all">
                        <img src={track.cover} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{track.title}</p>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest truncate">{track.artist}</p>
                        </div>
                        <button 
                          onClick={() => addToPlaylist(track)}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-black rounded-lg transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {searchResults.length === 0 && !isSearching && (
                      <div className="py-10 text-center opacity-40">
                        <Music className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Search for anything</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="player"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex flex-col items-center mb-6">
                    <motion.div 
                      key={currentTrack?.id}
                      initial={{ opacity: 0, rotate: -10 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl mb-4 border border-white/5"
                    >
                      <img src={currentTrack?.cover} alt={currentTrack?.title} className="w-full h-full object-cover" />
                    </motion.div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white truncate w-full text-center">{currentTrack?.title}</h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1 italic">{currentTrack?.artist}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative group">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      />
                    </div>

                    <div className="flex justify-between items-center px-4">
                      <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <SkipBack className="w-5 h-5 fill-current" />
                      </button>
                      <button 
                        onClick={togglePlay}
                        className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                      >
                        {isPlaying ? <Pause className="w-6 h-6 text-black fill-black" /> : <Play className="w-6 h-6 text-black fill-black ml-1" />}
                      </button>
                      <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                        <SkipForward className="w-5 h-5 fill-current" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 px-2">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={volume}
                        onChange={(e) => setVolume(parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowPlaylist(!showPlaylist)}
                    className="mt-6 w-full py-3 rounded-xl border border-white/5 hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-gray-400"
                  >
                    <ListMusic className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Queue List ({playlist.length})</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showPlaylist && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-x-6 top-24 bottom-24 bg-black rounded-2xl border border-white/10 overflow-hidden flex flex-col z-10"
                >
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Playlist</span>
                    <button onClick={() => setShowPlaylist(false)}><X className="w-4 h-4 text-gray-500" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
                    {playlist.map((track, index) => (
                      <div key={track.id + index} className="group/item relative">
                        <button
                          onClick={() => {
                            localStorage.removeItem('yeebs_player_current_time');
                            setProgress(0);
                            setCurrentTrackIndex(index);
                            setIsPlaying(true);
                            setShowPlaylist(false);
                          }}
                          className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${index === currentTrackIndex ? 'bg-blue-500/20' : 'hover:bg-white/5'}`}
                        >
                          <img src={track.cover} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          <div className="flex flex-col items-start min-w-0 flex-1">
                            <span className={`text-xs font-bold truncate w-full flex-1 ${index === currentTrackIndex ? 'text-blue-500' : 'text-white'}`}>{track.title}</span>
                            <span className="text-[9px] text-gray-500 uppercase font-black truncate w-full text-left">{track.artist}</span>
                          </div>
                          {index === currentTrackIndex && isPlaying && (
                            <div className="flex items-end gap-[2px] h-3 shrink-0">
                              <motion.div animate={{ height: [2, 8, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-[2px] bg-blue-500 rounded-full" />
                              <motion.div animate={{ height: [8, 2, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-[2px] bg-blue-500 rounded-full" />
                              <motion.div animate={{ height: [4, 6, 2] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-[2px] bg-blue-500 rounded-full" />
                            </div>
                          )}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPlaylist(index);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover/item:opacity-100 hover:bg-red-500/20 hover:text-red-500 text-gray-500 rounded-lg transition-all"
                          title="Remove from playlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMinimized(false)}
            className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-2xl relative group"
          >
            {isPlaying && (
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-blue-500 -z-10"
              />
            )}
            <div className="flex items-end gap-[2px] h-4">
              <motion.div animate={{ height: isPlaying ? [4, 12, 6, 16, 4] : 4 }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[3px] bg-black rounded-full" />
              <motion.div animate={{ height: isPlaying ? [16, 4, 12, 6, 16] : 8 }} transition={{ repeat: Infinity, duration: 1.0 }} className="w-[3px] bg-black rounded-full" />
              <motion.div animate={{ height: isPlaying ? [6, 16, 4, 12, 6] : 4 }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-[3px] bg-black rounded-full" />
              <motion.div animate={{ height: isPlaying ? [12, 6, 16, 4, 12] : 10 }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-[3px] bg-black rounded-full" />
            </div>
            
            {/* Tooltip on hover minimized */}
            <div className="absolute right-full mr-4 bg-black/90 px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-500">{isPlaying ? 'Now Playing' : 'Music Player'}</p>
              <p className="text-xs font-bold text-white max-w-[120px] truncate">{currentTrack?.title || 'No track'}</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
