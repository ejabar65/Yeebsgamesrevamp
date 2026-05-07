import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Code, Globe, Terminal, X } from 'lucide-react';

const TUTORIALS = [
  {
    title: "Mastering Modern Web Architecture",
    duration: "15:20",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
    embedId: "SqcY0GlQWvY",
    category: "Development",
    desc: "A deep dive into high-performance web structures and scalable systems."
  },
  {
    title: "TypeScript Integration Patterns",
    duration: "24:45",
    thumbnail: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&q=80&w=800",
    embedId: "zQnBQ4tB3ZA",
    category: "Coding",
    desc: "Advanced type safety and architectural patterns for complex applications."
  },
  {
    title: "Cloud Deployment Protocols",
    duration: "12:10",
    thumbnail: "https://images.unsplash.com/photo-1451187530220-4e2b1d496ad4?auto=format&fit=crop&q=80&w=800",
    embedId: "2-777T_zX-E",
    category: "Infrastructure",
    desc: "Seamless synchronization between local development and cloud nodes."
  },
  {
    title: "Minimalist Interface Design",
    duration: "18:30",
    thumbnail: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=80&w=800",
    embedId: "hQ1-3In77W4",
    category: "Design",
    desc: "The philosophy of the Swiss style and its application in modern digital spaces."
  },
  {
    title: "Real-time Communication Systems",
    duration: "21:15",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
    embedId: "p66Xv3T5mIs",
    category: "Network",
    desc: "Building low-latency transmission channels for global synchronization."
  }
];

export default function Tutorials() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <div className="space-y-16 py-12">
      <div className="max-w-2xl">
        <h1 className="text-6xl font-bold tracking-tighter text-white mb-6">Execution <span className="text-blue-500">Knowledge</span></h1>
        <p className="text-gray-500 text-lg font-medium leading-relaxed">
          Technical briefings on development, deployment, and digital craftsmanship. 
          Everything you need to manifest your own digital architecture.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {TUTORIALS.map((video, i) => (
          <motion.div
            key={video.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedVideo(video.embedId)}
            className="group relative flex flex-col gap-6 cursor-pointer"
          >
            <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 bg-white/[0.02]">
              <img 
                src={video.thumbnail} 
                className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-700 group-hover:scale-105" 
                alt=""
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                  <Play className="w-6 h-4 text-white ml-1" />
                </div>
              </div>
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-blue-400">
                  {video.category}
                </span>
              </div>
              <div className="absolute bottom-6 right-6 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-400">
                {video.duration}
              </div>
            </div>

            <div className="px-2">
              <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors duration-300">{video.title}</h3>
              <p className="text-gray-500 text-sm mt-2 font-medium leading-relaxed">{video.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/50 hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <iframe 
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                className="w-full h-full border-none"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="card-subtle p-12 flex flex-col md:flex-row items-center gap-12 mt-24">
        <div className="w-20 h-20 rounded-[2rem] bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
          <Code className="w-8 h-8" />
        </div>
        <div className="flex-1 space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">Need a custom technical briefing?</h2>
          <p className="text-gray-500">Submit a request to the operations team for specific documentation or video training.</p>
        </div>
        <button className="px-8 py-4 rounded-2xl bg-blue-500 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-500/20 active:scale-95">
          Request Briefing
        </button>
      </div>
    </div>
  );
}
