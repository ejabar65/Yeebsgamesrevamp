import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, AuthUser, UserSettings, AvatarConfig } from '../types';
import { getGames } from '../services/gameService';
import { ADMIN_LIST, MOD_LIST } from '../constants';
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  User, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  signInAnonymously,
  signOut
} from '../lib/firebase';

import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { supabase } from '../lib/supabase';
import { withFallback } from '../lib/dbFallback';

interface GameContextType {
  games: Game[];
  favorites: string[];
  searchQuery: string;
  sortBy: string;
  user: AuthUser | null;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  toggleFavorite: (gameId: string) => void;
  updateSettings: (settings: UserSettings) => Promise<void>;
  addToHistory: (gameId: string) => Promise<void>;
  isFavorite: (gameId: string) => boolean;
  refreshGames: () => Promise<void>;
  updateAvatar: (config: AvatarConfig & { photoURLOverride?: string }) => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  getPublicProfile: (username: string) => Promise<any>;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  syncTabs: (tabs: { id: string; title: string; path: string; }[]) => Promise<void>;
  loading: boolean;
  authLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Load username from local storage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('yeebsgames_username');
    const savedPassword = localStorage.getItem('yeebsgames_password');
    
    // Heartbeat for online status
    let interval: any;
    
    const updatePresence = async (status: 'online' | 'offline') => {
      const username = localStorage.getItem('yeebsgames_username');
      if (username) {
        try {
          await withFallback(
            async () => {
              const userRef = doc(db, 'users', username.toLowerCase());
              await updateDoc(userRef, { 
                status, 
                lastSeen: new Date().toISOString() 
              });
            },
            async () => {
              const { error } = await supabase.from('users').update({ 
                status, 
                lastSeen: new Date().toISOString() 
              }).eq('username', username.toLowerCase());
              if (error) throw error;
            },
            { dualWrite: true }
          );
        } catch (e) {
          // Ignore presence errors to avoid loop/quota issues
        }
      }
    };

    const initialize = async () => {
      // Set to online initially
      if (savedUsername) {
        updatePresence('online');
        interval = setInterval(() => updatePresence('online'), 2 * 60 * 1000); // Pulse every 2 mins
      }

      if (savedUsername && savedPassword) {
        // Try to used cached user data first
        const cachedUser = localStorage.getItem('yeebsgames_user_cache');
        if (cachedUser) {
          try {
            const parsed = JSON.parse(cachedUser);
            // Even if cached, we'll verify asynchronously or just trust it for now to save quota
            // But we check time. Cache for 1 hour.
            const cacheTime = localStorage.getItem('yeebsgames_user_cache_time');
            if (cacheTime && Date.now() - parseInt(cacheTime) < 60 * 60 * 1000) {
              setUser(parsed);
              setFavorites(parsed.settings?.favoriteGameIds || []);
              setAuthLoading(false);
              return;
            }
          } catch (e) {}
        }

        // Verify credentials if no cache or expired
        try {
          const data = await withFallback(
            async () => {
              const userRef = doc(db, 'users', savedUsername.toLowerCase());
              const userSnap = await getDoc(userRef);
              return userSnap.exists() ? userSnap.data() : null;
            },
            async () => {
              const { data, error } = await supabase.from('users').select('*').eq('username', savedUsername.toLowerCase()).single();
              if (error && error.code !== 'PGRST116') throw error;
              return data;
            }
          );
          
          if (data && data.password === savedPassword) {
            if (data.isBanned) {
              localStorage.removeItem('yeebsgames_username');
              localStorage.removeItem('yeebsgames_password');
              localStorage.removeItem('yeebsgames_user_cache');
              setAuthLoading(false);
              return;
            }
            const currentUserLower = savedUsername.toLowerCase();
            const isAdmin = ADMIN_LIST.includes(currentUserLower) || data.isAdmin;
            const isMod = MOD_LIST.includes(currentUserLower) || data.isMod;

            const authUser: AuthUser = {
              uid: data.uid,
              username: savedUsername,
              isAdmin,
              isMod,
              banLimitInfo: data.banLimitInfo || { count: 0, lastReset: new Date().toISOString() },
              photoURL: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${savedUsername}`,
              avatarConfig: data.avatarConfig || { style: 'avataaars', seed: savedUsername },
              settings: data.settings || { 
                compactMode: false, 
                showChatPreview: true, 
                soundsEnabled: true, 
                privateProfile: false,
                performanceMode: false
              },
              history: data.history || [],
              bio: data.bio || '',
              tabs: data.tabs || []
            };
            setUser(authUser);
            setFavorites(data.favoriteGameIds || []);
            
            // Update cache
            localStorage.setItem('yeebsgames_user_cache', JSON.stringify(authUser));
            localStorage.setItem('yeebsgames_user_cache_time', Date.now().toString());

            if (data.history) {
              localStorage.setItem('yeebsgames_recent', JSON.stringify(data.history));
            }
          } else {
            // Invalid session
            localStorage.removeItem('yeebsgames_username');
            localStorage.removeItem('yeebsgames_password');
            localStorage.removeItem('yeebsgames_user_cache');
          }
        } catch (e) {
          console.error("Session restoration failed", e);
          // If Firestore fails (quota), try to use the cache regardless of age
          const staleUser = localStorage.getItem('yeebsgames_user_cache');
          if (staleUser) {
             setUser(JSON.parse(staleUser));
          }
        }
      } else {
        // Guest mode
        const saved = localStorage.getItem('yeebsgames_favorites');
        if (saved) setFavorites(JSON.parse(saved));
      }
      setAuthLoading(false);
    };

    initialize();

    // Cleanup presence on tab close
    const handleBeforeUnload = () => {
      updatePresence('offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updatePresence('offline');
    };
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      const cleanUsername = username.trim();
      const lowerUsername = cleanUsername.toLowerCase();
      const cleanPassword = password?.trim();
      if (!cleanUsername || !cleanPassword) return false;

      const userData = await withFallback(
        async () => {
          const userRef = doc(db, 'users', lowerUsername);
          const userSnap = await getDoc(userRef);
          return userSnap.exists() ? { data: userSnap.data(), exists: true } : { data: null, exists: false };
        },
        async () => {
          const { data, error } = await supabase.from('users').select('*').eq('username', lowerUsername).single();
           if (error && error.code !== 'PGRST116') throw error;
           return { data, exists: !!data };
        }
      );

      if (userData.exists) {
        const data = userData.data;
        if (data.isBanned) {
          alert('This account has been banned from the system.');
          return false;
        }
        if (data.password !== cleanPassword) {
          alert('Invalid password for this account.');
          return false;
        }
      } else {
        // Register new username
        if (lowerUsername === 'yeebs' && cleanPassword !== '$#GS29gs1') {
          alert('Unauthorized admin registration.');
          return false;
        }

        const newUser = {
          username: cleanUsername,
          password: cleanPassword,
          uid: 'user_' + Math.random().toString(36).substr(2, 9),
          favoriteGameIds: favorites,
          createdAt: new Date().toISOString(),
          isAdmin: ADMIN_LIST.includes(lowerUsername),
          isMod: MOD_LIST.includes(lowerUsername)
        };

        await withFallback(
          async () => {
            const userRef = doc(db, 'users', lowerUsername);
            await setDoc(userRef, newUser);
          },
          async () => {
            const { error } = await supabase.from('users').upsert([newUser]);
            if (error) throw error;
          },
          { dualWrite: true }
        );
      }

      const isAdmin = ADMIN_LIST.includes(lowerUsername) || (userData.exists && userData.data.isAdmin);
      const isMod = MOD_LIST.includes(lowerUsername) || (userData.exists && userData.data.isMod);

      const finalUser: AuthUser = {
        uid: userData.exists ? userData.data.uid : 'user_' + Math.random().toString(36).substr(2, 9),
        username: cleanUsername,
        isAdmin,
        isMod,
        banLimitInfo: (userData.exists && userData.data.banLimitInfo) || { count: 0, lastReset: new Date().toISOString() },
        photoURL: (userData.exists && userData.data.photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
        avatarConfig: (userData.exists && userData.data.avatarConfig) || { style: 'avataaars', seed: cleanUsername },
        settings: userData.exists ? userData.data.settings : { 
          compactMode: false, 
          showChatPreview: true, 
          soundsEnabled: true, 
          privateProfile: false,
          performanceMode: false
        },
        history: userData.exists ? userData.data.history : [],
        bio: userData.exists ? userData.data.bio : '',
        tabs: userData.exists ? (userData.data.tabs || []) : []
      };

      setUser(finalUser);
      localStorage.setItem('yeebsgames_username', cleanUsername);
      localStorage.setItem('yeebsgames_password', cleanPassword); // Store for syncing
      return true;
    } catch (e: any) {
      console.error("Login failed", e);
      alert('Login failed. Please verify your Database rules are deployed.');
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('yeebsgames_username');
    localStorage.removeItem('yeebsgames_password');
    setUser(null);
    setFavorites([]);
  };

  const initGames = async () => {
    setLoading(true);
    try {
      const allGames = await getGames();
      setGames(allGames);
    } catch (error) {
      console.error("Failed to load games", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    initGames();
  }, []);

  const refreshGames = async () => {
    await initGames();
  };

  const toggleFavorite = async (gameId: string) => {
    const isFav = favorites.includes(gameId);
    const next = isFav 
      ? favorites.filter(id => id !== gameId) 
      : [...favorites, gameId];
    
    setFavorites(next);

    if (user) {
      try {
        await withFallback(
          async () => {
            const userRef = doc(db, 'users', user.username.toLowerCase());
            await updateDoc(userRef, { favoriteGameIds: next });
          },
          async () => {
            const { error } = await supabase.from('users').update({ favoriteGameIds: next }).eq('username', user.username.toLowerCase());
            if (error) throw error;
          },
          { dualWrite: true }
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.username.toLowerCase()}`);
      }
    } else {
      localStorage.setItem('yeebsgames_favorites', JSON.stringify(next));
    }
  };

  const isFavorite = (gameId: string) => favorites.includes(gameId);

  const updateSettings = async (settings: UserSettings) => {
    if (!user) return;
    try {
      await withFallback(
        async () => {
          const userRef = doc(db, 'users', user.username.toLowerCase());
          await updateDoc(userRef, { settings });
        },
        async () => {
          const { error } = await supabase.from('users').update({ settings }).eq('username', user.username.toLowerCase());
          if (error) throw error;
        },
        { dualWrite: true }
      );
      setUser({ ...user, settings });
      
      // Handle performance mode class
      if (settings.performanceMode) {
        document.body.classList.add('perf-mode');
      } else {
        document.body.classList.remove('perf-mode');
      }

      if (settings.soundsEnabled) {
        // Optional: play a subtle click sound
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.username.toLowerCase()}`);
    }
  };

  // On user change, sync body class
  useEffect(() => {
    if (user?.settings?.performanceMode) {
      document.body.classList.add('perf-mode');
    } else {
      document.body.classList.remove('perf-mode');
    }
  }, [user?.settings?.performanceMode]);

  const addToHistory = async (gameId: string) => {
    // Local storage history always happens
    const history = JSON.parse(localStorage.getItem('yeebsgames_recent') || '[]');
    const newHistory = [gameId, ...history.filter((hid: string) => hid !== gameId)].slice(0, 10);
    localStorage.setItem('yeebsgames_recent', JSON.stringify(newHistory));

    if (user) {
      try {
        await withFallback(
          async () => {
            const userRef = doc(db, 'users', user.username.toLowerCase());
            await updateDoc(userRef, { history: newHistory });
          },
          async () => {
             const { error } = await supabase.from('users').update({ history: newHistory }).eq('username', user.username.toLowerCase());
             if (error) throw error;
          },
          { dualWrite: true }
        );
        setUser({ ...user, history: newHistory });
      } catch (error) {
        // Silent error for history
        console.error("Failed to sync history to cloud", error);
      }
    }
  };

  const updateAvatar = async (config: AvatarConfig & { photoURLOverride?: string }) => {
    if (!user) return;
    try {
      const newPhotoURL = config.photoURLOverride || `https://api.dicebear.com/7.x/${config.style}/svg?seed=${config.seed}${config.backgroundColor ? `&backgroundColor=${config.backgroundColor}` : ''}${config.rotate ? `&rotate=${config.rotate}` : ''}`;
      await withFallback(
        async () => {
          const userRef = doc(db, 'users', user.username.toLowerCase());
          await updateDoc(userRef, { 
            avatarConfig: config,
            photoURL: newPhotoURL
          });
        },
        async () => {
          const { error } = await supabase.from('users').update({ 
            avatarConfig: config,
            photoURL: newPhotoURL
          }).eq('username', user.username.toLowerCase());
          if (error) throw error;
        },
        { dualWrite: true }
      );
      setUser({ ...user, avatarConfig: config, photoURL: newPhotoURL });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.username.toLowerCase()}/avatar`);
    }
  };

  const updateBio = async (bio: string) => {
    if (!user) return;
    try {
      await withFallback(
        async () => {
          const userRef = doc(db, 'users', user.username.toLowerCase());
          await updateDoc(userRef, { bio });
        },
        async () => {
          const { error } = await supabase.from('users').update({ bio }).eq('username', user.username.toLowerCase());
          if (error) throw error;
        },
        { dualWrite: true }
      );
      setUser({ ...user, bio });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.username.toLowerCase()}/bio`);
    }
  };

  const getPublicProfile = async (username: string) => {
    try {
      const data = await withFallback(
        async () => {
          const userRef = doc(db, 'users', username.toLowerCase());
          const snap = await getDoc(userRef);
          return snap.exists() ? snap.data() : null;
        },
        async () => {
           const { data, error } = await supabase.from('users').select('*').eq('username', username.toLowerCase()).single();
           if (error && error.code !== 'PGRST116') throw error;
           return data;
        }
      );

      if (data) {
        if (data.settings?.privateProfile) return null;
        
        return {
          username: data.username,
          photoURL: data.photoURL,
          avatarConfig: data.avatarConfig,
          favoriteGameIds: data.favoriteGameIds || [],
          createdAt: data.createdAt,
          isAdmin: data.isAdmin,
          bio: data.bio || ''
        };
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch public profile", error);
      return null;
    }
  };

  const syncTabs = async (tabs: { id: string; title: string; path: string; }[]) => {
    if (!user) return;
    try {
      await withFallback(
        async () => {
          const userRef = doc(db, 'users', user.username.toLowerCase());
          await updateDoc(userRef, { tabs });
        },
        async () => {
          const { error } = await supabase.from('users').update({ tabs }).eq('username', user.username.toLowerCase());
          if (error) throw error;
        },
        { dualWrite: true }
      );
      // We don't update local state here to avoid loops, OSShell handles its own state
    } catch (error) {
      console.error("Failed to sync tabs to cloud", error);
    }
  };

  return (
    <GameContext.Provider value={{ 
      games, 
      favorites, 
      searchQuery, 
      setSearchQuery, 
      sortBy,
      setSortBy,
      toggleFavorite, 
      updateSettings,
      updateAvatar,
      updateBio,
      getPublicProfile,
      addToHistory,
      syncTabs,
      isFavorite,
      refreshGames,
      login,
      logout,
      user,
      loading,
      authLoading
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
}
