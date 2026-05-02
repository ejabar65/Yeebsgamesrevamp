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
  orderBy
} from '../lib/firebase';

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
  user: User | null;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  toggleFavorite: (gameId: string) => void;
  isFavorite: (gameId: string) => boolean;
  refreshGames: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sync favorites with Firestore if logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Load favorites from Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setFavorites(userDoc.data().favoriteGameIds || []);
          } else {
            // Initialize user doc
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              favoriteGameIds: [],
              createdAt: new Date().toISOString()
            });
            setFavorites([]);
          }
        } catch (error) {
          console.error("Error loading user profile", error);
        }
      } else {
        // Load favorites from local storage if not logged in
        const saved = localStorage.getItem('yeebsgames_favorites');
        if (saved) {
          setFavorites(JSON.parse(saved));
        } else {
          setFavorites([]);
        }
      }
    });

    return () => unsubscribe();
  }, []);

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
      const userRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userRef, { favoriteGameIds: next });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
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
