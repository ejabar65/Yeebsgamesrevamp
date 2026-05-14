import { db, doc, updateDoc, getDoc, setDoc } from '../lib/firebase';
import { supabase } from '../lib/supabase';

interface GameProgress {
  gameId: string;
  data: any;
  updatedAt: string;
}

export const saveGameProgress = async (gameId: string, data: any, userId?: string) => {
  const timestamp = new Date().toISOString();
  const progress: GameProgress = { gameId, data, updatedAt: timestamp };

  // Always save to LocalStorage first
  localStorage.setItem(`save_${gameId}`, JSON.stringify(progress));

  if (!userId) return;

  try {
    // Try Firebase
    const userRef = doc(db, 'users', userId);
    const saveRef = doc(db, `users/${userId}/saves`, gameId);
    await setDoc(saveRef, progress, { merge: true });

    // Try Supabase if configured
    await supabase.from('game_saves').upsert({
      user_id: userId,
      game_id: gameId,
      state: data,
      updated_at: timestamp
    });
  } catch (error) {
    console.error('Cloud save failed, using local only:', error);
  }
};

export const loadGameProgress = async (gameId: string, userId?: string) => {
  // Try Cloud first if userId exists
  if (userId) {
    try {
      const saveRef = doc(db, `users/${userId}/saves`, gameId);
      const snap = await getDoc(saveRef);
      if (snap.exists()) return snap.data().data;

      const { data } = await supabase
        .from('game_saves')
        .select('state')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();
      
      if (data) return data.state;
    } catch (e) {
      console.warn('Cloud load failed, falling back to local');
    }
  }

  // Fallback to LocalStorage
  const local = localStorage.getItem(`save_${gameId}`);
  if (local) {
    const parsed = JSON.parse(local);
    return parsed.data;
  }

  return null;
};
