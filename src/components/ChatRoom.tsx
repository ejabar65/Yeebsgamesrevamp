import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Filter } from 'bad-words';
import { Send, Trash2, MessageSquare, Shield, User, Zap, Image as ImageIcon, X, CheckCircle2, Star, Phone, Settings } from 'lucide-react';
import { ADMIN_LIST, MOD_LIST } from '../constants';

const filter = new Filter();

export const ChatRoom: React.FC<{ 
  groupId?: string; 
  settings?: { spamLimit: boolean; filterEnabled: boolean };
  ownerId?: string;
  onUpdateSettings?: (settings: any) => void;
}> = ({ groupId, settings, ownerId, onUpdateSettings }) => {
  const { user } = useGames();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spamCooldown, setSpamCooldown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isInVoice, setIsInVoice] = useState(false);
  const [callActive, setCallActive] = useState(false);

  const isOwner = user?.uid === ownerId;
  const spamLimitEnabled = settings ? settings.spamLimit : true;
  const filterEnabled = settings ? settings.filterEnabled : true;

  useEffect(() => {
    const colPath = groupId ? `groups/${groupId}/messages` : 'global_messages';
    const q = query(
      collection(db, colPath),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
      setMessages(msgs);
      setLoading(false);
      
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
    });

    return () => unsubscribe();
  }, [groupId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to chat.');
      return;
    }
    if ((!newMessage.trim() && !selectedImage) || (spamCooldown && spamLimitEnabled)) return;

    if (spamLimitEnabled) {
      setSpamCooldown(true);
      setTimeout(() => setSpamCooldown(false), 2000);
    }

    try {
      const censoredText = (filterEnabled && filter.isProfane(newMessage)) ? filter.clean(newMessage) : newMessage;
      const colPath = groupId ? `groups/${groupId}/messages` : 'global_messages';

      await addDoc(collection(db, colPath), {
        text: censoredText,
        image: selectedImage,
        senderId: user.uid,
        senderName: user.username,
        senderAvatar: user.photoURL,
        createdAt: serverTimestamp()
      });

      const lowerUsername = user.username.toLowerCase();
      const userRef = doc(db, 'users', lowerUsername);
      await updateDoc(userRef, { lastMessageAt: serverTimestamp() });
      
      setNewMessage('');
      setSelectedImage(null);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'global_messages');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10000 * 10000) { // 10MB Limit
      alert('Image too large. Limit is 10MB for database synchronization.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!user?.isAdmin) return;
    if (!confirm('Delete this message?')) return;
    
    try {
      await deleteDoc(doc(db, 'global_messages', msgId));
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, `global_messages/${msgId}`);
    }
  };

  const handleUpdateSetting = async (key: string, value: boolean) => {
    if (!groupId || !onUpdateSettings) return;
    try {
      const groupRef = doc(db, 'groups', groupId);
      const newSettings = { ...settings, [key]: value };
      await updateDoc(groupRef, { settings: newSettings });
      onUpdateSettings(newSettings);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}`);
    }
  };

  const toggleCall = () => {
    if (!callActive) {
      setCallActive(true);
      setIsInVoice(true);
    } else {
      setCallActive(false);
      setIsInVoice(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#000] rounded-xl border border-white/5 overflow-hidden relative font-sans">
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="font-bold text-xs text-white tracking-tight">{groupId ? 'Sector Comms' : 'Global Comms'}</h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-700 mt-0.5">{groupId ? 'Secure Branch' : 'Network active'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {groupId && (
            <>
              <button 
                onClick={toggleCall}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${callActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
              >
                <Phone className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">{callActive ? 'In Voice' : 'Join Call'}</span>
              </button>
              
              {isOwner && (
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
          {!groupId && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/5 border border-blue-500/10 rounded-full">
              <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[8px] text-blue-500 font-bold tracking-widest uppercase">Operational</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showSettings && groupId && isOwner && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-500/5 border-b border-blue-500/10 overflow-hidden relative z-10"
          >
            <div className="p-6 flex flex-wrap gap-8">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleUpdateSetting('spamLimit', !spamLimitEnabled)}
                  className={`w-10 h-5 rounded-full relative transition-all ${spamLimitEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 bottom-1 w-3 rounded-full bg-white transition-all ${spamLimitEnabled ? 'right-1' : 'left-1'}`} />
                </button>
                <div>
                  <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Spam Protocol</h4>
                  <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{spamLimitEnabled ? 'Throttled' : 'Unrestricted'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleUpdateSetting('filterEnabled', !filterEnabled)}
                  className={`w-10 h-5 rounded-full relative transition-all ${filterEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 bottom-1 w-3 rounded-full bg-white transition-all ${filterEnabled ? 'right-1' : 'left-1'}`} />
                </button>
                <div>
                  <h4 className="text-[9px] font-black text-white uppercase tracking-widest">Integrity Filter</h4>
                  <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">{filterEnabled ? 'Enabled' : 'Bypassed'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Call Overlay */}
      <AnimatePresence>
        {callActive && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-20 right-6 z-30 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                Live Sync
              </span>
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">00:12</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={user?.photoURL} className="w-8 h-8 rounded-lg object-cover border border-green-500/50" />
                  <div className="absolute inset-0 bg-green-500/20 rounded-lg animate-ping opacity-20" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-white uppercase tracking-tight">{user?.username}</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-0.5 h-1.5 bg-green-500/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />)}
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setCallActive(false)}
              className="w-full mt-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              Disconnect
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-4 h-4 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-800">Syncing Frequency</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-900 py-10 flex flex-col items-center gap-4">
            <MessageSquare className="w-8 h-8 opacity-5" />
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-10">No data transmitted</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                key={`${msg.id}-${i}`} 
                className={`flex gap-4 ${msg.senderName === user?.username ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl overflow-hidden border ${msg.senderName === user?.username ? 'border-white/20' : 'border-white/5'} bg-white/5`}>
                    <img 
                      src={msg.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className={`flex flex-col ${msg.senderName === user?.username ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Link 
                      to={`/profile/${msg.senderName.toLowerCase()}`}
                      className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center gap-1 ${ADMIN_LIST.includes(msg.senderName.toLowerCase()) ? 'text-blue-500' : MOD_LIST.includes(msg.senderName.toLowerCase()) ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                      {msg.senderName}
                      {ADMIN_LIST.includes(msg.senderName.toLowerCase()) && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {MOD_LIST.includes(msg.senderName.toLowerCase()) && <Star className="w-2.5 h-2.5 fill-current" />}
                    </Link>
                    {user?.isAdmin && (
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1 rounded text-red-500/20 hover:text-red-500 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <div 
                    className={`max-w-[100%] px-4 py-3 rounded-xl text-[13px] leading-relaxed relative ${
                      msg.senderName === user?.username 
                        ? 'bg-white text-black font-medium' 
                        : 'bg-white/[0.02] text-gray-300 border border-white/5'
                    }`}
                  >
                    {msg.image && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/5 bg-white/5">
                        <img src={msg.image} alt="Transmission Asset" className="max-w-full h-auto opacity-90 hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <p className="tracking-tight">{msg.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 bg-black">
        {!user ? (
          <div className="text-center py-4 bg-white/[0.02] rounded-lg border border-dashed border-white/5">
            <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest">Authorization required for broadcast</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative inline-block"
                >
                  <img src={selectedImage} alt="Input Buffer" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 p-1 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-center gap-2">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              <div className="relative flex-1 group">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={selectedImage ? "Add metadata..." : "Enter transmission..."}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 pb-3 pr-24 focus:outline-hidden focus:border-white/20 transition-all text-[13px] text-white"
                  maxLength={200}
                />
                <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2 rounded-lg transition-all ${selectedImage ? 'bg-blue-500 text-white' : 'text-gray-700 hover:text-gray-400'}`}
                    disabled={isUploading}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || spamCooldown || isUploading}
                    className="px-4 h-full bg-white text-black rounded-lg hover:bg-gray-200 transition-all disabled:opacity-5 disabled:bg-white/10 font-bold text-[10px] uppercase tracking-widest"
                  >
                    {spamCooldown ? 'Wait' : 'Push'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
