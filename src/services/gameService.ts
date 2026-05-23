import { GAMES as STATIC_GAMES } from '../constants';
import { Game } from '../types';
import { db, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { supabase } from '../lib/supabase';
import { withFallback } from '../lib/dbFallback';

const GAMES_COLLECTION = 'games';

export async function getGames(): Promise<Game[]> {
  try {
    // Try to get from local storage first to save quota
    const cached = localStorage.getItem('yeebsgames_cache_games');
    const cacheTime = localStorage.getItem('yeebsgames_cache_games_time');
    
    // Cache for 30 minutes
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 30 * 60 * 1000) {
      console.log('Serving games from local cache');
      return JSON.parse(cached);
    }

    const firestoreGames = await withFallback(
      async () => {
        const querySnapshot = await getDocs(collection(db, GAMES_COLLECTION));
        return querySnapshot.docs.map(doc => doc.data() as Game);
      },
      async () => {
        const { data, error } = await supabase.from(GAMES_COLLECTION).select('*');
        if (error) throw error;
        return (data || []) as Game[];
      }
    );
    
    // Combine with static games, deduplicate by ID
    const combined = [...STATIC_GAMES, ...firestoreGames];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    // Update cache
    localStorage.setItem('yeebsgames_cache_games', JSON.stringify(unique));
    localStorage.setItem('yeebsgames_cache_games_time', Date.now().toString());
    
    return unique;
  } catch (error) {
    console.warn('Firebase and Supabase fetch failed or not configured. Trying local server fallback...', error);
    try {
      const serverRes = await fetch('/api/games');
      if (serverRes.ok) {
        const serverGames = await serverRes.json();
        if (Array.isArray(serverGames) && serverGames.length > 0) {
          const combined = [...STATIC_GAMES, ...serverGames];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique;
        }
      }
    } catch (serverErr) {
      console.error('Failed to fetch from local server database:', serverErr);
    }

    if (!(error instanceof Error && error.message.includes('supabase'))) {
      handleFirestoreError(error, OperationType.LIST, GAMES_COLLECTION);
    }
    
    // On quota error, try to use stale cache
    const stale = localStorage.getItem('yeebsgames_cache_games');
    if (stale) {
      console.warn('Database error, using stale cache');
      return JSON.parse(stale);
    }
    
    return STATIC_GAMES;
  }
}

export async function addGame(game: Game): Promise<boolean> {
  const gameData = {
    ...game,
    createdAt: new Date().toISOString(),
    playCount: game.playCount || 0,
    rating: game.rating || 5
  };

  try {
    return await withFallback(
      async () => {
        const docRef = doc(db, GAMES_COLLECTION, game.id);
        await setDoc(docRef, gameData);
        return true;
      },
      async () => {
        const { error } = await supabase.from(GAMES_COLLECTION).upsert([gameData]);
        if (error) throw error;
        return true;
      },
      { dualWrite: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, GAMES_COLLECTION);
    return false;
  }
}

export async function updateGame(game: Game): Promise<boolean> {
  try {
    return await withFallback(
      async () => {
        const docRef = doc(db, GAMES_COLLECTION, game.id);
        await updateDoc(docRef, { ...game });
        return true;
      },
      async () => {
        const { error } = await supabase.from(GAMES_COLLECTION).update({ ...game }).eq('id', game.id);
        if (error) throw error;
        return true;
      },
      { dualWrite: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${GAMES_COLLECTION}/${game.id}`);
    return false;
  }
}

export async function deleteGame(gameId: string): Promise<boolean> {
  try {
    return await withFallback(
      async () => {
        const docRef = doc(db, GAMES_COLLECTION, gameId);
        await deleteDoc(docRef);
        return true;
      },
      async () => {
        const { error } = await supabase.from(GAMES_COLLECTION).delete().eq('id', gameId);
        if (error) throw error;
        return true;
      },
      { dualWrite: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GAMES_COLLECTION}/${gameId}`);
    return false;
  }
}
