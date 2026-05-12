import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

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
      
      const unsub = onSnapshot(doc(db, 'users', key), (snap) => {
        const newStatus = snap.exists() ? (snap.data().status || 'offline') : 'offline';
        statusCache[key] = newStatus;
        statusListeners[key].forEach(cb => cb(newStatus));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${key}`);
      });
      
      unsubs[key] = unsub;
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
    <div className={`w-2 h-2 rounded-full border border-black shrink-0 ${
      status === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
      status === 'away' ? 'bg-yellow-500' : 'bg-gray-800'
    }`} title={status} />
  );
}
