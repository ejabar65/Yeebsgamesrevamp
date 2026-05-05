import React, { useState, useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Filter } from 'bad-words';
import { Image as ImageIcon, Send, X, User } from 'lucide-react';

const filter = new Filter();

export const DirectMessages: React.FC = () => {
  const { user } = useGames();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.username.toLowerCase())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatData.sort((a: any, b: any) => {
        const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0);
        const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0);
        return timeB - timeA;
      }));
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chats', activeChat.id, 'messages')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeA - timeB;
      });
      setMessages(msgs);
      
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

    const targetName = searchName.trim().toLowerCase();
    if (targetName === user.username.toLowerCase()) {
      alert("You cannot chat with yourself.");
      return;
    }

    setIsSearching(true);
    try {
      const userRef = doc(db, 'users', targetName);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        alert("User not found.");
        setIsSearching(false);
        return;
      }

      const participants = [user.username.toLowerCase(), targetName].sort();
      const chatId = participants.join('_');

      const chatRef = doc(db, 'chats', chatId);
      await setDoc(chatRef, {
        participants,
        updatedAt: serverTimestamp(),
        lastMessage: 'Started'
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
    if (!user || !activeChat || (!newMessage.trim() && !selectedImage)) return;

    const text = filter.isProfane(newMessage) ? filter.clean(newMessage) : newMessage;
    const msgData = {
      text,
      image: selectedImage,
      senderId: user.username.toLowerCase(),
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: selectedImage ? '📷 Image' : text,
        updatedAt: serverTimestamp()
      });
      setNewMessage('');
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Image too large. Limit is 1MB.');
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] bg-[#0f0f0f] rounded-2xl border border-white/5 p-8 text-center text-[10px] font-black uppercase tracking-widest text-gray-600">
        Login required for messages
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-[#0f0f0f] rounded-2xl border border-white/5 overflow-hidden">
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5 bg-white/[0.02]">
          <form onSubmit={handleStartChat} className="relative">
            <input 
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Enter username..."
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest focus:outline-hidden focus:border-primary/50 transition-all pr-20"
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="absolute right-2 top-1.5 bottom-1.5 px-3 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
            >
              {isSearching ? '...' : 'Start'}
            </button>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {chats.map((chat, i) => {
            const recipient = chat.participants.find((p: string) => p !== user.username.toLowerCase());
            return (
              <button
                key={`${chat.id}-${i}`}
                onClick={() => setActiveChat(chat)}
                className={`w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/[0.02] text-left ${activeChat?.id === chat.id ? 'bg-white/5' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-primary font-black text-xs">
                  {recipient?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-xs uppercase tracking-widest truncate">{recipient}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 truncate font-bold uppercase tracking-tight">{chat.lastMessage}</p>
                </div>
              </button>
            );
          })}
          {chats.length === 0 && (
            <div className="p-12 text-center text-gray-700 text-[10px] font-black uppercase tracking-widest">
              Empty
            </div>
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-black/40 ${!activeChat ? 'hidden md:flex items-center justify-center p-8' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
              <button onClick={() => setActiveChat(null)} className="md:hidden text-[10px] font-black uppercase tracking-widest text-gray-500">
                ← Back
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-primary text-[10px] font-black">
                  {activeChat.participants.find((p: string) => p !== user.username.toLowerCase())?.[0]?.toUpperCase()}
                </div>
                <Link 
                  to={`/profile/${activeChat.participants.find((p: string) => p !== user.username.toLowerCase())}`}
                  className="font-black text-xs uppercase tracking-widest hover:text-primary transition-colors"
                >
                  {activeChat.participants.find((p: string) => p !== user.username.toLowerCase())}
                </Link>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
            >
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div 
                    key={`${msg.id}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex ${msg.senderId === user.username.toLowerCase() ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-[13px] ${msg.senderId === user.username.toLowerCase() ? 'bg-primary text-black font-bold' : 'bg-white/5 text-white'}`}>
                      {msg.image && (
                         <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                            <img src={msg.image} alt="Upload" className="max-w-full h-auto" />
                         </div>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white/[0.01] border-t border-white/5">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <AnimatePresence>
                {selectedImage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative inline-block mb-4 p-1 bg-white/5 rounded-xl border border-white/10"
                  >
                    <img src={selectedImage} alt="Selected" className="w-20 h-20 object-cover rounded-lg" />
                    <button 
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-4 pr-24 focus:outline-hidden focus:border-primary/50 transition-all text-sm font-medium"
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-lg transition-all ${selectedImage ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-white'}`}
                      disabled={isUploading}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </button>
                    <button 
                      type="submit"
                      disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                      className="px-4 h-full bg-primary text-black rounded-lg hover:bg-white transition-all disabled:opacity-50 font-black text-[10px] uppercase tracking-widest"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">Select Conversation</h3>
          </div>
        )}
      </div>
    </div>
  );
};
