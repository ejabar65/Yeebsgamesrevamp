import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

import { onSnapshotWithFallback } from '../lib/dbFallback';
import { supabase } from '../lib/supabase';

// Shared status cache to avoid duplicate listeners for the same user
const statusCache: { [username: string]: 'online' | 'offline' | 'away' } = {};
const statusListeners: { [username: string]: Set<(status: 'online' | 'offline' | 'away') => void> } = {};
const unsubs: { [username: string]: () => void } = {};

export default function UserPresence({ username }: { username: string }) {
  const [status, setStatus] = useState<'online' | 'offline' | 'away'>(statusCache[username.toLowerCase()] || 'offline');

  useEffect(() => {
    if (!username) return;
    const key = username.toLowerCase();

    // Initialize listener set if it doesn't exist
    if (!statusListeners[key]) {
      statusListeners[key] = new Set();
      
      const unsubscribe = onSnapshotWithFallback(
        (next, err) => onSnapshot(doc(db, 'users', key), next, err),
        async (next) => {
          const { data, error } = await supabase.from('users').select('status').eq('username', key).single();
          if (error && error.code !== 'PGRST116') throw error;
          next({ exists: () => !!data, data: () => data || { status: 'offline' } } as any);
        },
        (snap: any) => {
          const newStatus = snap.exists() ? (snap.data().status || 'offline') : 'offline';
          statusCache[key] = newStatus;
          statusListeners[key].forEach(cb => cb(newStatus));
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${key}`);
        }
      );
      
      unsubs[key] = unsubscribe;
    }

    const handleChange = (newStatus: 'online' | 'offline' | 'away') => {
      setStatus(newStatus);
    };

    statusListeners[key].add(handleChange);

    return () => {
      statusListeners[key].delete(handleChange);
      if (statusListeners[key].size === 0) {
        unsubs[key]?.();
        delete unsubs[key];
        delete statusListeners[key];
      }
    };
  }, [username]);

  return (
    <div className={`w-2.5 h-2.5 rounded-full border-2 border-[#0c0c0c] shrink-0 transition-all duration-500 scale-110 ${
      status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' :
      status === 'away' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-gray-800'
    }`} title={`${username} is ${status}`} />
  );
}
