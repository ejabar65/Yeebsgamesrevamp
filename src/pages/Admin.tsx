import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Plus, Tag, FileCode, Type, Image as ImageIcon, CheckCircle2, AlertCircle, Trash2, Globe, Edit2, X, Play, Users, Ban, UserCheck, Gamepad2 } from 'lucide-react';
import { addGame, deleteGame, updateGame } from '../services/gameService';
import { motion, AnimatePresence } from 'motion/react';
import { useGames } from '../context/GameContext';
import { db, collection, getDocs, doc, updateDoc, deleteDoc, query, limit, setDoc } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

export default function Admin() {
  const { games, refreshGames, user, authLoading, setSearchQuery, setSortBy } = useGames();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'games' | 'users' | 'cinema'>('games');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [movies, setMovies] = useState<any[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [movieFormData, setMovieFormData] = useState({
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    type: 'movie' as 'movie' | 'tv' | 'outside'
  });

  useEffect(() => {
    if (activeTab === 'users' && user?.isAdmin) {
      fetchUsers();
    }
    if (activeTab === 'cinema' && user?.isAdmin) {
      fetchMovies();
    }
  }, [activeTab, user]);

  const fetchMovies = async () => {
    setMoviesLoading(true);
    try {
      const q = query(collection(db, 'custom_movies'), limit(50));
      const querySnapshot = await getDocs(q);
      const moviesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMovies(moviesList);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'custom_movies');
    }
    setMoviesLoading(false);
  };

  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.isAdmin) return;
    setLoading(true);
    setStatus(null);

    try {
      const movieId = movieFormData.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const movieRef = doc(db, 'custom_movies', movieId);
      
      await setDoc(movieRef, {
        ...movieFormData,
        id: movieId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setStatus({ type: 'success', message: 'Nexus entry established.' });
      setMovieFormData({ title: '', description: '', url: '', thumbnail: '', type: 'movie' });
      fetchMovies();
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'custom_movies');
       setStatus({ type: 'error', message: 'Link protocol failed.' });
    }
    setLoading(false);
  };

  const handleDeleteMovie = async (id: string) => {
    if (!confirm('Permanent deletion requested. Continue?')) return;
    try {
      await deleteDoc(doc(db, 'custom_movies', id));
      setMovies(prev => prev.filter(m => m.id !== id));
      setStatus({ type: 'success', message: 'Movie removed.' });
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `custom_movies/${id}`);
       setStatus({ type: 'error', message: 'Deletion failed.' });
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // Limit fetching to 50 users to save quota
      const q = query(collection(db, 'users'), limit(50));
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setStatus({ type: 'error', message: "Failed to fetch users. Check permissions." });
    }
    setUsersLoading(false);
  };

  const handleBanToggle = async (targetUserId: string, currentBanStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} @${targetUserId}?`)) return;
    
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, { isBanned: !currentBanStatus });
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isBanned: !currentBanStatus } : u));
      setStatus({ type: 'success', message: `User ${targetUserId} ${!currentBanStatus ? 'banned' : 'unbanned'} successfully.` });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
      setStatus({ type: 'error', message: "Failed to update ban status." });
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (!confirm(`FATAL: Are you sure you want to PERMANENTLY DELETE @${targetUserId}? This cannot be undone.`)) return;

    try {
      const userRef = doc(db, 'users', targetUserId);
      await deleteDoc(userRef);
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
      setStatus({ type: 'success', message: `User @${targetUserId} deleted permanently.` });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${targetUserId}`);
      setStatus({ type: 'error', message: "Failed to delete user." });
    }
  };

  const handleToggleAdmin = async (targetUserId: string, currentIsAdmin: boolean) => {
    if (!confirm(`Are you sure you want to ${currentIsAdmin ? 'revoke' : 'grant'} admin privileges for @${targetUserId}?`)) return;
    try {
      const userRef = doc(db, 'users', targetUserId);
      await updateDoc(userRef, { isAdmin: !currentIsAdmin });
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isAdmin: !currentIsAdmin } : u));
      setStatus({ type: 'success', message: `Admin status for @${targetUserId} updated.` });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${targetUserId}`);
      setStatus({ type: 'error', message: "Failed to update admin status." });
    }
  };

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.uid?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-subtle p-12 w-full space-y-6"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
             <Shield className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Access Denied</h1>
            <p className="text-gray-500 text-sm">This area is reserved for administrators only.</p>
          </div>
          <Link 
            to="/" 
            className="block w-full py-3 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Return Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-12 px-4 md:px-0 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
        <div>
          <h1 className="text-5xl font-bold tracking-tighter text-white mb-2">Admin</h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">{editingId ? 'Updating Resource' : 'System Oversight'}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest underline decoration-blue-500/30 underline-offset-4">@{user.username}</span>
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-1">Clearance: Level 4</span>
          </div>
        </div>
      </header>

      <nav className="flex gap-1.5 p-1.5 bg-white/[0.02] border border-white/5 rounded-xl w-fit">
        {[
          { id: 'games', label: 'Index', icon: Gamepad2 },
          { id: 'cinema', label: 'Cinema', icon: Play },
          { id: 'users', label: 'Network', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-white text-black' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'games' ? (
        <div className="space-y-12">
          {/* Game Management UI */}
          <section className="card-subtle p-8 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-gray-500" />
                {editingId ? 'Modify Transmission' : 'Register Entry'}
              </h2>
              {editingId && (
                <button onClick={cancelEdit} className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest">Abort</button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Descriptor</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white"
                    placeholder="Title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Node Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#050505] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white"
                  >
                    {['Action', 'Sports', 'Puzzle', 'IO', 'Racing', 'Horror', 'Skill', 'Idle', 'Adventure'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Asset URL (Thumbnail)</label>
                <input
                  required
                  type="url"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Metadata Description</label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Executable Block (Embed)</label>
                  <textarea
                    rows={3}
                    value={formData.htmlBlock}
                    onChange={(e) => setFormData({ ...formData, htmlBlock: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-[10px] text-gray-400 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Direct Source</label>
                  <input
                    type="text"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white"
                  />
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-4 rounded-xl bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all flex items-center justify-center"
              >
                {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (editingId ? 'Update System Resource' : 'Finalize Entry')}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest px-1">Registry Index ({games.length})</h2>
            <div className="grid gap-1">
              {games.map((game, i) => (
                <div key={`${game.id}-${i}`} className="p-3 rounded-lg bg-black border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all font-sans">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-7 rounded overflow-hidden bg-white/5 shrink-0">
                      <img src={game.thumbnail} alt="" className="w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-400 text-[11px] uppercase tracking-tight">{game.title}</h3>
                      <p className="text-[8px] text-gray-700 uppercase font-bold tracking-[0.2em]">{game.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(game)} className="p-2 text-gray-700 hover:text-white transition-colors"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(game.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : activeTab === 'cinema' ? (
        <div className="space-y-12">
          <section className="card-subtle p-8 space-y-10">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Play className="w-5 h-5 text-gray-500" />
              Link Digital Asset
            </h2>

            <form onSubmit={handleMovieSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Asset Name</label>
                  <input
                    required
                    type="text"
                    value={movieFormData.title}
                    onChange={(e) => setMovieFormData({ ...movieFormData, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Format</label>
                  <select
                    value={movieFormData.type}
                    onChange={(e) => setMovieFormData({ ...movieFormData, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#050505] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white"
                  >
                    <option value="movie">Movie</option>
                    <option value="tv">TV Series</option>
                    <option value="outside">External Link</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Direct Link / Resource ID</label>
                <input
                  required
                  type="text"
                  value={movieFormData.url}
                  onChange={(e) => setMovieFormData({ ...movieFormData, url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 focus:border-blue-500/30 outline-hidden transition-all text-xs text-white font-mono"
                  placeholder="TMDB ID or Direct URL"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-600 tracking-widest">Cover Source</label>
                <input
                  type="url"
                  value={movieFormData.thumbnail}
                  onChange={(e) => setMovieFormData({ ...movieFormData, thumbnail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white"
                />
              </div>

              <button
                disabled={loading}
                className="w-full py-4 rounded-xl bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all"
              >
                {loading ? 'Processing...' : 'Secure Link'}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <h2 className="text-[10px] font-bold text-gray-700 uppercase tracking-widest px-1">Cinema Registry ({movies.length})</h2>
            <div className="grid gap-1">
              {movies.map((m, i) => (
                <div key={`${m.id}-${i}`} className="p-3 rounded-lg bg-black border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all font-sans">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-sm overflow-hidden bg-white/5 shrink-0">
                      {m.thumbnail && <img src={m.thumbnail} alt="" className="w-full h-full object-cover grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-400 text-[11px] uppercase tracking-tight">{m.title}</h3>
                      <p className="text-[8px] text-gray-700 uppercase font-bold tracking-[0.2em]">{m.type}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteMovie(m.id)} className="p-2 text-gray-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="card-subtle p-8 space-y-10">
          {/* User Management UI */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              Pulse Graph
            </h2>
            <div className="relative w-full md:max-w-xs">
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Query User..."
                className="w-full px-10 py-2.5 bg-white/[0.02] border border-white/5 rounded-lg focus:border-blue-500/30 outline-hidden transition-all text-xs text-white"
              />
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            </div>
          </div>
          
          <div className="grid gap-1">
            {usersLoading ? (
              <div className="py-20 flex justify-center"><div className="w-4 h-4 border-2 border-white/10 border-t-white rounded-full animate-spin" /></div>
            ) : filteredUsers.map((u, i) => (
              <div key={`${u.id}-${i}`} className="p-3 rounded-lg bg-black border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/10 transition-all font-sans">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white/5 shrink-0 border border-white/10 grayscale opacity-40">
                    {u.photoURL && <img src={u.photoURL} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                       <h3 className="font-bold text-gray-400 text-[11px] uppercase tracking-tight">@{u.id}</h3>
                       <div className="flex gap-1">
                         {u.isAdmin && <span className="bg-blue-500/5 text-blue-500 text-[6px] font-bold px-1 py-0.5 rounded uppercase border border-blue-500/10 tracking-widest">Root</span>}
                         {u.isBanned && <span className="bg-red-500/5 text-red-500 text-[6px] font-bold px-1 py-0.5 rounded uppercase border border-red-500/10 tracking-widest">Banned</span>}
                       </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 w-full md:w-auto">
                  {u.id.toLowerCase() !== 'yeebs' && u.id.toLowerCase() !== user?.username.toLowerCase() && (
                    <>
                      <button
                        onClick={() => handleToggleAdmin(u.id, !!u.isAdmin)}
                        className={`px-3 py-1.5 rounded-md text-[8px] font-bold uppercase tracking-[0.2em] border transition-all ${
                          u.isAdmin ? 'bg-white text-black border-white' : 'bg-white/[0.02] text-gray-800 border-white/10 hover:text-white'
                        }`}
                      >
                        {u.isAdmin ? 'Revoke' : 'Admin'}
                      </button>
                      <button
                        onClick={() => handleBanToggle(u.id, !!u.isBanned)}
                        className={`px-3 py-1.5 rounded-md text-[8px] font-bold uppercase tracking-[0.2em] border transition-all ${
                          u.isBanned ? 'bg-white text-black border-white' : 'bg-red-500/5 text-red-500 border-red-500/10 hover:bg-red-500 hover:text-white'
                        }`}
                      >
                        {u.isBanned ? 'Unlock' : 'Ban'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-2 text-gray-800 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
