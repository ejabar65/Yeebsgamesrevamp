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
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Filter } from 'bad-words';
import { Image as ImageIcon, Send, X, User, Bell, Film } from 'lucide-react';
import { GifPicker } from './GifPicker';

const filter = new Filter();

export const DirectMessages: React.FC = () => {
  const { user } = useGames();
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(Notification.permission);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIds = useRef<Record<string, string>>({});

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  useEffect(() => {
    if (!user || chats.length === 0) return;

    // Listen for new messages across all chats for notifications
    const unsubscribes = chats.map(chat => {
      const q = query(
        collection(db, 'chats', chat.id, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      return onSnapshot(q, (snapshot) => {
        if (snapshot.empty) return;
        const msg = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() as any };
        
        // Don't notify for own messages or first load
        if (msg.senderId !== user.username.toLowerCase()) {
          const lastId = lastMessageIds.current[chat.id];
          if (lastId && lastId !== msg.id) {
            // New message!
            if (notificationPermission === 'granted' && document.hidden) {
              const recipient = chat.participants.find((p: string) => p !== user.username.toLowerCase());
              new Notification(`New message from ${recipient}`, {
                body: msg.text || (msg.image ? '📷 Image' : '🎬 GIF'),
                icon: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + recipient
              });
            }
          }
          lastMessageIds.current[chat.id] = msg.id;
        } else {
          lastMessageIds.current[chat.id] = msg.id;
        }
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, chats, notificationPermission]);

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

  const handleSendMessage = async (e: React.FormEvent, gifUrl?: string) => {
    if (e) e.preventDefault();
    if (!user || !activeChat || (!newMessage.trim() && !selectedImage && !gifUrl)) return;

    const text = filter.isProfane(newMessage) ? filter.clean(newMessage) : newMessage;
    const msgData = {
      text: gifUrl ? "" : text,
      image: selectedImage,
      gif: gifUrl || null,
      senderId: user.username.toLowerCase(),
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), msgData);
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: gifUrl ? '🎬 GIF' : (selectedImage ? '📷 Image' : text),
        updatedAt: serverTimestamp()
      });
      setNewMessage('');
      setSelectedImage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectGif = async (url: string) => {
    setShowGifPicker(false);
    await handleSendMessage(null as any, url);
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
      <div className="flex flex-col items-center justify-center h-[600px] p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Login required for messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] bg-[#0c0c0c] overflow-hidden">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-black/20 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-white/5 space-y-4">
           <div className="flex items-center justify-between">
             <h2 className="font-bold text-lg text-white">Private Threads</h2>
             {notificationPermission !== 'granted' && (
               <button 
                 onClick={requestNotificationPermission}
                 className="p-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 group"
                 title="Enable Notifications"
               >
                 <Bell className="w-3.5 h-3.5 animate-bounce" />
                 <span className="text-[8px] font-black uppercase tracking-widest hidden group-hover:block">Notify</span>
               </button>
             )}
           </div>
           <form onSubmit={handleStartChat} className="relative group">
            <input 
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Username..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-hidden focus:border-blue-500/50 transition-all pr-16 text-white"
            />
            <button 
              type="submit" 
              disabled={isSearching}
              className="absolute right-1 top-1 bottom-1 px-3 bg-blue-500 text-white rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-30"
            >
              {isSearching ? '...' : 'Open'}
            </button>
          </form>
        </div>
        
        <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
          {chats.map((chat, i) => {
            const recipient = chat.participants.find((p: string) => p !== user.username.toLowerCase());
            const isActive = activeChat?.id === chat.id;
            return (
              <button
                key={`${chat.id}-${i}`}
                onClick={() => setActiveChat(chat)}
                className={`w-full p-4 flex items-center gap-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${isActive ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-500'}`}>
                  {recipient?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-sm truncate ${isActive ? 'text-blue-500' : 'text-gray-300'}`}>{recipient}</span>
                  </div>
                  <p className={`text-[10px] truncate font-medium ${isActive ? 'text-blue-500/60' : 'text-gray-500'}`}>{chat.lastMessage}</p>
                </div>
              </button>
            );
          })}
          {chats.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <User className="w-8 h-8 opacity-5 text-white" />
              <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">No Active Chats</p>
            </div>
          )}
        </div>
      </div>

      {/* Main: Chat Window */}
      <div className={`flex-1 flex flex-col bg-black/10 relative ${!activeChat ? 'hidden md:flex items-center justify-center p-8' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md relative z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveChat(null)} 
                  className="md:hidden p-2 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-lg">
                    {activeChat.participants.find((p: string) => p !== user.username.toLowerCase())?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <Link 
                      to={`/profile/${activeChat.participants.find((p: string) => p !== user.username.toLowerCase())}`}
                      className="font-bold text-white hover:text-blue-400 transition-colors"
                    >
                      {activeChat.participants.find((p: string) => p !== user.username.toLowerCase())}
                    </Link>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5">Secure Channel</p>
                  </div>
                </div>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-10"
            >
              <AnimatePresence>
                {messages.map((msg, i) => {
                  const isOwn = msg.senderId === user.username.toLowerCase();
                  return (
                    <motion.div 
                      key={`${msg.id}-${i}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-lg relative ${isOwn ? 'bg-blue-500 text-white font-medium rounded-tr-none' : 'bg-white/5 text-gray-200 border border-white/10 rounded-tl-none'}`}>
                        {msg.image && (
                           <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                              <img src={msg.image} alt="Upload" className="max-w-full h-auto" />
                           </div>
                        )}
                        {msg.gif && (
                           <div className="mb-2 rounded-xl overflow-hidden border border-black/20">
                              <img src={msg.gif} alt="GIF" className="max-w-full h-auto" />
                           </div>
                        )}
                        <p>{msg.text}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/5 relative z-10">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

            <AnimatePresence>
                {showGifPicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-20 right-4 left-4 z-50 h-[300px]"
                  >
                    <GifPicker 
                      onSelect={handleSelectGif} 
                      onClose={() => setShowGifPicker(false)} 
                    />
                  </motion.div>
                )}
                {selectedImage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative inline-block mb-4"
                  >
                    <img src={selectedImage} alt="Selected" className="w-20 h-20 object-cover rounded-xl border-2 border-blue-500 shadow-xl" />
                    <button 
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg"
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
                    placeholder={selectedImage ? "Add description..." : "Type a message..."}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-blue-500/50 transition-all text-white placeholder:text-gray-600"
                  />
                  <div className="absolute right-2 top-1.5 bottom-1.5 flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowGifPicker(!showGifPicker)}
                      className={`p-2 rounded-lg transition-all ${showGifPicker ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                      <Film className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-2 rounded-lg transition-all ${selectedImage ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-blue-500'}`}
                      disabled={isUploading}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button 
                      type="submit"
                      disabled={(!newMessage.trim() && !selectedImage) || isUploading}
                      className="px-6 h-full bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-30 font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center opacity-10">
            <h3 className="font-bold text-3xl text-white uppercase tracking-widest mb-2">Select a Thread</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Connect with verified users</p>
          </div>
        )}
      </div>
    </div>
  );
};
