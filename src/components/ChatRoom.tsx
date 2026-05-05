import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
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
import { Send, Trash2, MessageSquare, Shield, User, Zap, Image as ImageIcon, X } from 'lucide-react';

const filter = new Filter();

export const ChatRoom: React.FC = () => {
  const { user } = useGames();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [spamCooldown, setSpamCooldown] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'global_messages'),
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
    });

    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to chat.');
      return;
    }
    if ((!newMessage.trim() && !selectedImage) || spamCooldown) return;

    setSpamCooldown(true);
    setTimeout(() => setSpamCooldown(false), 2000);

    try {
      const censoredText = filter.isProfane(newMessage) ? filter.clean(newMessage) : newMessage;

      await addDoc(collection(db, 'global_messages'), {
        text: censoredText,
        image: selectedImage,
        senderId: user.uid,
        senderName: user.username,
        createdAt: serverTimestamp()
      });

      const lowerUsername = user.username.toLowerCase();
      const userRef = doc(db, 'users', lowerUsername);
      await updateDoc(userRef, { lastMessageAt: serverTimestamp() });
      
      setNewMessage('');
      setSelectedImage(null);
    } catch (error) {
      console.error("Error sending message:", error);
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
      console.error("Error deleting message:", error);
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-[#111] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-linear-to-r from-primary/10 via-transparent to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="font-black text-xs uppercase tracking-widest text-white">Global Frequency</h2>
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">Node Cluster: Alpha-7</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-500 font-black tracking-widest uppercase">UPSETIVE</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-95"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Zap className="w-8 h-8 text-primary animate-bounce" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Initializing link...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-600 py-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-dashed border-white/10">
              <MessageSquare className="w-6 h-6 opacity-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">No signals received yet</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, x: msg.senderName === user?.username ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              key={`${msg.id}-${i}`} 
              className={`flex flex-col ${msg.senderName === user?.username ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                {msg.senderName !== user?.username && (
                   <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                      <User className="w-3 h-3 text-gray-500" />
                   </div>
                )}
                <Link 
                  to={`/profile/${msg.senderName.toLowerCase()}`}
                  className={`text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors cursor-pointer ${msg.senderName.toLowerCase() === 'yeebs' ? 'text-primary' : 'text-gray-500'}`}
                >
                  {msg.senderName}
                </Link>
                {user?.isAdmin && (
                  <button 
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="p-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div 
                className={`max-w-[85%] px-6 py-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
                  msg.senderName === user?.username 
                    ? 'bg-linear-to-br from-primary to-yellow-600 text-black font-bold rounded-tr-none' 
                    : 'bg-white/5 text-white border border-white/10 rounded-tl-none backdrop-blur-md'
                }`}
              >
                {msg.image && (
                  <div className="mb-3 rounded-xl overflow-hidden border border-black/10">
                    <img src={msg.image} alt="Upload" className="max-w-full h-auto" />
                  </div>
                )}
                {msg.text}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-6 border-t border-white/5 bg-[#1a1a1a]">
        {!user ? (
          <div className="text-center py-2">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Identification required to broadcast</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="relative inline-block"
                >
                  <img src={selectedImage} alt="Selected" className="w-24 h-24 object-cover rounded-xl border-2 border-primary" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group flex items-center gap-2">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Zap className={`w-4 h-4 ${newMessage || selectedImage ? 'text-primary' : 'text-gray-600'} transition-colors`} />
                </div>
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={selectedImage ? "Add a caption..." : "Transmit data..."}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 focus:outline-hidden focus:border-primary/50 focus:bg-white/[0.08] transition-all text-sm font-medium placeholder:text-gray-700"
                  maxLength={200}
                />
                <div className="absolute right-3 top-2.5 bottom-2.5 flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-2.5 rounded-xl transition-all ${selectedImage ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    disabled={isUploading}
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <button 
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || spamCooldown || isUploading}
                    className="px-6 h-full bg-primary text-black rounded-xl hover:bg-white transition-all disabled:opacity-50 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    {spamCooldown ? 'WAIT' : 'SEND'}
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
