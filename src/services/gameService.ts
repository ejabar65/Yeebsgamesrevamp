import { GAMES as STATIC_GAMES } from '../constants';
import { Game } from '../types';
import { db, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from '../lib/firebase';

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

    const querySnapshot = await getDocs(collection(db, GAMES_COLLECTION));
    const firestoreGames = querySnapshot.docs.map(doc => doc.data() as Game);
    
    // Combine with static games, deduplicate by ID
    const combined = [...STATIC_GAMES, ...firestoreGames];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    // Update cache
    localStorage.setItem('yeebsgames_cache_games', JSON.stringify(unique));
    localStorage.setItem('yeebsgames_cache_games_time', Date.now().toString());
    
    return unique;
  } catch (error) {
    console.error('Error fetching games from Firestore:', error);
    
    // On quota error, try to use stale cache
    const stale = localStorage.getItem('yeebsgames_cache_games');
    if (stale) {
      console.warn('Firestore error, using stale cache');
      return JSON.parse(stale);
    }
    
    return STATIC_GAMES;
  }
}

export async function addGame(game: Game): Promise<boolean> {
  try {
    const docRef = doc(db, GAMES_COLLECTION, game.id);
    await setDoc(docRef, {
      ...game,
      createdAt: new Date().toISOString(),
      playCount: game.playCount || 0,
      rating: game.rating || 5
    });
    return true;
  } catch (error) {
    console.error('Error adding game to Firestore:', error);
    return false;
  }
}

export async function updateGame(game: Game): Promise<boolean> {
  try {
    const docRef = doc(db, GAMES_COLLECTION, game.id);
    await updateDoc(docRef, { ...game });
    return true;
  } catch (error) {
    console.error('Error updating game in Firestore:', error);
    return false;
  }
}

export async function deleteGame(gameId: string): Promise<boolean> {
  try {
    const docRef = doc(db, GAMES_COLLECTION, gameId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting game from Firestore:', error);
    return false;
  }
}
