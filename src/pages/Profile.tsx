import React from 'react';
import { useGames } from '../context/GameContext';
import { motion } from 'motion/react';
import { User, LogOut, Package, Heart, History, Trash2 } from 'lucide-react';
import { auth, signOut } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import GameCard from '../components/GameCard';

export default function Profile() {
  const { user, games, favorites, authLoading, toggleFavorite } = useGames();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 px-4 flex flex-col items-center justify-center text-center">
        <div className="p-6 rounded-full bg-primary/10 mb-6">
          <User className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-black uppercase mb-4">Access Denied</h1>
        <p className="text-gray-400 mb-8 max-w-sm">Please login to view your profile and saved inventory.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-xl bg-primary text-dark-surface font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const savedGames = games.filter(game => favorites.includes(game.id));

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <main className="pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="glass rounded-3xl p-8 mb-12 flex flex-col md:flex-row items-center gap-8 border border-white/5">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <img 
              src={user.photoURL || ''} 
              alt={user.displayName || ''} 
              className="w-32 h-32 rounded-full border-4 border-primary/20 relative z-10"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-display font-black uppercase mb-2">{user.displayName}</h1>
            <p className="text-gray-400 mb-6">{user.email}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-widest">{savedGames.length} Items</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold uppercase tracking-widest">{favorites.length} Favs</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Inventory Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-black uppercase flex items-center gap-3">
              <Package className="w-6 h-6 text-primary" />
              Your Inventory
            </h2>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">
              Saved for later
            </div>
          </div>

          {savedGames.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {savedGames.map(game => (
                <div key={game.id} className="relative group">
                  <GameCard game={game} />
                  <button 
                    onClick={() => toggleFavorite(game.id)}
                    className="absolute bottom-4 right-4 p-2 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    title="Remove from inventory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-3xl p-20 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/5">
              <div className="p-6 rounded-full bg-white/5 mb-6">
                <History className="w-12 h-12 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">Inventory Empty</h3>
              <p className="text-gray-500 text-sm mb-8 max-w-xs">Start building your collection by liking games across the platform.</p>
              <Link 
                to="/" 
                className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-primary hover:text-dark-surface transition-all font-bold uppercase tracking-widest"
              >
                Discover Games
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
