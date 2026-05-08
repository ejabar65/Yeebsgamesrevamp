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
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { Filter } from 'bad-words';
import { Send, Trash2, MessageSquare, Shield, User, Zap, Image as ImageIcon, X, CheckCircle2, Star, Phone, Settings, Film } from 'lucide-react';
import { GifPicker } from './GifPicker';
import { ADMIN_LIST, MOD_LIST } from '../constants';

const filter = new Filter();

const RemoteAudio: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [voiceParticipants, setVoiceParticipants] = useState<any[]>([]);
  const [isCalling, setIsCalling] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreams = useRef<Map<string, MediaStream>>(new Map());
  const [remoteStreamsState, setRemoteStreamsState] = useState<number>(0); 
  const analyserRef = useRef<AnalyserNode | null>(null);

  const isOwner = user?.uid === ownerId;
  const spamLimitEnabled = settings ? settings.spamLimit : true;
  const filterEnabled = settings ? settings.filterEnabled : true;

  useEffect(() => {
    if (!groupId) return;
    
    const voiceRef = collection(db, `groups/${groupId}/voice_participants`);
    const unsubscribe = onSnapshot(voiceRef, (snapshot) => {
      setVoiceParticipants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [groupId]);

  // Speaking detection
  useEffect(() => {
    if (!localStream || !user || !groupId) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(localStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let lastSpeaking = false;
    let interval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const isSpeaking = average > 30; // Threshold

      if (isSpeaking !== lastSpeaking) {
        lastSpeaking = isSpeaking;
        updateDoc(doc(db, `groups/${groupId}/voice_participants`, user.uid), {
          isSpeaking
        }).catch(() => {});
      }
    }, 200);

    return () => {
      clearInterval(interval);
      audioContext.close();
    };
  }, [localStream, user, groupId]);

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

  const handleSendMessage = async (e: React.FormEvent, gifUrl?: string) => {
    if (e) e.preventDefault();
    if (!user) {
      alert('Please log in to chat.');
      return;
    }
    if ((!newMessage.trim() && !selectedImage && !gifUrl) || (spamCooldown && spamLimitEnabled)) return;

    if (spamLimitEnabled) {
      setSpamCooldown(true);
      setTimeout(() => setSpamCooldown(false), 2000);
    }

    try {
      const censoredText = (filterEnabled && filter.isProfane(newMessage)) ? filter.clean(newMessage) : newMessage;
      const colPath = groupId ? `groups/${groupId}/messages` : 'global_messages';

      await addDoc(collection(db, colPath), {
        text: gifUrl ? "" : censoredText,
        image: selectedImage,
        gif: gifUrl || null,
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

  const handleSelectGif = async (url: string) => {
    setShowGifPicker(false);
    await handleSendMessage(null as any, url);
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

  // Cleanup on unmount or group change
  useEffect(() => {
    return () => {
      stopVoice();
    };
  }, [groupId]);

  const stopVoice = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
    remoteStreams.current.clear();
    setIsCalling(false);
    
    if (user && groupId) {
      try {
        await deleteDoc(doc(db, `groups/${groupId}/voice_participants`, user.uid));
        // Also cleanup signaling docs if they exist
        await deleteDoc(doc(db, `groups/${groupId}/calls`, user.uid));
      } catch (e) {
        console.error("Cleanup error", e);
      }
    }
  };

  useEffect(() => {
    if (!groupId || !isCalling || !user) return;

    // Listen for other participants to establish connections
    const voiceRef = collection(db, `groups/${groupId}/voice_participants`);
    const unsubscribe = onSnapshot(voiceRef, async (snapshot) => {
      const participants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      for (const participant of participants) {
        if (participant.uid === user.uid) continue;
        
        // If we don't have a connection to this participant yet
        if (!peerConnections.current.has(participant.uid)) {
          // Rule: Higher UID initiates
          if (user.uid > participant.uid) {
            initiateCall(participant.uid);
          }
        }
      }
      
      // Cleanup stale connections
      const pUids = participants.map(p => p.uid);
      peerConnections.current.forEach((_, uid) => {
        if (!pUids.includes(uid)) {
          closeConnection(uid);
        }
      });
    });

    // Listen for incoming offers/answers/ICE candidates for ME
    const myCallRef = doc(db, `groups/${groupId}/calls`, user.uid);
    const unsubSignaling = onSnapshot(myCallRef, async (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // Handle Offers
      if (data.offers) {
        for (const [fromUid, offer] of Object.entries(data.offers)) {
          if (!peerConnections.current.has(fromUid)) {
            handleOffer(fromUid, offer as RTCSessionDescriptionInit);
          }
        }
      }

      // Handle Answers
      if (data.answers) {
        for (const [fromUid, answer] of Object.entries(data.answers)) {
          const pc = peerConnections.current.get(fromUid);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(answer as RTCSessionDescriptionInit));
          }
        }
      }

      // Handle ICE Candidates
      if (data.iceCandidates) {
        for (const [fromUid, candidates] of Object.entries(data.iceCandidates)) {
          const pc = peerConnections.current.get(fromUid);
          if (pc) {
            for (const cand of (candidates as any[])) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
          }
        }
      }
    });

    return () => {
      unsubscribe();
      unsubSignaling();
    };
  }, [groupId, isCalling, user, localStream]);

  const createPC = (remoteUid: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      remoteStreams.current.set(remoteUid, stream);
      setRemoteStreamsState(prev => prev + 1);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && user && groupId) {
        const candidateData = event.candidate.toJSON();
        const remoteCallRef = doc(db, `groups/${groupId}/calls`, remoteUid);
        updateDoc(remoteCallRef, {
          [`iceCandidates.${user.uid}`]: (window as any).firebase?.firestore?.FieldValue.arrayUnion(candidateData) || [candidateData]
        }).catch(() => {
          // If updateDoc fails because doc doesn't exist, try setDoc
          setDoc(remoteCallRef, {
            iceCandidates: { [user.uid]: [candidateData] }
          }, { merge: true });
        });
      }
    };

    peerConnections.current.set(remoteUid, pc);
    return pc;
  };

  const initiateCall = async (remoteUid: string) => {
    const pc = createPC(remoteUid);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const remoteCallRef = doc(db, `groups/${groupId}/calls`, remoteUid);
    await setDoc(remoteCallRef, {
      offers: { [user!.uid]: { type: offer.type, sdp: offer.sdp } }
    }, { merge: true });
  };

  const handleOffer = async (remoteUid: string, offer: RTCSessionDescriptionInit) => {
    const pc = createPC(remoteUid);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const remoteCallRef = doc(db, `groups/${groupId}/calls`, remoteUid);
    await setDoc(remoteCallRef, {
      answers: { [user!.uid]: { type: answer.type, sdp: answer.sdp } }
    }, { merge: true });
  };

  const closeConnection = (uid: string) => {
    const pc = peerConnections.current.get(uid);
    if (pc) {
      pc.close();
      peerConnections.current.delete(uid);
    }
    remoteStreams.current.delete(uid);
    setRemoteStreamsState(prev => prev + 1);
  };

  const toggleCall = async () => {
    if (!groupId || !user) return;
    
    try {
      const participantRef = doc(db, `groups/${groupId}/voice_participants`, user.uid);
      if (!isCalling) {
        // Start Local Stream
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
          alert("Microphone access denied or not available.");
          return;
        }
        setLocalStream(stream);

        await setDoc(participantRef, {
          uid: user.uid,
          username: user.username,
          photoURL: user.photoURL,
          joinedAt: serverTimestamp(),
          isSpeaking: false
        });
        setIsCalling(true);
      } else {
        await stopVoice();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `groups/${groupId}/voice_participants`);
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
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isCalling ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isCalling ? 'bg-white animate-pulse' : 'bg-gray-700'}`} />
                <Phone className="w-3 h-3" />
                <span className="text-[8px] font-black uppercase tracking-widest">{isCalling ? 'Disconnect' : 'Connect Voice'}</span>
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

      {/* Sync Voice Overlay */}
      <AnimatePresence>
        {(isCalling || voiceParticipants.length > 0) && groupId && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-20 right-6 z-30 w-56 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-green-500 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Sync Channel
              </span>
              <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">{voiceParticipants.length} Linked</span>
            </div>
            
            <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {voiceParticipants.map((p) => (
                <div key={p.id} className="flex items-center justify-between group/user">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={p.photoURL} className={`w-9 h-9 rounded-xl object-cover transition-all ${p.isSpeaking || p.uid === user?.uid ? 'border-2 border-green-500' : 'border border-white/10 opacity-70'}`} />
                      {(p.isSpeaking || p.uid === user?.uid) && (
                        <div className="absolute inset-0 bg-green-500/20 rounded-xl animate-ping opacity-20" />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase tracking-tight">{p.username}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3].map(i => (
                          <div 
                            key={i} 
                            className={`w-1 h-2 rounded-full transition-all duration-300 ${p.isSpeaking || p.uid === user?.uid ? 'bg-green-500' : 'bg-gray-800'}`} 
                            style={{ 
                              animation: (p.isSpeaking || p.uid === user?.uid) ? `bounce 0.8s ease-in-out infinite ${i * 0.1}s` : 'none' 
                            }} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isCalling && (
              <button 
                onClick={toggleCall}
                className="w-full py-2.5 bg-red-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/20 active:scale-95"
              >
                Terminate Link
              </button>
            )}
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
                  <div className={`w-10 h-10 rounded-xl overflow-hidden border transition-all duration-500 relative ${
                    msg.senderName === user?.username ? 'border-white/20' : 'border-white/5'
                  } ${
                    voiceParticipants.some(vp => vp.uid === msg.senderId) 
                      ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-black border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                      : ''
                  } bg-white/5`}>
                    <img 
                      src={msg.senderAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName}`} 
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                    {voiceParticipants.find(vp => vp.uid === msg.senderId)?.isSpeaking && (
                      <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                         <div className="flex gap-0.5">
                            {[1,2,3].map(i => (
                              <div 
                                key={i} 
                                className="w-0.5 h-3 bg-green-500 rounded-full animate-bounce" 
                                style={{ animationDelay: `${i * 0.1}s` }} 
                              />
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className={`flex flex-col ${msg.senderName === user?.username ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    {voiceParticipants.some(vp => vp.uid === msg.senderId) && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-[7px] font-black text-green-500 uppercase tracking-widest">Linked</span>
                      </div>
                    )}
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
                    {msg.gif && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-white/5 bg-white/5">
                        <img src={msg.gif} alt="GIF" className="max-w-full h-auto" />
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

      <AnimatePresence>
        {showGifPicker && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 right-6 left-6 z-50 h-[350px]"
          >
            <GifPicker 
              onSelect={handleSelectGif} 
              onClose={() => setShowGifPicker(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

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
                    onClick={() => setShowGifPicker(!showGifPicker)}
                    className={`p-2 rounded-lg transition-all ${showGifPicker ? 'bg-blue-500 text-white' : 'text-gray-700 hover:text-gray-400'}`}
                  >
                    <Film className="w-3.5 h-3.5" />
                  </button>
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

      {/* Hidden Audio Elements for Mesh Comms */}
      <div className="hidden">
        {Array.from(remoteStreams.current.entries()).map(([uid, stream]) => (
          <RemoteAudio key={uid} stream={stream} />
        ))}
      </div>
    </div>
  );
};
