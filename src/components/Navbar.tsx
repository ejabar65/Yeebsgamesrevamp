import React, { useState, useEffect } from 'react';
import { Bug, Search, Trophy, TrendingUp, Home, LogIn, LogOut, User as UserIcon, X, Shield, Zap, MessageSquare, ChevronDown, Monitor, Users, Film } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';

import { MASCOT_URL, CLOAK_OPTIONS } from '../constants';
import { applyCloak, getSavedCloak } from '../cloakUtils';
import { db, collection, query, orderBy, limit, onSnapshot } from '../lib/firebase';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, setSortBy, user, login, logout } = useGames();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [latestMessage, setLatestMessage] = useState<{ text: string, sender: string } | null>(null);

  // Listen for new messages if chat preview is enabled
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (user?.settings?.showChatPreview) {
      const q = query(collection(db, 'global_messages'), orderBy('createdAt', 'desc'), limit(1));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          // Don't show if user is on chat page
          if (location.pathname === '/chat') return;
          
          setLatestMessage({ text: data.text, sender: data.senderName });
          
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => setLatestMessage(null), 5000);
        }
      });
      return () => {
        unsubscribe();
        if (timer) clearTimeout(timer);
      };
    }
  }, [user?.settings?.showChatPreview, location.pathname]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Only for Yeebs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCloakOpen, setIsCloakOpen] = useState(false);
  const [currentCloak, setCurrentCloak] = useState(getSavedCloak());

  const handleCloakChange = (cloakName: string) => {
    applyCloak(cloakName);
    setCurrentCloak(cloakName);
    setIsCloakOpen(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const success = await login(username, password);
    if (success) {
      setShowLoginModal(false);
      setUsername('');
      setPassword('');
    }
    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleNavClick = (path: string, sort?: string) => {
    if (sort) {
      setSortBy(sort);
    } else {
      setSortBy('newest'); // default
    }
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass h-16 px-4 md:px-8 flex items-center justify-between">
      {/* Notifications */}
      <AnimatePresence>
        {latestMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-sm px-4"
          >
            <div className="bg-blue-500 text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-3">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold block uppercase tracking-wider mb-0.5">New Message</span>
                <p className="text-xs truncate opacity-90"><span className="font-bold">{latestMessage.sender}:</span> {latestMessage.text}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link to="/" onClick={() => handleNavClick('/')} className="flex items-center gap-3 group">
        <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 active:scale-95 border border-white/10">
          <img src={MASCOT_URL} alt="Mascot" className="w-full h-full object-cover" />
        </div>
        <span className="font-bold text-sm tracking-tight text-white uppercase tracking-widest">
          Yeebs<span className="text-blue-500 opacity-80">Games</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {[
          { name: 'Games', icon: Home, path: '/', sort: 'newest' },
          { name: 'Movies', icon: Film, path: '/movies' },
          { name: 'Chat', icon: MessageSquare, path: '/chat' },
          { name: 'Tutorials', icon: Monitor, path: '/tutorials' },
          { name: 'Reviews', icon: MessageSquare, path: '/reviews' },
          ...(user?.isAdmin || user?.isMod ? [{ name: 'Admin', icon: Shield, path: '/admin' }] : []),
        ].map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (['/chat', '/movies', '/admin', '/tutorials', '/reviews'].includes(item.path)) {
                navigate(item.path);
              } else {
                handleNavClick(item.path, item.sort);
              }
            }}
            className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-all
              ${location.pathname === item.path ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search Games..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-9 pr-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[11px] focus:outline-hidden focus:border-blue-500/50 focus:bg-white/[0.05] transition-all w-48 transition-all"
          />
        </div>

        <div className="relative">
          <button 
            onClick={() => setIsCloakOpen(!isCloakOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-bold text-gray-500 hover:text-white transition-all uppercase tracking-widest"
          >
            <Monitor className="w-3 h-3" />
            <span className="hidden sm:inline">{currentCloak.split(' ')[0]}</span>
            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isCloakOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isCloakOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCloakOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 bg-[#111] border border-white/10 rounded-xl p-1 z-50 shadow-2xl"
                >
                  {CLOAK_OPTIONS.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => handleCloakChange(option.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/5 text-left
                        ${currentCloak === option.name ? 'text-blue-500 bg-blue-500/5' : 'text-gray-400'}`}
                    >
                      <img src={option.icon} alt="" className="w-4 h-4 object-contain rounded-sm" />
                      {option.name}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {user ? (
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <Link 
              to="/profile" 
              className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-blue-500 transition-all"
            >
              <img src={user.photoURL || undefined} alt="" className="w-full h-full object-cover" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-blue-500 transition-all shadow-lg shadow-blue-500/20"
          >
            Login
          </button>
        )}
      </div>

      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#111] p-8 rounded-2xl border border-white/10 shadow-2xl"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <UserIcon className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold">Login</h2>
                <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest block">Username</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-hidden transition-all text-sm"
                    placeholder="Enter name..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 tracking-widest block">Password</label>
                  <input 
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-hidden transition-all text-sm"
                    placeholder="Enter key..."
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold text-sm uppercase tracking-widest hover:bg-white hover:text-blue-500 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Login
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
