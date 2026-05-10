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
  limit,
  deleteDoc
} from 'firebase/firestore';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Filter } from 'bad-words';
import { Image as ImageIcon, Send, X, User, Bell, Film, Phone, Video, VideoOff, Mic, MicOff } from 'lucide-react';
import { GifPicker } from './GifPicker';

const filter = new Filter();

const RemoteStream: React.FC<{ stream: MediaStream; username: string }> = ({ stream, username }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = stream.getVideoTracks().length > 0;
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!hasVideo) return <audio ref={videoRef as any} autoPlay playsInline />;

  return (
    <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-white/10 group">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[8px] font-black text-white uppercase tracking-widest transition-opacity group-hover:opacity-100 opacity-60">
        {username}
      </div>
    </div>
  );
};

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
  const [isCalling, setIsCalling] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [participants, setParticipants] = useState<any[]>([]);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
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

  useEffect(() => {
    if (!activeChat || !user) return;
    
    const participantsRef = collection(db, 'chats', activeChat.id, 'call_participants');
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      setParticipants(p);
    });

    return () => unsubscribe();
  }, [activeChat, user]);

  useEffect(() => {
    if (!activeChat || !isCalling || !user) return;

    // Listen for signaling
    const myCallRef = doc(db, 'chats', activeChat.id, 'calls', user.username.toLowerCase());
    const unsubSignaling = onSnapshot(myCallRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      if (data.offers) {
        for (const [fromId, offer] of Object.entries(data.offers)) {
          if (!peerConnections.current.has(fromId)) {
            handleOffer(fromId, offer as RTCSessionDescriptionInit);
          }
        }
      }

      if (data.answers) {
        for (const [fromId, answer] of Object.entries(data.answers)) {
          const pc = peerConnections.current.get(fromId);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer as RTCSessionDescriptionInit));
          }
        }
      }

      if (data.iceCandidates) {
        for (const [fromId, candidates] of Object.entries(data.iceCandidates)) {
          const pc = peerConnections.current.get(fromId);
          if (pc) {
            for (const cand of (candidates as any[])) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(console.error);
            }
          }
        }
      }
    });

    // Check for other participants to initiate
    const participantsRef = collection(db, 'chats', activeChat.id, 'call_participants');
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      p.forEach(participant => {
        if (participant.id !== user.username.toLowerCase() && !peerConnections.current.has(participant.id)) {
          // Higher ID initiates
          if (user.username.toLowerCase() > participant.id) {
            initiateCall(participant.id);
          }
        }
      });
    });

    return () => {
      unsubSignaling();
      unsubParticipants();
    };
  }, [activeChat, isCalling, user, localStream]);

  const createPC = (remoteId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => {
        const next = new Map(prev);
        next.set(remoteId, event.streams[0]);
        return next;
      });
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && user && activeChat) {
        const candidateData = event.candidate.toJSON();
        const remoteCallRef = doc(db, 'chats', activeChat.id, 'calls', remoteId);
        updateDoc(remoteCallRef, {
          [`iceCandidates.${user.username.toLowerCase()}`]: (window as any).firebase?.firestore?.FieldValue.arrayUnion(candidateData) || [candidateData]
        }).catch(() => {
          setDoc(remoteCallRef, {
            iceCandidates: { [user.username.toLowerCase()]: [candidateData] }
          }, { merge: true });
        });
      }
    };

    peerConnections.current.set(remoteId, pc);
    return pc;
  };

  const initiateCall = async (remoteId: string) => {
    const pc = createPC(remoteId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const remoteCallRef = doc(db, 'chats', activeChat.id, 'calls', remoteId);
    await setDoc(remoteCallRef, {
      offers: { [user!.username.toLowerCase()]: { type: offer.type, sdp: offer.sdp } }
    }, { merge: true });
  };

  const handleOffer = async (remoteId: string, offer: RTCSessionDescriptionInit) => {
    const pc = createPC(remoteId);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const remoteCallRef = doc(db, 'chats', activeChat.id, 'calls', remoteId);
    await setDoc(remoteCallRef, {
      answers: { [user!.username.toLowerCase()]: { type: answer.type, sdp: answer.sdp } }
    }, { merge: true });
  };

  const stopCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    setRemoteStreams(new Map());
    setIsCalling(false);
    setIsVideoEnabled(false);

    if (user && activeChat) {
      try {
        await deleteDoc(doc(db, 'chats', activeChat.id, 'call_participants', user.username.toLowerCase()));
        await deleteDoc(doc(db, 'chats', activeChat.id, 'calls', user.username.toLowerCase()));
      } catch (e) {}
    }
  };

  const toggleCall = async (withVideo = false) => {
    if (!activeChat || !user) return;

    if (isCalling) {
      await stopCall();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo ? { width: 1280, height: 720 } : false
      });
      setLocalStream(stream);
      setIsVideoEnabled(withVideo);
      setIsCalling(true);

      const participantRef = doc(db, 'chats', activeChat.id, 'call_participants', user.username.toLowerCase());
      await setDoc(participantRef, {
        username: user.username,
        photoURL: user.photoURL,
        videoEnabled: withVideo,
        joinedAt: serverTimestamp()
      });
    } catch (e) {
      alert("Media access denied.");
    }
  };

  const toggleVideo = async () => {
    if (!localStream) return;

    if (isVideoEnabled) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
        localStream.removeTrack(videoTrack);
      }
      setIsVideoEnabled(false);
      if (user && activeChat) {
        await updateDoc(doc(db, 'chats', activeChat.id, 'call_participants', user.username.toLowerCase()), {
          videoEnabled: false
        });
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        const videoTrack = stream.getVideoTracks()[0];
        localStream.addTrack(videoTrack);
        
        peerConnections.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            pc.addTrack(videoTrack, localStream);
          }
        });

        setIsVideoEnabled(true);
        if (user && activeChat) {
          await updateDoc(doc(db, 'chats', activeChat.id, 'call_participants', user.username.toLowerCase()), {
            videoEnabled: true
          });
        }
      } catch (e) {
        alert("Camera access denied.");
      }
    }
  };
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
        <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Please log in to use direct messages.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] md:h-[600px] bg-[#0c0c0c] overflow-hidden flex-col md:flex-row">
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-black/20 ${activeChat ? 'hidden md:flex' : 'flex flex-1'}`}>
        <div className="p-4 md:p-6 border-b border-white/5 space-y-4">
           <div className="flex items-center justify-between">
             <h2 className="font-bold text-lg text-white">Direct Messages</h2>
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
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md relative z-10 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <button 
                  onClick={() => setActiveChat(null)} 
                  className="md:hidden p-2 text-gray-500 hover:text-white shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-sm md:text-lg shrink-0">
                    {activeChat.participants.find((p: string) => p !== user.username.toLowerCase())?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <Link 
                      to={`/profile/${activeChat.participants.find((p: string) => p !== user.username.toLowerCase())}`}
                      className="font-bold text-sm md:text-base text-white hover:text-blue-400 transition-colors truncate block"
                    >
                      {activeChat.participants.find((p: string) => p !== user.username.toLowerCase())}
                    </Link>
                    <p className="text-[8px] md:text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5 truncate">Private Chat</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                   <button 
                     onClick={() => toggleCall(false)}
                     className={`p-2 rounded-md transition-all ${isCalling && !isVideoEnabled ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-white'}`}
                   >
                     <Phone className="w-3.5 h-3.5" />
                   </button>
                   <button 
                     onClick={() => isCalling ? toggleVideo() : toggleCall(true)}
                     className={`p-2 rounded-md transition-all ${isCalling && isVideoEnabled ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white'}`}
                   >
                     <Video className="w-3.5 h-3.5" />
                   </button>
                </div>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-10"
            >
              {/* FaceTime UI Overlay */}
              <AnimatePresence>
                {(isCalling || participants.length > 1) && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`absolute inset-x-6 top-6 z-20 transition-all duration-500 ${isVideoEnabled || participants.some(p => p.videoEnabled) ? 'h-2/3' : 'h-24'}`}
                  >
                    <div className="w-full h-full bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 shadow-2xl flex flex-col gap-4 overflow-hidden">
                       <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                {isVideoEnabled || participants.some(p => p.videoEnabled) ? 'FaceTime Call' : 'Voice Call'}
                             </span>
                          </div>
                          <div className="flex items-center gap-4">
                             <button onClick={toggleVideo} className={`p-2 rounded-xl transition-all ${isVideoEnabled ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}>
                                {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                             </button>
                             <button onClick={stopCall} className="px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">
                                End
                             </button>
                          </div>
                       </div>

                       <div className={`flex-1 overflow-hidden grid gap-4 ${isVideoEnabled || participants.some(p => p.videoEnabled) ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'}`}>
                          {/* Local Stream */}
                          {isVideoEnabled && localStream && (
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-blue-500/50 group">
                              <video 
                                autoPlay 
                                muted 
                                playsInline 
                                ref={(el) => { if (el) el.srcObject = localStream; }} 
                                className="w-full h-full object-cover scale-x-[-1]" 
                              />
                            </div>
                          )}

                          {/* Remote Streams */}
                          {Array.from(remoteStreams.entries()).map(([id, stream]) => (
                            <RemoteStream key={id} stream={stream} username={id} />
                          ))}

                          {/* Voice mode simple avatars */}
                          {!(isVideoEnabled || participants.some(p => p.videoEnabled)) && participants.map(p => (
                             <div key={p.id} className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/5">
                                <img src={p.photoURL} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                                <div>
                                   <p className="text-[10px] font-bold text-white uppercase">{p.username}</p>
                                   <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">In Call</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
                    placeholder={selectedImage ? "Add a caption..." : "Type a message..."}
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
            <h3 className="font-bold text-3xl text-white uppercase tracking-widest mb-2">Select a Chat</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Start a conversation with anyone.</p>
          </div>
        )}
      </div>

      {/* Hidden Audio/Video for Comms */}
      <div className="hidden">
        {Array.from(remoteStreams.entries()).map(([id, stream]) => (
          <RemoteStream key={id} stream={stream} username={id} />
        ))}
      </div>
    </div>
  );
};
