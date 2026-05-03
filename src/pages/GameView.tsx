import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Maximize2, RotateCw, Flag, Share2, Star, Zap, Heart, Play } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGames } from '../context/GameContext';
import { db, doc, updateDoc, setDoc, increment } from '../lib/firebase';

export default function GameView() {
  const { id } = useParams();
  const { games, toggleFavorite, isFavorite, loading } = useGames();
  const game = games.find((g) => g.id === id);
  const favorite = game ? isFavorite(game.id) : false;

  useEffect(() => {
    if (game && id) {
      // Increment play count in Firestore
      const incrementPlay = async () => {
        try {
          const gameRef = doc(db, 'games', id);
          // Use setDoc with merge: true to create the document if it doesn't exist
          await setDoc(gameRef, {
            playCount: increment(1),
            title: game.title,
            category: game.category,
            thumbnail: game.thumbnail,
            url: game.url,
            id: game.id // Ensure ID matching
          }, { merge: true });
        } catch (error) {
          console.error("Error incrementing play count", error);
        }
      };
      incrementPlay();
    }
  }, [id, !!game]);

  if (loading) {
    return (
      <div className="pt-32 flex justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="pt-32 text-center">
        <h1 className="text-4xl font-display font-black">Game not found</h1>
        <Link to="/" className="text-primary underline mt-4 inline-block">Go Home</Link>
      </div>
    );
  }

  const toggleFullScreen = () => {
    const elem = document.getElementById('game-frame');
    if (!elem) return;
    
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  const handleLike = async () => {
    await toggleFavorite(game.id);
    // Extra: Slightly boost rating on like
    if (!favorite) {
      try {
        const gameRef = doc(db, 'games', game.id);
        await setDoc(gameRef, {
          rating: increment(0.1),
          title: game.title,
          id: game.id
        }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const shareGame = () => {
    if (navigator.share) {
      navigator.share({
        title: `Playing ${game.title} on YEEBSGAMES`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <main className="pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to Games
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Player Area */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video relative group" id="game-container">
              {game.htmlBlock ? (
                <iframe
                  id="game-frame"
                  srcDoc={game.htmlBlock}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title={game.title}
                />
              ) : (
                <iframe
                  id="game-frame"
                  src={game.url}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title={game.title}
                />
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 glass rounded-2xl">
              <div className="flex items-center gap-4">
                <button onClick={() => window.location.reload()} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors" title="Reload Game">
                  <RotateCw className="w-5 h-5" />
                </button>
                <button onClick={toggleFullScreen} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors" title="Fullscreen">
                  <Maximize2 className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Play className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{(game.playCount || 0).toLocaleString()} Plays</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={handleLike}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    favorite 
                      ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
                  <span className="text-sm font-bold uppercase tracking-wider">{favorite ? 'Liked' : 'Like'}</span>
                </button>
                <button 
                  onClick={shareGame}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">Share</span>
                </button>
                <button 
                  onClick={() => alert('Issue reported! Our moths are investigating.')}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors" 
                  title="Report Issue"
                >
                  <Flag className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h1 className="text-3xl font-display font-black mb-4 uppercase tracking-tight">
                {game.title} <span className="text-primary italic">.exe</span>
              </h1>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed font-medium">
                  {game.description}
                </p>
                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 fill-current" />
                    How to Play
                  </p>
                  <p className="text-gray-400 mt-2 text-sm leading-relaxed">
                    Use your keyboard and mouse to navigate and play. Master the mechanics and get that high score!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-bold uppercase tracking-wider transition-all"
              >
                <RotateCw className="w-3 h-3" />
                Reload Game
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass p-6 rounded-2xl">
              <h3 className="font-display font-bold text-lg mb-4">Recommended</h3>
              <div className="space-y-4">
                {games.filter(g => g.id !== id).slice(0, 4).map(suggested => (
                  <Link 
                    key={suggested.id} 
                    to={`/game/${suggested.id}`}
                    className="flex gap-3 group"
                  >
                    <div className="w-20 aspect-square rounded-lg overflow-hidden flex-shrink-0 bg-dark-card border border-white/5">
                      <img src={suggested.thumbnail} alt={suggested.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{suggested.title}</h4>
                      <span className="text-[10px] text-primary font-bold uppercase tracking-wider">{suggested.category}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="glass p-6 rounded-2xl">
              <h3 className="font-display font-bold text-lg mb-4">How to Play</h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li>• Arrow Keys/WASD for movement</li>
                <li>• Space for primary action</li>
                <li>• Esc to pause/exit</li>
                <li>• P for settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
