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
  getDoc
} from 'firebase/firestore';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, MessageSquare, Zap, Shield, Loader2 } from 'lucide-react';
import { Filter } from 'bad-words';

const filter = new Filter();

export const ChatRoom: React.FC = () => {
  const { user } = useGames();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [spamCooldown, setSpamCooldown] = useState(false);

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
      
      // Auto scroll to bottom
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
    if (!newMessage.trim() || spamCooldown) return;

    setSpamCooldown(true);
    setTimeout(() => setSpamCooldown(false), 2000); // 2 second cooldown

    try {
      // Spam prevention check in user profile
      const userRef = doc(db, 'users', user.username);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const lastMsg = userSnap.data().lastMessageAt;
        if (lastMsg) {
          const lastTime = lastMsg.toMillis();
          if (Date.now() - lastTime < 1500) {
            alert('Slow down! Spam prevention active.');
            return;
          }
        }
      }

      const censoredText = filter.isProfane(newMessage) ? filter.clean(newMessage) : newMessage;

      await addDoc(collection(db, 'global_messages'), {
        text: censoredText,
        senderId: user.uid,
        senderName: user.username,
        createdAt: serverTimestamp()
      });

      // Update last message timestamp
      await updateDoc(userRef, { lastMessageAt: serverTimestamp() });
      
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-bold tracking-tight">GLOBAL CHAT</h2>
        </div>
        <div className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
          LIVE
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            <p className="text-sm">No transmissions yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id} 
              className={`flex flex-col ${msg.senderName === user?.username ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase ${msg.senderName === 'Yeebs' ? 'text-primary' : 'text-gray-400'}`}>
                  {msg.senderName}
                </span>
                {msg.senderName === 'Yeebs' && <Shield className="w-2.5 h-2.5 text-primary" />}
                {user && msg.senderName !== user.username && (
                  <button 
                    onClick={() => {
                      // Navigate to DM with this user
                      // We can pass state to the Chat page or just let them switch and search
                      // But for better UX, I'll add a way to trigger it.
                      // Actually, let's just alert them to use the DM tab for now
                      // OR better: I'll use a custom event or shared state if I had more time.
                      // For now, I'll just explain.
                      alert(`Switch to DIRECT MESSAGES and search for "${msg.senderName}" to start a chat!`);
                    }}
                    className="text-[10px] text-primary/50 hover:text-primary transition-colors font-bold uppercase tracking-widest"
                  >
                    [DM]
                  </button>
                )}
              </div>
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  msg.senderName === user?.username 
                    ? 'bg-primary text-black font-medium' 
                    : 'bg-white/10 text-white'
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/20">
        {!user ? (
          <div className="text-center py-2 bg-white/5 rounded-xl border border-dashed border-white/20">
            <p className="text-xs text-gray-400">LOG IN TO TRANSMIT MESSAGES</p>
          </div>
        ) : (
          <div className="relative">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-hidden focus:border-primary transition-all text-sm"
              maxLength={200}
            />
            <button 
              type="submit"
              disabled={!newMessage.trim() || spamCooldown}
              className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {spamCooldown ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
