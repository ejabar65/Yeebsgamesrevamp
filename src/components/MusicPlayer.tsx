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
    title: 'Lofi Girl - Chill Beats',
    artist: 'Lofi Records',
    videoId: 'jfKfPfyJRdk',
    cover: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=300&fit=crop'
  },
  {
    id: '2',
    title: 'Synthwave Radio',
    artist: 'Nightride FM',
    videoId: '4xDzrJKXOOY',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop'
  },
  {
    id: '3',
    title: 'Cyberpunk Mix 2077',
    artist: 'Infraction',
    videoId: 'O9YhYInuY3w',
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&h=300&fit=crop'
  }
];

export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState<Track[]>(DEFAULT_PLAYLIST);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volume, setVolume] = useState(50);
  
  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const playerRef = useRef<any>(null);
  const progressInterval = useRef<any>(null);

  const currentTrack = playlist[currentTrackIndex];

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
    setPlaylist(prev => [...prev, track]);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      progressInterval.current = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (duration > 0) {
            setProgress((currentTime / duration) * 100);
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
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  const handlePrev = () => {
    setCurrentTrackIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
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
    if (isPlaying) {
      playerRef.current.playVideo();
    }
  };

  const onStateChange = (event: any) => {
    if (event.data === 1) setIsPlaying(true);
    if (event.data === 2) setIsPlaying(false);
    if (event.data === 0) handleNext();
  };

  const opts: YouTubeProps['opts'] = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
    },
  };

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <div className="hidden">
        {currentTrack && (
          <YouTube 
            videoId={currentTrack.videoId} 
            opts={opts} 
            onReady={onReady} 
            onStateChange={onStateChange} 
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
                      <button
                        key={track.id + index}
                        onClick={() => {
                          setCurrentTrackIndex(index);
                          setIsPlaying(true);
                          setShowPlaylist(false);
                        }}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${index === currentTrackIndex ? 'bg-blue-500/20' : 'hover:bg-white/5'}`}
                      >
                        <img src={track.cover} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        <div className="flex flex-col items-start min-w-0 flex-1">
                          <span className={`text-xs font-bold truncate w-full flex-1 ${index === currentTrackIndex ? 'text-blue-500' : 'text-white'}`}>{track.title}</span>
                          <span className="text-[9px] text-gray-500 uppercase font-black truncate w-full">{track.artist}</span>
                        </div>
                        {index === currentTrackIndex && isPlaying && (
                          <div className="flex items-end gap-[2px] h-3 shrink-0">
                            <motion.div animate={{ height: [2, 8, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-[2px] bg-blue-500 rounded-full" />
                            <motion.div animate={{ height: [8, 2, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-[2px] bg-blue-500 rounded-full" />
                            <motion.div animate={{ height: [4, 6, 2] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-[2px] bg-blue-500 rounded-full" />
                          </div>
                        )}
                      </button>
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
    </div>
  );
}
