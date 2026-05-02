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
import { GameProvider } from './context/GameContext';

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <div className="min-h-screen bg-dark-surface">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:id" element={<GameView />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        
        <footer className="py-12 px-4 md:px-8 border-t border-white/5 mt-12 bg-dark-card/50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded bg-primary/20">
                  <Bug className="w-5 h-5 text-primary rotate-180" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight uppercase">
                  YEEBS<span className="text-primary">GAMES</span>
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
