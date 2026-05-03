import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDocs,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Search, MessageCircle, ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { Filter } from 'bad-words';

const filter = new Filter();

export const DirectMessages: React.FC = () => {
  const { user } = useGames();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load user's chat sessions
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.username),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages for active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    });

    return () => unsubscribe();
  }, [activeChat]);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !searchName.trim()) return;

    const targetName = searchName.trim();
    if (targetName === user.username) {
      alert("You can't chat with yourself!");
      return;
    }

    setIsSearching(true);
    try {
      // Check if user exists
      const userRef = doc(db, 'users', targetName);
      const userSnap = await getDocs(query(collection(db, 'users'), where('username', '==', targetName)));
      
      if (userSnap.empty && targetName !== 'Yeebs') { // Yeebs might not be in 'users' yet if it's a fresh DB
        alert("User not found.");
        setIsSearching(false);
        return;
      }

      // Chat ID is alphabetical combination
      const participants = [user.username, targetName].sort();
      const chatId = participants.join('_');

      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        participants,
        updatedAt: serverTimestamp(),
        lastMessage: 'Conversation started'
      }, { merge: true });

      setActiveChat({ id: chatId, participants });
      setSearchName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeChat || !newMessage.trim()) return;

    const text = filter.isProfane(newMessage) ? filter.clean(newMessage) : newMessage;
    const msgData = {
      text,
      senderId: user.username,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
        <User className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-xl font-bold mb-2">INITIALIZATION REQUIRED</h3>
        <p className="text-gray-400 text-sm max-w-xs">Log in to establish secure peer-to-peer communication channels.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-white/10 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/10 bg-white/5">
          <form onSubmit={handleStartChat} className="relative">
            <input 
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Start chat with..."
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-hidden focus:border-primary transition-all pr-12"
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="absolute right-2 top-1.5 bottom-1.5 px-2 bg-primary text-black rounded text-[10px] font-bold"
            >
              {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
            </button>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {chats.map((chat) => {
            const recipient = chat.participants.find((p: string) => p !== user.username);
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-colors border-b border-white/5 text-left ${activeChat?.id === chat.id ? 'bg-white/10' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {recipient?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm truncate uppercase tracking-tighter">{recipient}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </button>
            );
          })}
          {chats.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-xs">
              NO ACTIVE SESSIONS
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-black/20 ${!activeChat ? 'hidden md:flex items-center justify-center p-8' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-white/5">
              <button onClick={() => setActiveChat(null)} className="md:hidden">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                  {activeChat.participants.find((p: string) => p !== user.username)?.[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tighter uppercase">
                    {activeChat.participants.find((p: string) => p !== user.username)}
                  </h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] text-gray-500 font-bold">SECURE CHANNEL</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.senderId === user.username ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.senderId === user.username ? 'bg-primary text-black font-medium' : 'bg-white/10 text-white'}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-black/40">
              <div className="relative">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Transmit message..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 focus:outline-hidden focus:border-primary transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <MessageCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-500 uppercase tracking-widest">Select a Transmission</h3>
            <p className="text-xs text-gray-600 mt-2">CHOOSE A PEER TO BEGIN SECURE EXCHANGE</p>
          </div>
        )}
      </div>
    </div>
  );
};
