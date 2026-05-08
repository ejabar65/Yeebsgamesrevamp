import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useGames } from '../context/GameContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, MessageSquare, Trash2, Settings, Shield, Zap, Phone } from 'lucide-react';
import { ChatRoom } from './ChatRoom';

interface Group {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  ownerName: string;
  members: string[];
  settings: {
    spamLimit: boolean;
    filterEnabled: boolean;
  };
  createdAt: any;
}

export const GroupChats: React.FC = () => {
  const { user } = useGames();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch all groups
    const q = query(
      collection(db, 'groups'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const g = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[];
      
      // Filter client-side: user must be an owner, member, or Admin/Mod
      const filtered = g.filter(group => 
        group.members.includes(user.uid) || 
        group.ownerId === user.uid ||
        user.isAdmin
      );
      
      setGroups(filtered);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'groups');
    });

    return () => unsubscribe();
  }, [user]);

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newGroupName.trim()) return;

    try {
      const groupData = {
        name: newGroupName.trim(),
        code: generateCode(),
        ownerId: user.uid,
        ownerName: user.username,
        members: [user.uid],
        settings: {
          spamLimit: true,
          filterEnabled: true
        },
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'groups'), groupData);
      setNewGroupName('');
      setShowCreateModal(false);
      setSelectedGroup({ ...groupData, id: docRef.id } as Group);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'groups');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;

    try {
      const q = query(collection(db, 'groups'), where('code', '==', joinCode.trim().toUpperCase()));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
          alert('Invalid Sector Code. Transmission rejected.');
          unsubscribe();
          return;
        }

        const groupDoc = snapshot.docs[0];
        const groupData = groupDoc.data() as Group;

        if (groupData.members.includes(user.uid)) {
          setSelectedGroup({ ...groupData, id: groupDoc.id } as Group);
          setJoinCode('');
          setShowJoinModal(false);
          unsubscribe();
          return;
        }

        const groupRef = doc(db, 'groups', groupDoc.id);
        await updateDoc(groupRef, {
          members: [...groupData.members, user.uid]
        });

        setSelectedGroup({ ...groupData, id: groupDoc.id, members: [...groupData.members, user.uid] } as Group);
        setJoinCode('');
        setShowJoinModal(false);
        unsubscribe();
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'groups');
    }
  };

  const handleDeleteGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Warning: This will terminate the group and all associated data. Proceed?')) return;
    
    try {
      await deleteDoc(doc(db, 'groups', groupId));
      if (selectedGroup?.id === groupId) setSelectedGroup(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `groups/${groupId}`);
    }
  };

  if (selectedGroup) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedGroup(null)}
              className="p-2 -ml-2 rounded-lg hover:bg-white/5 text-gray-500 transition-colors"
            >
              <Plus className="w-4 h-4 rotate-45" />
            </button>
            <div>
              <h2 className="font-bold text-sm text-white tracking-tight">{selectedGroup.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">Group Transmission</span>
                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">• Sector: {selectedGroup.code}</span>
                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">• {selectedGroup.members.length} Members</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/5 border border-green-500/10 rounded-full">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] text-green-500 font-bold tracking-widest uppercase">Sync Active</span>
             </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0">
          <ChatRoom 
            groupId={selectedGroup.id} 
            settings={selectedGroup.settings}
            ownerId={selectedGroup.ownerId}
            onUpdateSettings={(newSettings) => setSelectedGroup({ ...selectedGroup, settings: newSettings })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-8 font-sans">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">Groups.</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mt-2">Private sector networking</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 text-gray-400 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all shadow-2xl active:scale-95"
          >
            <Zap className="w-4 h-4" />
            Join Sector
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Initialize GC
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 opacity-50">
          <div className="w-6 h-6 border-2 border-white/5 border-t-white/40 rounded-full animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
          <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-dashed border-white/10 flex items-center justify-center text-gray-800">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-white text-lg">No Active Sectors</h3>
            <p className="text-gray-500 text-sm max-w-[240px] font-medium leading-relaxed">
              Create a new group chat to establish private low-latency comms with your network.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <motion.div
              key={group.id}
              layoutId={group.id}
              onClick={() => setSelectedGroup(group)}
              className="card-subtle p-6 flex flex-col justify-between gap-8 group cursor-pointer hover:border-blue-500/30 transition-all duration-500"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                {user?.uid === group.ownerId && (
                  <button 
                    onClick={(e) => handleDeleteGroup(group.id, e)}
                    className="p-2 rounded-lg text-gray-800 hover:text-red-500 hover:bg-red-500/5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-xl text-white mb-2">{group.name}</h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{group.members.length} Active Users</span>
                  <div className="w-1 h-1 rounded-full bg-gray-600" />
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">v1.2.SYNC</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowJoinModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md card-subtle p-8 space-y-8 bg-[#0c0c0c] border-white/10"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">Join Sector</h2>
                <p className="text-gray-500 text-xs mt-2 font-medium">Enter the unique 6-character code to established a secure link.</p>
              </div>

              <form onSubmit={handleJoinGroup} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Sector Code</label>
                  <input 
                    type="text"
                    autoFocus
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="E.G. XJ9K2L"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-4 focus:outline-hidden focus:border-blue-500/50 transition-all text-center text-xl font-black tracking-[0.5em] text-blue-500 placeholder:opacity-20 uppercase"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={joinCode.length < 6}
                    className="flex-1 py-4 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 disabled:opacity-50"
                  >
                    Establish Link
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md card-subtle p-8 space-y-8 bg-[#0c0c0c] border-white/10"
            >
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">New Communication Sector</h2>
                <p className="text-gray-500 text-xs mt-2 font-medium">Define the identifier for your private grid branch.</p>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Sector Name</label>
                  <input 
                    type="text"
                    autoFocus
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g. ALPHA SQUAD"
                    className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-5 py-4 focus:outline-hidden focus:border-blue-500/50 transition-all text-sm font-medium text-white"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={!newGroupName.trim()}
                    className="flex-1 py-4 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 disabled:opacity-50"
                  >
                    Establish
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
