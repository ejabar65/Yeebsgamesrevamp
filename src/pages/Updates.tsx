import React from 'react';
import { motion } from 'motion/react';
import { Zap, Bell, Calendar, ChevronRight } from 'lucide-react';

const UPDATES = [
  {
    version: "v2.4.0",
    date: "May 06, 2026",
    title: "The Expansion Protocol",
    description: "Deployment of new system branches including Tutorials, Reviews, and Legal frameworks. Enhanced mascot interactive field.",
    tags: ["New Features", "Security"]
  },
  {
    version: "v2.3.2",
    date: "May 02, 2026",
    title: "Cinema Sync Patch",
    description: "Optimization of the movie player proxy to support continuous high-bandwidth streams and localized progress tracking.",
    tags: ["Optimization", "Bug Fix"]
  },
  {
    version: "v2.2.0",
    date: "April 28, 2026",
    title: "OS Shell Architecture",
    description: "Finalization of the main application shell and navigation logic. Implementation of the minimalist Swiss aesthetic.",
    tags: ["Core", "UI/UX"]
  }
];

export default function Updates() {
  return (
    <div className="space-y-16 py-12 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="space-y-6">
          <h1 className="text-6xl font-bold tracking-tighter text-white">System <span className="text-blue-500">Updates</span></h1>
          <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-xl">
            Real-time changelog of system modifications, environmental patches, and new feature deployments.
          </p>
        </div>
        <div className="hidden md:flex w-24 h-24 rounded-full border border-blue-500/20 items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border border-blue-500/10 animate-ping" />
          <Bell className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="space-y-12">
        {UPDATES.map((update, i) => (
          <motion.div
            key={update.version}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative pl-12 md:pl-20 group"
          >
            {/* Timeline Line */}
            {i !== UPDATES.length - 1 && (
              <div className="absolute left-[23px] md:left-[39px] top-12 bottom-0 w-[1px] bg-white/5" />
            )}
            
            {/* Logic Node */}
            <div className="absolute left-0 top-2 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center">
              <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10" />
              <div className="absolute inset-0 rounded-full border border-white/5 bg-black/40 backdrop-blur-sm group-hover:border-blue-500/20 transition-all duration-500" />
            </div>

            <div className="card-subtle p-8 md:p-10 space-y-6 group-hover:border-blue-500/20 transition-all duration-500">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black tracking-tighter text-white">{update.version}</span>
                  <div className="flex gap-2">
                    {update.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {update.date}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{update.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  {update.description}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-blue-500/60 group-hover:text-blue-500 cursor-pointer">
                View Documentation <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-12 rounded-[3rem] bg-linear-to-br from-blue-500/10 via-transparent to-transparent border border-white/5 space-y-6 text-center">
        < Zap className="w-12 h-12 text-blue-500 mx-auto" />
        <h2 className="text-3xl font-black text-white tracking-tighter">Automatic Synchronization</h2>
        <p className="text-gray-500 max-w-lg mx-auto font-medium">
          Your client will automatically pull the latest patches from the main branch. 
          No manual intervention is required for security updates.
        </p>
      </div>
    </div>
  );
}
