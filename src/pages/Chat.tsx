import React, { useState } from 'react';
import { ChatRoom } from '../components/ChatRoom';
import { DirectMessages } from '../components/DirectMessages';
import { motion } from 'motion/react';
import { MessageSquare, Users, Star, Shield, Zap } from 'lucide-react';

const Chat: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'dm'>('global');

  return (
    <div className="flex flex-col gap-12 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
            Messages.
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('global')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'global' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Global Chat
            </button>
            <button
              onClick={() => setActiveTab('dm')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'dm' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}
            >
              <Users className="w-3.5 h-3.5" />
              Direct Messages
            </button>
          </div>
        </div>
      </header>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-subtle bg-[#0c0c0c] border-white/10 overflow-hidden min-h-[600px] flex flex-col"
      >
        {activeTab === 'global' ? <ChatRoom /> : <DirectMessages />}
      </motion.div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-subtle p-6 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Encryption Protocol</h4>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">End-to-end encryption is active for all peer-to-peer transmissions within the network.</p>
          </div>
        </div>
        <div className="card-subtle p-6 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
             <Star className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Network Expansion</h4>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">Establish private channels with verified users using the DM interface.</p>
          </div>
        </div>
        <div className="card-subtle p-6 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
             <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Live Connection</h4>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">Real-time message propagation optimized for low-latency synchronization.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Chat;
