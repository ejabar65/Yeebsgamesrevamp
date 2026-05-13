import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Users, X, Check, Gamepad2, AlertCircle } from 'lucide-react';
import { useGames } from '../context/GameContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, getDocs, limit } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { onSnapshotWithFallback } from '../lib/dbFallback';
import { supabase } from '../lib/supabase';
import { GameInvite, AuthUser } from '../types';
import { useNavigate } from 'react-router-dom';

export default function MultiplayerManager() {
  const { user } = useGames();
  const [invites, setInvites] = useState<GameInvite[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<AuthUser[]>([]);
  const [showInviteMenu, setShowInviteMenu] = useState(false);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Listen for invites
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'game_invites'),
      where('to', '==', user.username.toLowerCase()),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshotWithFallback(
      (next, err) => onSnapshot(q, next, err),
      async (next) => {
        const { data, error } = await supabase
          .from('game_invites')
          .select('*')
          .eq('to', user.username.toLowerCase())
          .eq('status', 'pending');
        
        if (error) throw error;
        next({ docs: (data || []).map(d => ({ id: d.id, data: () => d })) } as any);
      },
      (snapshot: any) => {
        const newInvites = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        })) as GameInvite[];
        setInvites(newInvites);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'game_invites');
      }
    );

    return () => unsubscribe();
  }, [user?.username]);

  // Handle invitation
  const handleInviteAction = async (invite: GameInvite, action: 'accepted' | 'declined') => {
    try {
      const inviteRef = doc(db, 'game_invites', invite.id);
      await updateDoc(inviteRef, { status: action });
      
      if (action === 'accepted') {
        navigate(`/game/${invite.gameId}`);
      }
    } catch (error) {
      console.error("Invite action failed", error);
    }
  };

  // Fetch online users when menu is open
  useEffect(() => {
    if (!showInviteMenu) return;

    const fetchOnline = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('status', '==', 'online'),
          limit(20)
        );
        const snap = await getDocs(q);
        const users = snap.docs
          .map(d => d.data() as AuthUser)
          .filter(u => u.username.toLowerCase() !== user?.username.toLowerCase());
        setOnlineUsers(users);
      } catch (e) {
        console.error("Failed to fetch online users", e);
      }
    };

    fetchOnline();
  }, [showInviteMenu, user?.username]);

  const sendInvite = async (targetUsername: string) => {
    if (!user || !activeGameId) return;

    try {
      await addDoc(collection(db, 'game_invites'), {
        from: user.username,
        to: targetUsername.toLowerCase(),
        gameId: activeGameId,
        gameTitle: 'Multiplayer Game', // Could fetch actual title
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setShowInviteMenu(false);
      alert(`Invitation sent to ${targetUsername}!`);
    } catch (e) {
      alert("Failed to send invite.");
    }
  };

  // Expose invite trigger on window for GameView to use
  useEffect(() => {
    (window as any).triggerInvite = (gameId: string) => {
      setActiveGameId(gameId);
      setShowInviteMenu(true);
    };
    return () => delete (window as any).triggerInvite;
  }, []);

  if (!user) return null;

  return (
    <>
      {/* Invite Notifications */}
      <div className="fixed top-24 right-6 z-[60] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {invites.map((invite) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="w-80 glass border border-blue-500/30 rounded-2xl p-5 shadow-2xl pointer-events-auto bg-black/90 backdrop-blur-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Swords className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1">Battle Request!</h4>
                  <p className="text-xs text-gray-400">
                    <span className="text-blue-500 font-bold">{invite.from}</span> challenged you to a game.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => handleInviteAction(invite, 'accepted')}
                  className="flex-1 py-2.5 rounded-xl bg-blue-500 text-black font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" /> Accept
                </button>
                <button
                  onClick={() => handleInviteAction(invite, 'declined')}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Invite Menu Modal */}
      <AnimatePresence>
        {showInviteMenu && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass border border-white/10 rounded-[32px] overflow-hidden bg-[#0c0c0c]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-white">Invite Players</h3>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Select an online user</p>
                </div>
                <button 
                  onClick={() => setShowInviteMenu(false)}
                  className="p-3 hover:bg-white/5 rounded-2xl transition-all"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-none">
                {onlineUsers.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                    <Users className="w-10 h-10 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">No one else is online</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {onlineUsers.map((u) => (
                      <button
                        key={u.uid}
                        onClick={() => sendInvite(u.username)}
                        className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 flex items-center gap-4 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 relative">
                          <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0c0c0c] rounded-full" />
                        </div>
                        <div className="flex-1 text-left">
                          <span className="block text-sm font-black uppercase tracking-tight text-white group-hover:text-blue-500 transition-colors uppercase italic">{u.username}</span>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Active Now</span>
                        </div>
                        <Gamepad2 className="w-5 h-5 text-gray-700 group-hover:text-blue-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-8 bg-white/[0.02] text-center border-t border-white/5">
                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center justify-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Only online players are shown
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
