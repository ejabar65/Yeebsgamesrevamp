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

export interface AuthUser {
  uid: string;
  username: string;
  isAdmin: boolean;
  photoURL?: string;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface GameContextType {
  games: Game[];
  favorites: string[];
  searchQuery: string;
  sortBy: string;
  user: AuthUser | null;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  toggleFavorite: (gameId: string) => void;
  isFavorite: (gameId: string) => boolean;
  refreshGames: () => Promise<void>;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
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
        // Verify credentials
        try {
          const userRef = doc(db, 'users', savedUsername);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists() && userSnap.data().password === savedPassword) {
            const data = userSnap.data();
            setUser({
              uid: data.uid,
              username: savedUsername,
              isAdmin: savedUsername.toLowerCase() === 'yeebs',
              photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${savedUsername}`
            });
            setFavorites(data.favoriteGameIds || []);
          } else {
            // Invalid session
            localStorage.removeItem('yeebsgames_username');
            localStorage.removeItem('yeebsgames_password');
          }
        } catch (e) {
          console.error("Session restoration failed", e);
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
      const cleanPassword = password?.trim();
      if (!cleanUsername || !cleanPassword) return false;

      const userRef = doc(db, 'users', cleanUsername);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.password !== cleanPassword) {
          alert('Invalid password for this account.');
          return false;
        }
      } else {
        // Register new username
        // Special case for Yeebs admin account
        if (cleanUsername.toLowerCase() === 'yeebs' && cleanPassword !== '$#GS29gs1') {
          alert('Unauthorized admin registration.');
          return false;
        }

        await setDoc(userRef, {
          username: cleanUsername,
          password: cleanPassword,
          uid: 'user_' + Math.random().toString(36).substr(2, 9), // Local identifier
          favoriteGameIds: favorites,
          createdAt: new Date().toISOString()
        });
      }

      const finalUser: AuthUser = {
        uid: userSnap.exists() ? userSnap.data().uid : 'user_' + Math.random().toString(36).substr(2, 9),
        username: cleanUsername,
        isAdmin: cleanUsername.toLowerCase() === 'yeebs',
        photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`
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
      const userRef = doc(db, 'users', user.username);
      try {
        await updateDoc(userRef, { favoriteGameIds: next });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.username}`);
      }
    } else {
      localStorage.setItem('yeebsgames_favorites', JSON.stringify(next));
    }
  };

  const isFavorite = (gameId: string) => favorites.includes(gameId);

  return (
    <GameContext.Provider value={{ 
      games, 
      favorites, 
      searchQuery, 
      setSearchQuery, 
      sortBy,
      setSortBy,
      toggleFavorite, 
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
