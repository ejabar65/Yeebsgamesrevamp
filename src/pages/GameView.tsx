import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useGames } from '../context/GameContext';
import { db, doc, setDoc, increment } from '../lib/firebase';
import { ArrowLeft, RotateCw, Maximize2, Heart, Share2, Flag, Play, Info } from 'lucide-react';

export default function GameView() {
  const { id } = useParams();
  const { games, toggleFavorite, isFavorite, loading, addToHistory } = useGames();
  const game = games.find((g) => g.id === id);
  const favorite = game ? isFavorite(game.id) : false;

  useEffect(() => {
    if (game && id) {
      const incrementPlay = async () => {
        try {
          const gameRef = doc(db, 'games', id);
          await setDoc(gameRef, {
            playCount: increment(1),
            title: game.title,
            category: game.category,
            thumbnail: game.thumbnail,
            url: game.url,
            id: game.id
          }, { merge: true });
          await addToHistory(id);
        } catch (error) {
          console.error("Error updating statistics", error);
        }
      };
      incrementPlay();
    }
  }, [id, !!game]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-black uppercase tracking-widest text-gray-700">Not Found</h1>
        <Link to="/" className="text-xs font-black text-primary uppercase tracking-widest mt-8 inline-block hover:underline">Go Home</Link>
      </div>
    );
  }

  const toggleFullScreen = () => {
    const elem = document.getElementById('game-frame');
    if (!elem) return;
    if (elem.requestFullscreen) elem.requestFullscreen();
  };

  const handleLike = async () => {
    await toggleFavorite(game.id);
  };

  const shareGame = () => {
    if (navigator.share) {
      navigator.share({ title: game.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied.');
    }
  };

  return (
    <main className="p-4 sm:p-6 md:p-12 max-w-[1600px] mx-auto min-h-screen">
      <Link to="/" className="inline-flex items-center gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all mb-8 md:mb-12 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 md:gap-12">
        <div className="lg:col-span-3 space-y-8 md:space-y-12">
          <div className="rounded-2xl sm:rounded-[32px] md:rounded-[40px] overflow-hidden bg-black border border-white/5 aspect-video relative shadow-2xl group" id="game-container">
            <iframe
              id="game-frame"
              srcDoc={game.htmlBlock}
              src={!game.htmlBlock ? (game.url || undefined) : undefined}
              className="w-full h-full border-0"
              allowFullScreen
              title={game.title}
            />
          </div>

          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-[40px] bg-[#111] border border-white/5 flex flex-wrap items-center justify-between gap-6 md:gap-8 shadow-xl">
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => window.location.reload()} 
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                title="Reload"
              >
                <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Reload</span>
              </button>
              <button 
                onClick={toggleFullScreen} 
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
                title="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Full</span>
              </button>
            </div>
 
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${favorite ? 'bg-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${favorite ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">{favorite ? 'Liked' : 'Like'}</span>
              </button>
              <button 
                onClick={shareGame}
                className="flex items-center gap-2 px-4 sm:px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
              >
                <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button 
                onClick={() => alert('Reported.')}
                className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all" 
              >
                <Flag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-primary text-[8px] font-black uppercase tracking-widest">
                {game.category}
              </span>
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-500 text-[8px] font-black uppercase tracking-widest">
                v2.1 Stable
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter leading-[1.1] md:leading-none italic break-words">
              {game.title}
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl font-medium leading-relaxed">
              {game.description}
            </p>

            <div className="mt-8 p-8 rounded-[40px] bg-white/[0.01] border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-4 h-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-white">How to Play</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
                Use standard controls. Most games respond to WASD, Arrow Keys, and Mouse input.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="p-10 rounded-[40px] border border-white/5 bg-[#111] shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-10 flex items-center gap-2">
              <Play className="w-3 h-3" />
              Recommended
            </h3>
            <div className="space-y-8">
              {games.filter(g => g.id !== id).slice(0, 5).map(suggested => (
                <Link 
                  key={suggested.id} 
                  to={`/game/${suggested.id}`}
                  className="flex gap-4 group"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/5 border border-white/5 shrink-0 shadow-lg group-hover:shadow-primary/20 transition-all">
                    <img src={suggested.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-all" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h4 className="font-black text-xs uppercase tracking-widest truncate group-hover:text-primary transition-colors">{suggested.title}</h4>
                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest mt-1 block">{suggested.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
