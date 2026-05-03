import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plus, Tag, FileCode, Type, Image as ImageIcon, CheckCircle2, AlertCircle, Trash2, Globe, Edit2, X, Play, Users, Ban, UserCheck, Gamepad2 } from 'lucide-react';
import { addGame, deleteGame, updateGame } from '../services/gameService';
import { motion, AnimatePresence } from 'motion/react';
import { useGames } from '../context/GameContext';
import { db, collection, getDocs, doc, updateDoc } from '../lib/firebase';

export default function Admin() {
  const { games, refreshGames, user, authLoading, setSearchQuery, setSortBy } = useGames();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'games' | 'users'>('games');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'users' && user?.isAdmin) {
      fetchUsers();
    }
  }, [activeTab, user]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
    setUsersLoading(false);
  };

  const handleBanToggle = async (username: string, currentBanStatus: boolean) => {
    try {
      const userRef = doc(db, 'users', username);
      await updateDoc(userRef, { isBanned: !currentBanStatus });
      setUsers(prev => prev.map(u => u.username === username ? { ...u, isBanned: !currentBanStatus } : u));
      setStatus({ type: 'success', message: `User ${username} ${!currentBanStatus ? 'banned' : 'unbanned'} successfully.` });
    } catch (error) {
      console.error("Error toggling ban:", error);
      setStatus({ type: 'error', message: "Failed to update ban status." });
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Action',
    thumbnail: '',
    htmlBlock: '',
    url: ''
  });

  const handleEdit = (game: any) => {
    setEditingId(game.id);
    setFormData({
      title: game.title,
      description: game.description,
      category: game.category,
      thumbnail: game.thumbnail,
      htmlBlock: game.htmlBlock || '',
      url: game.url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      category: 'Action',
      thumbnail: '',
      htmlBlock: '',
      url: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.isAdmin) {
      alert('Access forbidden. Required clearance missing.');
      return;
    }

    setLoading(true);
    setStatus(null);

    const gameId = editingId || formData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    let success = false;
    if (editingId) {
      success = await updateGame({
        ...formData,
        id: editingId,
        playCount: games.find(g => g.id === editingId)?.playCount || 0,
        rating: games.find(g => g.id === editingId)?.rating || 5
      });
    } else {
      success = await addGame({
        ...formData,
        id: gameId,
        playCount: 0,
        rating: 5
      });
    }

    if (success) {
      setStatus({ type: 'success', message: `Game ${editingId ? 'updated' : 'added'} successfully!` });
      if (!editingId) {
        setFormData({
          title: '',
          description: '',
          category: 'Action',
          thumbnail: '',
          htmlBlock: '',
          url: ''
        });
      } else {
        setEditingId(null);
      }
      await refreshGames();
    } else {
      setStatus({ type: 'error', message: `Failed to ${editingId ? 'update' : 'add'} game. Check console.` });
    }
    setLoading(false);
  };

  const handleDelete = async (gameId: string) => {
    if (!confirm('Are you sure you want to delete this game?')) return;
    
    const success = await deleteGame(gameId);
    if (success) {
      setStatus({ type: 'success', message: 'Game deleted successfully!' });
      await refreshGames();
    } else {
      setStatus({ type: 'error', message: 'Failed to delete game.' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen pt-32 px-4 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 glass rounded-3xl text-center"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 rounded-2xl bg-red-500/10 mb-4 border border-red-500/20">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-display font-bold">Access Denied</h1>
            <p className="text-gray-400 text-sm mt-4 leading-relaxed">
              This portal is reserved for authorized supervisors. 
              {user ? (
                <span> You are currently logged in as <span className="text-white font-bold">{user.username}</span>.</span>
              ) : (
                <span> Please login through the system portal.</span>
              )}
            </p>
          </div>
          
          <Link 
            to="/" 
            className="inline-flex w-full py-4 rounded-xl bg-primary text-dark-surface font-display font-black hover:bg-white transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)] justify-center"
          >
            RETURN TO BASE
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 px-4 md:px-8 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-black tracking-tight uppercase">
              {editingId ? 'Edit' : 'Add New'} <span className="text-primary">Game</span>
            </h1>
            <p className="text-gray-400">{editingId ? `Modifying ${formData.title}` : 'Expand the YEEBSGAMES catalog'}</p>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-white">@{user.username}</span>
                <span className="text-[10px] uppercase font-black tracking-tighter text-primary">Master Controller</span>
              </div>
            )}
            <div className={`p-3 rounded-xl border transition-all ${editingId ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
              {editingId ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
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

        {!user?.isAdmin && (
          <div className="mb-6 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-bold text-red-500 uppercase text-xs tracking-widest">Unauthorized Access</p>
                <p className="text-[10px] text-red-500/70 uppercase font-bold">You are attempting to modify the library without admin privileges.</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-display font-bold uppercase tracking-wider transition-all border ${
              activeTab === 'games' 
                ? 'bg-primary text-dark-surface border-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]' 
                : 'glass text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Games
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-display font-bold uppercase tracking-wider transition-all border ${
              activeTab === 'users' 
                ? 'bg-primary text-dark-surface border-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]' 
                : 'glass text-gray-400 border-white/5 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>

        {activeTab === 'games' ? (
          <>
            <form onSubmit={handleSubmit} className="space-y-6 glass p-8 rounded-3xl border border-white/5">
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
                {['Action', 'Sports', 'Puzzle', 'IO', 'Racing', 'Horror', 'Skill', 'Idle', 'Adventure'].map(c => (
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
              <FileCode className="w-3 h-3" /> HTML Code Block (Optional if URL provided)
            </label>
            <textarea
              rows={6}
              value={formData.htmlBlock}
              onChange={(e) => setFormData({ ...formData, htmlBlock: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all font-mono text-sm resize-none"
              placeholder="Paste the game's <!DOCTYPE html> ... here"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 px-1">
              <Globe className="w-3 h-3" /> Redirect URL (Optional if HTML provided)
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-hidden focus:border-primary transition-all"
              placeholder="/games/local-game.html"
            />
          </div>

          <div className="flex gap-4">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-display font-black hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                CANCEL
              </button>
            )}
            <button
              disabled={loading}
              className={`flex-[2] py-4 rounded-xl bg-primary text-dark-surface font-display font-black transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)] flex items-center justify-center gap-2 
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white '}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-surface border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {editingId ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? 'UPDATE GAME' : 'PUBLISH GAME'}
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-display font-bold px-2 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Manage Games ({games.length})
          </h2>
          <div className="grid gap-4">
            {games.map(game => (
              <div key={game.id} className="glass p-4 rounded-2xl flex items-center justify-between group hover:border-primary/30 transition-all border border-white/5">
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
                  <button 
                    onClick={() => handleEdit(game)}
                    className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                    title="Edit Game"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <Link 
                    to={`/game/${game.id}`}
                    className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-dark-surface transition-all"
                    title="View Game"
                  >
                    <Play className="w-4 h-4" />
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
      </>
    ) : (
          <div className="space-y-6">
            <div className="glass p-8 rounded-3xl border border-white/5">
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                User Management
              </h2>
              
              {usersLoading ? (
                <div className="flex justify-center py-12">
                   <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map(u => (
                    <div key={u.id} className="glass p-4 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                          <img src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <h3 className="font-bold text-white">@{u.username}</h3>
                             {u.username.toLowerCase() === 'yeebs' && <span className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase italic">Admin</span>}
                             {u.isBanned && <span className="bg-red-500/20 text-red-500 text-[8px] font-black px-1.5 py-0.5 rounded uppercase italic">Banned</span>}
                          </div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{u.uid}</p>
                        </div>
                      </div>
                      
                      {u.username.toLowerCase() !== 'yeebs' && (
                        <button
                          onClick={() => handleBanToggle(u.username, u.isBanned)}
                          className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${
                            u.isBanned 
                              ? 'bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white' 
                              : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          {u.isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-center text-gray-500 py-12 italic">No users found in database.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
