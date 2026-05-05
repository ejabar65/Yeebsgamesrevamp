import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, Shield, Search, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProxyBrowser() {
  const [url, setUrl] = useState('');
  const [activeUrl, setActiveUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigateToUrl = (targetUrl: string) => {
    if (!targetUrl) return;
    
    let formattedUrl = targetUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      if (formattedUrl.includes('.') && !formattedUrl.includes(' ')) {
        formattedUrl = 'https://' + formattedUrl;
      } else {
        formattedUrl = `https://www.google.com/search?q=${encodeURIComponent(formattedUrl)}`;
      }
    }

    setIsLoading(true);
    // @ts-ignore
    const finalUrl = window.__uv$config.prefix + window.Ultraviolet.codec.xor.encode(formattedUrl);
    setActiveUrl(finalUrl);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(url);
  };

  const reload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const goHome = () => {
    navigateToUrl('https://www.google.com');
  };

  useEffect(() => {
    // Check if UV is loaded
    // @ts-ignore
    if (!window.__uv$config) {
      console.error('Ultraviolet config not found');
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white">
      {/* Header / URL Bar */}
      <div className="p-4 border-b border-white/5 bg-[#111] flex items-center gap-4">
        <Link to="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        
        <div className="flex items-center gap-2 mr-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={() => window.history.forward()} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 disabled:opacity-30">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={reload} className="p-2 hover:bg-white/5 rounded-xl text-gray-400">
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Shield className={`w-4 h-4 ${isLoading ? 'text-primary animate-pulse' : 'text-gray-500'}`} />
          </div>
          <input 
            type="text" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Search or enter web address"
            className="w-full bg-[#1a1a1a] border border-white/5 rounded-2xl py-2.5 pl-12 pr-4 text-sm font-medium focus:border-primary/50 outline-hidden transition-all"
          />
          <button type="submit" className="absolute right-3 top-1.5 bottom-1.5 px-3 bg-primary text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">
            GO
          </button>
        </form>

        <div className="flex items-center gap-2">
           <button onClick={goHome} className="p-2 hover:bg-white/5 rounded-xl text-gray-400">
              <Globe className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative bg-white">
        {!activeUrl ? (
          <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center p-8">
            <div className="max-w-xl w-full text-center space-y-12">
               <motion.div
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="flex flex-col items-center gap-6"
               >
                 <div className="w-24 h-24 rounded-[32px] bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(250,204,21,0.2)]">
                   <Globe className="w-12 h-12 text-black" />
                 </div>
                 <div>
                   <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Web Access</h2>
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Ultraviolet Proxy Engine v2.0</p>
                 </div>
               </motion.div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[
                   { name: 'Google', url: 'https://www.google.com', color: 'bg-blue-500' },
                   { name: 'YouTube', url: 'https://www.youtube.com', color: 'bg-red-500' },
                   { name: 'Discord', url: 'https://discord.com', color: 'bg-indigo-500' },
                   { name: 'Tiktok', url: 'https://www.tiktok.com', color: 'bg-pink-500' },
                 ].map((site) => (
                   <button
                     key={site.name}
                     onClick={() => { setUrl(site.url); navigateToUrl(site.url); }}
                     className="p-6 rounded-3xl bg-[#111] border border-white/5 hover:border-primary/50 transition-all group"
                   >
                     <div className={`w-10 h-10 rounded-xl ${site.color} mb-3 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <ExternalLink className="w-5 h-5 text-white" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white">{site.name}</span>
                   </button>
                 ))}
               </div>

               <p className="text-[9px] font-medium text-gray-600 uppercase tracking-widest">
                 Encrypted via AES-CBC • Secure Transmission Protocol Active
               </p>
            </div>
          </div>
        ) : (
          <iframe 
            ref={iframeRef}
            src={activeUrl}
            className="w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
          />
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#111] border-t border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Proxy Active</span>
          </div>
          <span className="text-[8px] font-mono text-gray-700">{activeUrl || 'Disconnected'}</span>
        </div>
        <div className="text-[8px] font-black uppercase tracking-widest text-gray-600">
          Yeebsgames Security Layer • Ultraviolet
        </div>
      </div>
    </div>
  );
}
