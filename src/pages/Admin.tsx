import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plus, Tag, FileCode, Type, Image as ImageIcon, CheckCircle2, AlertCircle, Trash2, Globe } from 'lucide-react';
import { addGame, deleteGame } from '../services/gameService';
import { motion, AnimatePresence } from 'motion/react';
import { useGames } from '../context/GameContext';

export default function Admin() {
  const { games, refreshGames } = useGames();
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Action',
    thumbnail: '',
    htmlBlock: '',
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '$#GS29gs67') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const gameId = formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const success = await addGame(password, {
      ...formData,
      id: gameId,
    });

    if (success) {
      setStatus({ type: 'success', message: 'Game added successfully!' });
      setFormData({
        title: '',
        description: '',
        category: 'Action',
        thumbnail: '',
        htmlBlock: '',
      });
      await refreshGames();
    } else {
      setStatus({ type: 'error', message: 'Failed to add game. Check console.' });
    }
    setLoading(false);
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    const success = await deleteGame(password, gameId);
    if (success) {
      setStatus({ type: 'success', message: 'Game deleted successfully!' });
      await refreshGames();
    } else {
      setStatus({ type: 'error', message: 'Failed to delete game.' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-32 px-4 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 glass rounded-3xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 rounded-2xl bg-primary/20 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold">Admin Portal</h1>
            <p className="text-gray-400 text-sm">Enter password to access YEEBSGAMES settings</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-2 px-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full py-4 rounded-xl bg-primary text-dark-surface font-display font-black hover:bg-white transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]">
              ACCESS DASHBOARD
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-4 md:px-8 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-black tracking-tight">ADD NEW <span className="text-primary">GAME</span></h1>
            <p className="text-gray-400">Expand the YEEBSGAMES catalog</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <Plus className="w-6 h-6" />
          </div>
        </div>

        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
                status.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{status.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6 glass p-8 rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 px-1">
                <Type className="w-3 h-3" /> Game Name
              </label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all"
                placeholder="e.g. Pixel Racer"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 px-1">
                <Tag className="w-3 h-3" /> Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all appearance-none"
              >
                {['Action', 'Sports', 'Puzzle', 'IO', 'Racing', 'Horror', 'Skill', 'Idle'].map(c => (
                  <option key={c} value={c} className="bg-dark-card">{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 px-1">
              <ImageIcon className="w-3 h-3" /> Thumbnail URL
            </label>
            <input
              required
              type="url"
              value={formData.thumbnail}
              onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 px-1">
              <AlertCircle className="w-3 h-3" /> Description
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all resize-none"
              placeholder="Short catchy description of the game..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 px-1">
              <FileCode className="w-3 h-3" /> HTML Code Block
            </label>
            <textarea
              required
              rows={8}
              value={formData.htmlBlock}
              onChange={(e) => setFormData({ ...formData, htmlBlock: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all font-mono text-sm resize-none"
              placeholder="Paste the game's <!DOCTYPE html> ... here"
            />
          </div>

          <button
            disabled={loading}
            className={`w-full py-4 rounded-xl bg-primary text-dark-surface font-display font-black transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)] flex items-center justify-center gap-2 
              ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white '}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark-surface border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                PUBLISH GAME
              </>
            )}
          </button>
        </form>

        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-display font-bold px-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Manage Games ({games.length})
          </h2>
          <div className="grid gap-4">
            {games.map(game => (
              <div key={game.id} className="glass p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 rounded-lg overflow-hidden bg-dark-card border border-white/5">
                    <img src={game.thumbnail} alt={game.title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-primary transition-colors">{game.title}</h3>
                    <p className="text-xs text-gray-400">{game.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    to={`/game/${game.id}`}
                    className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-dark-surface transition-all"
                    title="View Game"
                  >
                    <Globe className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(game.id)}
                    className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Delete Game"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
