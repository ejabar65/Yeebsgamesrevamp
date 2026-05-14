import { db, collection, getDocs } from './firebase';
import { supabase } from './supabase';

export const migrateFirebaseToSupabase = async () => {
  const results: any = {
    games: { success: 0, fail: 0 },
    users: { success: 0, fail: 0 },
    movies: { success: 0, fail: 0 },
  };

  try {
    // 1. Migrate Games
    const gamesSnap = await getDocs(collection(db, 'games'));
    for (const doc of gamesSnap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('games').upsert({
        id: doc.id,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        category: data.category,
        url: data.url,
        html_block: data.htmlBlock,
        play_count: data.playCount || 0,
        rating: data.rating || 5,
        updated_at: data.updatedAt || new Date().toISOString()
      });
      if (error) results.games.fail++;
      else results.games.success++;
    }

    // 2. Migrate Users
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('users').upsert({
        id: doc.id,
        username: data.username,
        display_name: data.display_name,
        photo_url: data.photoURL,
        is_admin: !!data.isAdmin,
        is_mod: !!data.isMod,
        is_banned: !!data.isBanned,
        created_at: data.createdAt || new Date().toISOString()
      });
      if (error) results.users.fail++;
      else results.users.success++;
    }

    // 3. Migrate Movies
    const moviesSnap = await getDocs(collection(db, 'custom_movies'));
    for (const doc of moviesSnap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('movies').upsert({
        id: doc.id,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        url: data.url,
        type: data.type,
        updated_at: data.updatedAt || new Date().toISOString()
      });
      if (error) results.movies.fail++;
      else results.movies.success++;
    }

    return results;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
