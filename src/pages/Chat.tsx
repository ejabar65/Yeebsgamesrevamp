import React, { useState } from 'react';
import { ChatRoom } from '../components/ChatRoom';
import { DirectMessages } from '../components/DirectMessages';
import { motion } from 'motion/react';
import { MessageSquare, Users, Star, Shield, Zap } from 'lucide-react';

const Chat: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'dm'>('global');

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2 italic">
              COMMUNICATION <span className="text-primary">HUB</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-widest">Connect with other survivors in the grid</p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'global' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <MessageSquare className="w-4 h-4" />
              GLOBAL ROOM
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'dm' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Users className="w-4 h-4" />
              DIRECT MESSAGES
            </button>
          </div>
        </header>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'global' ? <ChatRoom /> : <DirectMessages />}
        </motion.div>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <Shield className="w-6 h-6 text-primary mb-4" />
            <h4 className="font-bold text-sm mb-2 uppercase italic tracking-tight">Spam Shield</h4>
            <p className="text-gray-500 text-xs">Rate limiting and automated filters are active to maintain transmission quality.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <Star className="w-6 h-6 text-primary mb-4" />
            <h4 className="font-bold text-sm mb-2 uppercase italic tracking-tight">Make Friends</h4>
            <p className="text-gray-500 text-xs">Click the "Start chat" button in DMs to establish a private line with any user.</p>
          </div>
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
            <Zap className="w-6 h-6 text-primary mb-4" />
            <h4 className="font-bold text-sm mb-2 uppercase italic tracking-tight">Secure Comms</h4>
            <p className="text-gray-500 text-xs">All private messages are encrypted in transit and stored securely on the grid.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Chat;
