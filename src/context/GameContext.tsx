import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game } from '../types';
import { getGames } from '../services/gameService';

interface GameContextType {
  games: Game[];
  favorites: string[];
  searchQuery: string;
  sortBy: string;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: string) => void;
  toggleFavorite: (gameId: string) => void;
  isFavorite: (gameId: string) => boolean;
  refreshGames: () => Promise<void>;
  loading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  const initGames = async () => {
    setLoading(true);
    const allGames = await getGames();
    setGames(allGames);
    setLoading(false);
  };

  useEffect(() => {
    initGames();

    const saved = localStorage.getItem('yeebsgames_favorites');
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const refreshGames = async () => {
    await initGames();
  };

  const toggleFavorite = (gameId: string) => {
    setFavorites(prev => {
      const next = prev.includes(gameId) 
        ? prev.filter(id => id !== gameId) 
        : [...prev, gameId];
      localStorage.setItem('yeebsgames_favorites', JSON.stringify(next));
      return next;
    });
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
      loading 
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
