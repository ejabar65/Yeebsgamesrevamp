import { db, collection, getDocs } from './firebase';
import { supabase } from './supabase';

export const migrateFirebaseToSupabase = async () => {
  const results: any = {
    games: { success: 0, fail: 0, errors: [] as string[] },
    users: { success: 0, fail: 0, errors: [] as string[] },
    movies: { success: 0, fail: 0, errors: [] as string[] },
  };

  try {
    console.log('Starting migration sequence...');

    // 1. Migrate Games (including local seeded games if any)
    let gamesToMigrate: any[] = [];
    try {
      const gamesSnap = await getDocs(collection(db, 'games'));
      gamesSnap.forEach(d => {
        gamesToMigrate.push({ id: d.id, ...d.data() });
      });
    } catch (e) {
      console.warn('Could not load games from Firebase, using local database games instead:', e);
    }

    try {
      const localRes = await fetch('/api/games');
      if (localRes.ok) {
        const localGames = await localRes.json();
        if (Array.isArray(localGames)) {
          localGames.forEach(lg => {
            if (!gamesToMigrate.some(g => g.id === lg.id)) {
              gamesToMigrate.push(lg);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Could not load local games:', e);
    }

    console.log(`Scanning Games to Migrate: Found ${gamesToMigrate.length} total entries`);
    for (const gameData of gamesToMigrate) {
      const { error } = await supabase.from('games').upsert({
        id: gameData.id,
        title: gameData.title || '',
        description: gameData.description || '',
        thumbnail: gameData.thumbnail || '',
        category: gameData.category || 'Arcade',
        url: gameData.url || '',
        html_block: gameData.htmlBlock || gameData.html_block || '',
        play_count: gameData.playCount || gameData.play_count || 0,
        rating: gameData.rating || 5,
        updated_at: gameData.updatedAt || gameData.updated_at || new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (error) {
        console.error(`Game ${gameData.id} failed:`, error);
        results.games.fail++;
        results.games.errors.push(`${gameData.id}: ${error.message}`);
      } else {
        results.games.success++;
      }
    }

    // 2. Migrate Users
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log(`Scanning Users: Found ${usersSnap.size} entries`);
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('users').upsert({
        id: doc.id,
        username: data.username || doc.id,
        display_name: data.display_name || data.username || doc.id,
        photo_url: data.photoURL || '',
        is_admin: !!data.isAdmin,
        is_mod: !!data.isMod,
        is_banned: !!data.isBanned,
        created_at: data.createdAt || new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (error) {
        console.error(`User ${doc.id} failed:`, error);
        results.users.fail++;
        results.users.errors.push(`${doc.id}: ${error.message}`);
      } else {
        results.users.success++;
      }
    }

    // 3. Migrate Movies
    const moviesSnap = await getDocs(collection(db, 'custom_movies'));
    console.log(`Scanning Movies: Found ${moviesSnap.size} entries`);
    for (const doc of moviesSnap.docs) {
      const data = doc.data();
      const { error } = await supabase.from('movies').upsert({
        id: doc.id,
        title: data.title,
        description: data.description || '',
        thumbnail: data.thumbnail || '',
        url: data.url,
        type: data.type || 'movie',
        updated_at: data.updatedAt || new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (error) {
        console.error(`Movie ${doc.id} failed:`, error);
        results.movies.fail++;
        results.movies.errors.push(`${doc.id}: ${error.message}`);
      } else {
        results.movies.success++;
      }
    }

    console.log('Migration sequence finished.', results);
    return results;
  } catch (error) {
    console.error('Fatal Migration Error:', error);
    throw error;
  }
};
