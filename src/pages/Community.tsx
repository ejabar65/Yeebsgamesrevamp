import React, { useState, useEffect } from 'react';
import { useGames } from '../context/GameContext';
import { motion } from 'motion/react';
import { Users, Search, MessageSquare, Heart, Clock, Shield, Zap } from 'lucide-react';
import { db, collection, query, orderBy, limit, getDocs } from '../lib/firebase';
import { Link } from 'react-router-dom';

interface UserPreview {
  username: string;
  photoURL: string;
  favoriteGameIds: string[];
  isAdmin: boolean;
  createdAt: string;
  bio?: string;
}

export default function Community() {
  const { games } = useGames();
  const [users, setUsers] = useState<UserPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        const userData = snap.docs.map(doc => ({
          id: doc.id,
          username: doc.data().username,
          photoURL: doc.data().photoURL || null,
          favoriteGameIds: doc.data().favoriteGameIds || [],
          isAdmin: doc.data().isAdmin || false,
          createdAt: doc.data().createdAt,
          bio: doc.data().bio || ''
        }));
        setUsers(userData);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tight">Community <span className="text-primary italic">Pulse</span></h1>
        </div>
        <p className="text-gray-400">Discover other players and see what's trending in the portal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar activity/stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass p-6 rounded-3xl border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Find User</h3>
            </div>
            <input 
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:outline-hidden transition-all text-sm"
            />
          </div>

          <div className="glass p-6 rounded-3xl border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Platform Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Total Players</span>
                <span className="text-sm font-bold text-white">{users.length}+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Games Available</span>
                <span className="text-sm font-bold text-white">{games.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 glass rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u, i) => (
                  <motion.div
                    key={`${u.id}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link 
                      to={`/profile/${u.username.toLowerCase()}`}
                      className="block glass p-6 rounded-3xl border border-white/10 hover:border-primary/50 transition-all hover:scale-[1.02] group"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-primary transition-colors">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-6 h-6 text-primary/40" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-display font-bold text-lg">{u.username}</h3>
                            {u.isAdmin && <Shield className="w-3.5 h-3.5 text-primary" fill="currentColor" />}
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Member {new Date(u.createdAt).getFullYear()}</p>
                        </div>
                      </div>

                      {u.bio && (
                        <p className="text-xs text-gray-400 line-clamp-2 mb-4 font-medium italic leading-relaxed">
                          "{u.bio}"
                        </p>
                      )}

                      <div className="flex gap-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-xs font-bold">{u.favoriteGameIds.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs font-bold text-gray-400">Active</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center glass rounded-3xl">
                  <span className="text-gray-500 uppercase font-black text-xs tracking-widest">No users found</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
