import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { MASCOT_URL } from '../constants';
import { 
  Plus, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Lock, 
  Menu, 
  Search, 
  Film, 
  MessageSquare, 
  Users, 
  Home as HomeIcon,
  Zap,
  Shield
} from 'lucide-react';

import Login from './Login';

interface Tab {
  id: string;
  title: string;
  path: string;
}

export default function OSShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, logout, syncTabs } = useGames();
  const [time, setTime] = useState(new Date());
  const [showLogin, setShowLogin] = useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  
  // Tab State
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Home', path: '/' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [isTaskbarHovered, setIsTaskbarHovered] = useState(false);

  // Sync tabs from user on login
  useEffect(() => {
    if (user?.tabs && user.tabs.length > 0) {
      setTabs(user.tabs);
      // Only force navigation if we are at the home page or root
      // This prevents "yanking" the user away if they manually navigated to a path
      if (location.pathname === '/' || location.pathname === '') {
        setActiveTabId(user.tabs[0].id);
        navigate(user.tabs[0].path);
      } else {
        // Just find and set the active tab based on current path if it exists in synced tabs
        const matchingTab = user.tabs.find(t => t.path === location.pathname);
        if (matchingTab) {
          setActiveTabId(matchingTab.id);
        } else {
          // If no matching tab, maybe we added a new one manually
          // The other effect will sync it
        }
      }
    }
  }, [user?.uid]); // Only run when user login state actually changes uid

  // Sync state to cloud on change
  useEffect(() => {
    if (user) {
      const timeout = setTimeout(() => {
        syncTabs(tabs);
      }, 2000); // Debounce sync
      return () => clearTimeout(timeout);
    }
  }, [tabs, user?.uid, syncTabs]);

  useEffect(() => {
    const handleOpenLogin = () => setShowLogin(true);
    window.addEventListener('open-login', handleOpenLogin);
    return () => window.removeEventListener('open-login', handleOpenLogin);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync active tab path with current location
  useEffect(() => {
    setTabs(prev => prev.map(tab => {
        if (tab.id === activeTabId && tab.path !== location.pathname) {
            return { ...tab, path: location.pathname, title: getTitleForPath(location.pathname) };
        }
        return tab;
    }));
  }, [location.pathname, activeTabId]);

  const getTitleForPath = (path: string) => {
    if (path === '/') return 'Home';
    if (path.includes('/movies')) return 'Cinema';
    if (path.includes('/chat')) return 'Chat';
    if (path.includes('/community')) return 'Social';
    if (path.includes('/profile')) return 'Identity';
    const parts = path.split('/').filter(Boolean);
    return parts[parts.length - 1] || 'New Tab';
  };

  const addTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newTab = { id: newId, title: 'New Tab', path: '/' };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
    navigate('/');
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    if (activeTabId === id) {
      const lastTab = newTabs[newTabs.length - 1];
      setActiveTabId(lastTab.id);
      navigate(lastTab.path);
    }
  };

  const handleTabClick = (tab: Tab) => {
    setActiveTabId(tab.id);
    navigate(tab.path);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#050505] relative select-none font-sans">
      {/* Browser Header / Tab Bar */}
      <div className="shrink-0 bg-[#0f0f0f] border-b border-white/5 pt-2 px-2 flex flex-col gap-2 relative z-50">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide px-2">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className={`group min-w-[140px] max-w-[220px] h-9 px-4 rounded-t-xl flex items-center justify-between gap-3 cursor-pointer transition-all relative ${
                activeTabId === tab.id 
                  ? 'bg-[#1a1a1a] text-primary shadow-[0_-4px_10px_rgba(0,0,0,0.3)]' 
                  : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className={`w-1.5 h-1.5 rounded-full ${activeTabId === tab.id ? 'bg-primary' : 'bg-gray-600'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest truncate">{tab.title}</span>
              </div>
              <button 
                onClick={(e) => closeTab(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-white transition-all"
              >
                <X className="w-3 h-3" />
              </button>
              
              {activeTabId === tab.id && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary" />
              )}
            </div>
          ))}
          <button 
            onClick={addTab}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all ml-1"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Navbar */}
        <div className="flex items-center gap-6 px-4 pb-2 h-10">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => window.location.reload()} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all ml-1">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 max-w-2xl mx-auto h-7 bg-white/[0.03] border border-white/5 rounded-full px-4 flex items-center gap-3 group hover:bg-white/10 transition-all cursor-text shadow-sm">
            <Lock className="w-2.5 h-2.5 text-green-500/60" />
            <span className="text-[10px] font-mono text-gray-400 select-all truncate">
              https://yeebsgames.net<span className="text-gray-600">{location.pathname}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
             {!user ? (
               <button 
                 onClick={() => setShowLogin(true)}
                 className="px-4 py-1.5 bg-primary text-black hover:bg-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
               >
                 Log In
               </button>
             ) : (
               <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                  <span className="text-[8px] font-black text-primary tracking-widest uppercase">Signal Opt</span>
               </div>
             )}
             <div className="relative">
                <button 
                  onClick={() => setShowMenuDropdown(!showMenuDropdown)}
                  className={`p-1.5 rounded-lg transition-all ${showMenuDropdown ? 'bg-primary text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                   <Menu className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenuDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowMenuDropdown(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                         <div className="p-2 space-y-1">
                            {[
                              { name: 'Profile', path: '/profile', icon: Users },
                              { name: 'Settings', path: '/profile?tab=settings', icon: Lock },
                              { name: 'Chat', path: '/chat', icon: MessageSquare },
                              { name: 'Movies', path: '/movies', icon: Film },
                              { name: 'Social', path: '/community', icon: Users },
                              ...(user?.isAdmin ? [{ name: 'Admin', path: '/admin', icon: Shield }] : [])
                            ].map((item) => (
                              <button
                                key={item.name}
                                onClick={() => {
                                  navigate(item.path);
                                  setShowMenuDropdown(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group"
                              >
                                 <item.icon className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 group-hover:text-white">{item.name}</span>
                              </button>
                            ))}
                         </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <main className="flex-1 overflow-y-auto scrollbar-hide bg-[#0a0a0a] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="min-h-full pb-20"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Auto-Hiding Taskbar */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none"
        onMouseEnter={() => setIsTaskbarHovered(true)}
        onMouseLeave={() => setIsTaskbarHovered(false)}
      >
        <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-auto" />
        
        <motion.div
          animate={{ y: isTaskbarHovered ? -16 : 80, opacity: isTaskbarHovered ? 1 : 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 120 }}
          className="max-w-2xl mx-auto h-16 border border-white/10 rounded-[24px] flex items-center justify-between px-8 pointer-events-auto shadow-2xl bg-[#111]/90 backdrop-blur-2xl overflow-hidden"
        >
          <div className="flex items-center gap-8">
             <Link to="/" className="flex items-center gap-3 group">
               <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                 <Zap className="w-5 h-5 text-black" />
               </div>
               <span className="font-black text-[11px] tracking-tighter uppercase whitespace-nowrap hidden sm:block">
                 Yeebsgames.net
               </span>
             </Link>
             
             <div className="w-px h-8 bg-white/10" />
             
             <div className="flex items-center gap-6">
                <Link to="/" title="Home" className={`group relative p-2 ${location.pathname === '/' ? 'text-primary' : 'text-gray-400'} hover:text-white`}>
                   <HomeIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </Link>
                <Link to="/movies" title="Cinema" className={`group relative p-2 ${location.pathname === '/movies' ? 'text-primary' : 'text-gray-400'} hover:text-white`}>
                   <Film className="w-5 h-5 transition-transform group-hover:scale-110" />
                </Link>
                <Link to="/chat" title="Chat" className={`group relative p-2 ${location.pathname === '/chat' ? 'text-primary' : 'text-gray-400'} hover:text-white`}>
                   <MessageSquare className="w-5 h-5 transition-transform group-hover:scale-110" />
                </Link>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none">Net Active</span>
             </div>
             
             {user ? (
               <Link to="/profile" className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center hover:border-primary transition-all shadow-md group">
                 <img src={user.photoURL || undefined} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
               </Link>
             ) : (
               <button onClick={() => setShowLogin(true)} className="px-5 h-9 rounded-xl bg-primary text-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95">Log In</button>
             )}
          </div>
        </motion.div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
}

function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <Login onSuccess={onClose} />
        </div>
      )}
    </AnimatePresence>
  );
}
