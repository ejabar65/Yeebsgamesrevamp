import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Shield, CheckCircle2 } from 'lucide-react';

const ADMIN_LIST = ['yeebs'];
const MOD_LIST = ['admin', 'moderator', 'mod'];

const INITIAL_REVIEWS = [
  {
    id: '1',
    user: 'CyberPhantom',
    rating: 5,
    text: "The interface is incredibly clean. Finally a site that doesn't feel like it's screaming at me. Performance is top-tier.",
    date: '2 hours ago',
    isAdmin: false,
    isMod: false
  },
  {
    id: '2',
    user: 'Yeebs',
    rating: 5,
    text: "Welcome to the grid. We're constantly optimizing every byte to ensure your experience remains uninterrupted and private.",
    date: '5 hours ago',
    isAdmin: true,
    isMod: false
  },
  {
    id: '3',
    user: 'NocturnalDev',
    rating: 4,
    text: "Love the movie player integration. The progress tracking works exactly as advertised across different devices.",
    date: 'Yesterday',
    isAdmin: false,
    isMod: false
  },
  {
    id: '4',
    user: 'ModZero',
    rating: 5,
    text: "System infrastructure is holding steady. Security protocols are optimal.",
    date: '1 day ago',
    isAdmin: false,
    isMod: true
  }
];

export default function Reviews() {
  const [reviews, setReviews] = useState(INITIAL_REVIEWS);
  const [newReview, setNewReview] = useState('');
  const [rating, setRating] = useState(5);
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.trim() || !username.trim()) return;

    const isAdmin = ADMIN_LIST.includes(username.toLowerCase());
    const isMod = MOD_LIST.includes(username.toLowerCase());
    const review = {
      id: Date.now().toString(),
      user: username,
      rating,
      text: newReview,
      date: 'Just now',
      isAdmin,
      isMod
    };

    setReviews([review, ...reviews]);
    setNewReview('');
  };

  return (
    <div className="space-y-20 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="max-w-2xl">
          <h1 className="text-6xl font-bold tracking-tighter text-white mb-6">Feedback <span className="text-blue-500">Wall</span></h1>
          <p className="text-gray-500 text-lg font-medium leading-relaxed">
            Public transmission log of user experiences. All feedback is analyzed to improve the integrity of our systems.
          </p>
        </div>
        
        <div className="flex items-center gap-6 px-8 py-4 rounded-3xl bg-white/[0.02] border border-white/5">
          <div className="text-center">
            <p className="text-3xl font-black text-white">4.9</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Average Rating</p>
          </div>
          <div className="w-[1px] h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-3xl font-black text-white">1.2k</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Total Reports</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Review Form */}
        <div className="lg:col-span-1 space-y-8">
          <div className="card-subtle p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Submit Report
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Identity</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Your Alias"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">System Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${rating >= s ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-600'}`}
                    >
                      <Star className={`w-4 h-4 ${rating >= s ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Transmission</label>
                <textarea 
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                  placeholder="Log your experience..."
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none"
                />
              </div>

              <button className="w-full py-5 rounded-2xl bg-blue-500 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 active:scale-95">
                Broadcast Report
              </button>
            </form>
          </div>

          <div className="p-8 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Authenticated Reviews</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">All reports are filtered through our verification protocol. Verified identities receive priority placement on the wall.</p>
            </div>
          </div>
        </div>

        {/* Review Wall */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`card-subtle p-8 flex flex-col gap-6 relative overflow-hidden group ${review.isAdmin ? 'border-blue-500/20 bg-blue-500/[0.02]' : review.isMod ? 'border-yellow-500/20 bg-yellow-500/[0.02]' : ''}`}
              >
                {review.isAdmin && (
                  <div className="absolute top-0 right-0 p-3 bg-blue-500/10 rounded-bl-3xl border-l border-b border-blue-500/20 flex items-center gap-2">
                    <Shield className="w-3 h-3 text-blue-500" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-500">System Administrator</span>
                  </div>
                )}

                {review.isMod && (
                  <div className="absolute top-0 right-0 p-3 bg-yellow-500/10 rounded-bl-3xl border-l border-b border-yellow-500/20 flex items-center gap-2">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-yellow-500">System Moderator</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black uppercase tracking-tighter ${review.isAdmin ? 'bg-blue-500 text-white' : review.isMod ? 'bg-yellow-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                      {review.user[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white tracking-tight">{review.user}</h4>
                        {review.isAdmin && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                        {review.isMod && <CheckCircle2 className="w-3 h-3 text-yellow-500" />}
                      </div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-blue-500/60">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`w-3 h-3 ${idx < review.rating ? 'fill-current text-blue-500' : 'text-gray-800'}`} />
                    ))}
                  </div>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                  {review.text}
                </p>

                <div className="flex items-center gap-6 mt-2">
                  <button className="text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:text-blue-500 transition-colors">Helpful</button>
                  <button className="text-[9px] font-bold uppercase tracking-widest text-gray-600 hover:text-red-500 transition-colors">Report</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
