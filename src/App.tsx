/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Bug } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import GameView from './pages/GameView';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import { GameProvider } from './context/GameContext';

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <div className="min-h-screen bg-dark-surface">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/game/:id" element={<GameView />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
        
        <footer className="py-12 px-4 md:px-8 border-t border-white/5 mt-12 bg-dark-card/50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center p-1.5 border border-primary/20">
                  <img 
                    src="https://lh3.googleusercontent.com/a/ACg8ocKFxTtfl9e-BoMuysn0FFqLOgXRtCrWfyP8NVm45njuz0onsUk=s288-c-no" 
                    alt="Logo" 
                    className="w-full h-full object-contain brightness-110" 
                  />
                </div>
                <span className="font-display font-bold text-lg tracking-tight uppercase relative">
                  YEEBS<span className="text-primary">GAMES</span>
                  <span className="absolute -top-3 -right-2 bg-red-600 text-[8px] px-1.5 py-0.5 rounded text-white font-black italic tracking-tighter rotate-12 shadow-md border border-red-400/30">
                    REVAMPED
                  </span>
                </span>
              </div>
              <p className="text-gray-500 text-sm max-w-xs">
                The ultimate destination for unblocked web games. Always free, always open.
              </p>
            </div>
            
            <div className="flex gap-12">
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-white">Platform</h4>
                <nav className="flex flex-col gap-2">
                  <Link to="/" className="text-sm text-gray-500 hover:text-primary transition-colors">Games</Link>
                  <Link to="/admin" className="text-sm text-gray-500 hover:text-primary transition-colors">Admin Portal</Link>
                </nav>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} YEEBSGAMES. All rights reserved. 🦋
          </div>
        </footer>
      </div>
    </GameProvider>
    </BrowserRouter>
  );
}
