import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, Shield, Zap, RotateCcw, Share2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Proxy() {
  const [url, setUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Register SW on mount
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/uv/sw.js', {
        scope: '/uv/service/'
      }).then(() => {
        console.log('UV Service Worker registered');
      }).catch(err => {
        console.error('UV Service Worker registration failed:', err);
      });
    }
  }, []);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Check if configuration is loaded
    // @ts-ignore
    if (typeof Ultraviolet === 'undefined' || !window.__uv$config) {
      console.error('Ultraviolet is not loaded yet');
      return;
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
        targetUrl = 'https://' + targetUrl;
      } else {
        targetUrl = 'https://www.google.com/search?q=' + encodeURIComponent(targetUrl);
      }
    }

    setLoading(true);
    // @ts-ignore
    const encoded = window.__uv$config.encodeUrl(targetUrl);
    setProxyUrl(`/uv/service/${encoded}`);
  };

  const handleReload = () => {
    if (iframeRef.current) {
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        iframeRef.current!.src = currentSrc;
      }, 10);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 flex flex-col items-center">
      <div className="w-full max-w-6xl flex flex-col h-[calc(100vh-12rem)]">
        {!proxyUrl ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center gap-8"
          >
            <div className="space-y-4">
              <h1 className="text-5xl font-display font-black tracking-tight uppercase italic flex items-center justify-center gap-4">
                <Shield className="w-12 h-12 text-primary" />
                Ultra<span className="text-primary">Proxy</span>
              </h1>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
                Experience the web without boundaries. Secure, fast, and completely anonymous browsing powered by Ultraviolet.
              </p>
            </div>

            <form onSubmit={handleGo} className="w-full max-w-2xl group relative">
              <div className="absolute -inset-1 bg-linear-to-r from-primary to-orange-500 rounded-2xl blur-sm opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative glass flex items-center p-2 rounded-2xl border border-white/10 group-focus-within:border-primary/50 transition-all shadow-2xl">
                <div className="pl-4 text-gray-500">
                  <Globe className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL or search the web..."
                  className="w-full bg-transparent border-none focus:ring-0 px-4 py-3 text-lg font-medium placeholder:text-gray-600"
                />
                <button
                  type="submit"
                  className="p-3 bg-primary text-dark-surface rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                  <Search className="w-6 h-6" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-6 mt-4">
              {[
                { name: 'Google', url: 'google.com' },
                { name: 'YouTube', url: 'youtube.com' },
                { name: 'Discord', url: 'discord.com' },
                { name: 'Reddit', url: 'reddit.com' },
              ].map((site) => (
                <button
                  key={site.name}
                  onClick={() => { setUrl(site.url); handleGo({ preventDefault: () => {} } as any); }}
                  className="px-4 py-2 rounded-xl glass border border-white/5 text-sm font-bold text-gray-400 hover:text-white hover:border-primary/30 transition-all flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  {site.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
              {[
                { icon: Shield, title: 'Encrypted', text: 'End-to-end traffic encryption' },
                { icon: Zap, title: 'Ultra Fast', text: 'Optimized proxy protocol' },
                { icon: Globe, title: 'Global', text: 'Access anything from anywhere' },
              ].map((feature, i) => (
                <div key={i} className="p-6 rounded-2xl glass border border-white/5 space-y-2">
                  <feature.icon className="w-6 h-6 text-primary mb-2" />
                  <h3 className="font-bold uppercase tracking-tighter italic text-white">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col glass rounded-3xl overflow-hidden border border-white/10"
          >
            {/* Browser Header */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3 flex-1 max-w-xl">
                 <button 
                  onClick={() => setProxyUrl(null)}
                  className="p-2 hover:bg-white/5 rounded-lg text-gray-400"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="flex-1 bg-black/40 rounded-lg px-3 py-1.5 border border-white/5 flex items-center gap-2">
                   <Shield className="w-3.5 h-3.5 text-green-500" />
                   <span className="text-xs text-gray-400 truncate">{url}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button onClick={handleReload} className="p-2 hover:bg-white/5 rounded-lg text-gray-400" title="Reload">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={() => window.open(proxyUrl, '_blank')} className="p-2 hover:bg-white/5 rounded-lg text-gray-400" title="Open in new tab">
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={() => setProxyUrl(null)} className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500 hover:text-white transition-all">
                  EXIT
                </button>
              </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 relative bg-white">
              {loading && (
                <div className="absolute inset-0 z-10 bg-dark-surface flex flex-col items-center justify-center gap-4">
                   <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-sm font-display font-medium text-primary uppercase tracking-widest animate-pulse">Initializing Tunnel...</p>
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={proxyUrl}
                className="w-full h-full border-none"
                onLoad={() => setLoading(false)}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
