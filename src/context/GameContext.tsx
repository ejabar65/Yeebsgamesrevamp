import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game } from '../types';
import { getGames } from '../services/gameService';
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

export interface UserSettings {
  compactMode: boolean;
  showChatPreview: boolean;
  customTheme?: string;
  soundsEnabled?: boolean;
  privateProfile?: boolean;
}

export interface AvatarConfig {
  style: string;
  seed: string;
  backgroundColor?: string;
  rotate?: number;
}

export interface AuthUser {
  uid: string;
  username: string;
  isAdmin: boolean;
  photoURL?: string;
  avatarConfig?: AvatarConfig;
  settings?: UserSettings;
  history?: string[];
  bio?: string;
  tabs?: { id: string; title: string; path: string; }[];
}

import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

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
  updateAvatar: (config: AvatarConfig) => Promise<void>;
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
    
    const initialize = async () => {
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
          const userRef = doc(db, 'users', savedUsername.toLowerCase());
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().password === savedPassword) {
            const data = userSnap.data();
            if (data.isBanned) {
              localStorage.removeItem('yeebsgames_username');
              localStorage.removeItem('yeebsgames_password');
              localStorage.removeItem('yeebsgames_user_cache');
              setAuthLoading(false);
              return;
            }
            const authUser: AuthUser = {
              uid: data.uid,
              username: savedUsername,
              isAdmin: savedUsername.toLowerCase() === 'yeebs' || data.isAdmin,
              photoURL: data.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${savedUsername}`,
              avatarConfig: data.avatarConfig || { style: 'avataaars', seed: savedUsername },
              settings: data.settings || { compactMode: false, showChatPreview: true, soundsEnabled: true, privateProfile: false },
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
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    try {
      const cleanUsername = username.trim();
      const lowerUsername = cleanUsername.toLowerCase();
      const cleanPassword = password?.trim();
      if (!cleanUsername || !cleanPassword) return false;

      const userRef = doc(db, 'users', lowerUsername);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
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
        // Special case for Yeebs admin account
        if (lowerUsername === 'yeebs' && cleanPassword !== '$#GS29gs1') {
          alert('Unauthorized admin registration.');
          return false;
        }

        await setDoc(userRef, {
          username: cleanUsername, // Keep original for display? 
          // Actually, let's just stick to cleanUsername for display but ID is lower
          password: cleanPassword,
          uid: 'user_' + Math.random().toString(36).substr(2, 9),
          favoriteGameIds: favorites,
          createdAt: new Date().toISOString(),
          isAdmin: lowerUsername === 'yeebs'
        });
      }

      const finalUser: AuthUser = {
        uid: userSnap.exists() ? userSnap.data().uid : 'user_' + Math.random().toString(36).substr(2, 9),
        username: cleanUsername,
        isAdmin: lowerUsername === 'yeebs' || (userSnap.exists() && userSnap.data().isAdmin),
        photoURL: (userSnap.exists() && userSnap.data().photoURL) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
        avatarConfig: (userSnap.exists() && userSnap.data().avatarConfig) || { style: 'avataaars', seed: cleanUsername },
        settings: userSnap.exists() ? userSnap.data().settings : { compactMode: false, showChatPreview: true, soundsEnabled: true, privateProfile: false },
        history: userSnap.exists() ? userSnap.data().history : [],
        bio: userSnap.exists() ? userSnap.data().bio : '',
        tabs: userSnap.exists() ? (userSnap.data().tabs || []) : []
      };

      setUser(finalUser);
      localStorage.setItem('yeebsgames_username', cleanUsername);
      localStorage.setItem('yeebsgames_password', cleanPassword); // Store for syncing
      return true;
    } catch (e: any) {
      console.error("Login failed", e);
      alert('Login failed. Please verify your Firestore rules are deployed.');
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
      const userRef = doc(db, 'users', user.username.toLowerCase());
      try {
        await updateDoc(userRef, { favoriteGameIds: next });
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
      const userRef = doc(db, 'users', user.username.toLowerCase());
      await updateDoc(userRef, { settings });
      setUser({ ...user, settings });
      if (settings.soundsEnabled) {
        // Optional: play a subtle click sound
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.username.toLowerCase()}`);
    }
  };

  const addToHistory = async (gameId: string) => {
    // Local storage history always happens
    const history = JSON.parse(localStorage.getItem('yeebsgames_recent') || '[]');
    const newHistory = [gameId, ...history.filter((hid: string) => hid !== gameId)].slice(0, 10);
    localStorage.setItem('yeebsgames_recent', JSON.stringify(newHistory));

    if (user) {
      try {
        const userRef = doc(db, 'users', user.username.toLowerCase());
        await updateDoc(userRef, { history: newHistory });
        setUser({ ...user, history: newHistory });
      } catch (error) {
        // Silent error for history
        console.error("Failed to sync history to cloud", error);
      }
    }
  };

  const updateAvatar = async (config: AvatarConfig) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.username.toLowerCase());
      const newPhotoURL = `https://api.dicebear.com/7.x/${config.style}/svg?seed=${config.seed}${config.backgroundColor ? `&backgroundColor=${config.backgroundColor}` : ''}${config.rotate ? `&rotate=${config.rotate}` : ''}`;
      await updateDoc(userRef, { 
        avatarConfig: config,
        photoURL: newPhotoURL
      });
      setUser({ ...user, avatarConfig: config, photoURL: newPhotoURL });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.username.toLowerCase()}/avatar`);
    }
  };

  const updateBio = async (bio: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.username.toLowerCase());
      await updateDoc(userRef, { bio });
      setUser({ ...user, bio });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.username.toLowerCase()}/bio`);
    }
  };

  const getPublicProfile = async (username: string) => {
    try {
      const userRef = doc(db, 'users', username.toLowerCase());
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
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
      const userRef = doc(db, 'users', user.username.toLowerCase());
      await updateDoc(userRef, { tabs });
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
