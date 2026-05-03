import React, { useState } from 'react';
import { Bug, Search, Trophy, TrendingUp, Home, LogIn, LogOut, User as UserIcon, X, Shield, Zap, MessageSquare, ChevronDown, Monitor } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';

import { MASCOT_URL, CLOAK_OPTIONS } from '../constants';
import { applyCloak, getSavedCloak } from '../cloakUtils';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery, setSortBy, user, login, logout } = useGames();
  const [showLoginModal, setShowLoginModal] = useState(false);
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
      <Link to="/" onClick={() => handleNavClick('/')} className="flex items-center gap-2 group">
        <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all flex items-center justify-center p-1.5 border border-primary/20">
          <img 
            src={MASCOT_URL} 
            alt="YEEBS Logo"
            className="w-full h-full object-contain rounded-sm brightness-110 group-hover:scale-110 transition-transform"
          />
        </div>
        <span className="font-display font-bold text-xl tracking-tight uppercase relative">
          YEEBS<span className="text-primary">GAMES</span>
          <span className="absolute -top-3 -right-2 bg-red-600 text-[8px] px-1.5 py-0.5 rounded text-white font-black italic tracking-tighter rotate-12 shadow-md border border-red-400/30">
            REVAMPED
          </span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        {[
          { name: 'Home', icon: Home, path: '/', sort: 'newest' },
          { name: 'Chat', icon: MessageSquare, path: '/chat' },
          { name: 'Proxy', icon: Shield, path: '/proxy' },
          { name: 'Trending', icon: TrendingUp, path: '/', sort: 'trending' },
          { name: 'Top Rated', icon: Trophy, path: '/', sort: 'top' },
        ].map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (item.path === '/chat' || item.path === '/proxy') {
                navigate(item.path);
              } else {
                handleNavClick(item.path, item.sort);
              }
            }}
            className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary
              ${location.pathname === item.path ? 'text-primary' : 'text-gray-400'}`}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search games..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all w-48 md:w-64"
          />
        </div>

        {/* Cloak Selector */}
        <div className="relative">
          <button 
            onClick={() => setIsCloakOpen(!isCloakOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest whitespace-nowrap"
          >
            <Monitor className="w-3.5 h-3.5 text-primary" />
            <span className="hidden lg:inline">{currentCloak.split(' ')[0]}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isCloakOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isCloakOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsCloakOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-56 glass border border-white/10 rounded-2xl p-2 z-50 shadow-2xl"
                >
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">Cloaking Engine</p>
                  </div>
                  {CLOAK_OPTIONS.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => handleCloakChange(option.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all hover:bg-white/10 text-left
                        ${currentCloak === option.name ? 'text-primary' : 'text-gray-400'}`}
                    >
                      <img src={option.icon} alt="" className="w-4 h-4 object-contain rounded-xs" />
                      {option.name}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {user ? (
          <div className="flex items-center gap-2 pl-4 border-l border-white/10">
            <Link 
              to="/profile" 
              className="w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-primary transition-all group/profile"
              title="Profile"
            >
              <img src={user.photoURL || ''} alt={user.username || 'User'} className="w-full h-full object-cover group-hover/profile:scale-110 transition-transform" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-dark-surface font-bold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]"
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
        )}
      </div>

      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
              className="relative w-full max-w-md glass p-8 rounded-3xl border border-white/10"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-black uppercase tracking-tight">Access <span className="text-primary">Portal</span></h2>
                <p className="text-gray-400 text-sm mt-1">Claim your username to save favorites</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 px-1 tracking-widest">Username</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:outline-hidden transition-all text-sm"
                    placeholder="ENTER NAME..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 px-1 tracking-widest flex items-center gap-2">
                    {username.toLowerCase() === 'yeebs' && <Shield className="w-3 h-3 text-primary" />} 
                    Password
                  </label>
                  <input 
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl bg-white/5 border focus:outline-hidden transition-all text-sm ${username.toLowerCase() === 'yeebs' ? 'border-primary/50 focus:border-primary' : 'border-white/10 focus:border-primary'}`}
                    placeholder="ENTER KEY..."
                  />
                </div>

                <button 
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl bg-primary text-dark-surface font-display font-black text-sm uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-dark-surface border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      SYNC SESSION
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
