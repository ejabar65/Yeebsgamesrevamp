import { GAMES as STATIC_GAMES } from '../constants';
import { Game } from '../types';
import { db, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from '../lib/firebase';

const GAMES_COLLECTION = 'games';

export async function getGames(): Promise<Game[]> {
  try {
    const querySnapshot = await getDocs(collection(db, GAMES_COLLECTION));
    const firestoreGames = querySnapshot.docs.map(doc => doc.data() as Game);
    
    // Combine with static games, deduplicate by ID
    const combined = [...STATIC_GAMES, ...firestoreGames];
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    
    return unique;
  } catch (error) {
    console.error('Error fetching games from Firestore:', error);
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
