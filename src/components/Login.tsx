import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap } from 'lucide-react';
import { useGames } from '../context/GameContext';

interface LoginProps {
  onSuccess?: () => void;
  inline?: boolean;
}

export default function Login({ onSuccess, inline = false }: LoginProps) {
  const { login } = useGames();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await login(username, password);
      if (success) {
        onSuccess?.();
      } else {
        setError('Verification failed. Adjust frequency.');
      }
    } catch (err) {
      setError('System interference detected.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerClasses = inline 
    ? "w-full max-w-sm space-y-8" 
    : "w-full max-w-sm glass rounded-[32px] border border-white/10 p-8 relative z-10 shadow-2xl overflow-hidden bg-[#111]";

  return (
    <div className={containerClasses}>
      {!inline && <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />}
      
      <div className="flex flex-col items-center mb-8">
         <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Zap className="w-8 h-8 text-black" />
         </div>
         <h2 className="text-2xl font-black uppercase tracking-tighter text-white">System Access</h2>
         <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Identity verification required</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
         <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-gray-400">Frequency ID</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary outline-hidden transition-all text-sm font-mono text-white"
            />
         </div>
         <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 text-gray-400">Access Token</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:border-primary outline-hidden transition-all text-sm font-mono text-white"
            />
         </div>

         {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-black text-red-500 uppercase text-center"
            >
               {error}
            </motion.p>
         )}

         <button 
           type="submit"
           disabled={isSubmitting}
           className="w-full py-5 rounded-2xl bg-primary text-black font-black uppercase tracking-[0.2em] hover:bg-white transition-all shadow-lg active:scale-95 disabled:opacity-50 mt-4 h-15 flex items-center justify-center"
         >
           {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
           ) : (
              'Establish Link'
           )}
         </button>
      </form>

      <p className="text-[9px] text-gray-600 text-center mt-8 uppercase font-black tracking-widest">
         New users will be registered automatically
      </p>
    </div>
  );
}
