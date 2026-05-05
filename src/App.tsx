/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import Home from './pages/Home';
import GameView from './pages/GameView';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Community from './pages/Community';
import Chat from './pages/Chat';
import Movies from './pages/Movies';
import MovieView from './pages/MovieView';
import ProxyBrowser from './pages/ProxyBrowser';
import { GameProvider } from './context/GameContext';
import { applyCloak, getSavedCloak } from './cloakUtils';
import { useGames } from './context/GameContext';

import OSShell from './components/OSShell';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useGames();
  const theme = user?.settings?.customTheme || 'default';
  
  return (
    <div className="min-h-screen bg-dark-surface" data-theme={theme}>
      {children}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const saved = getSavedCloak();
    applyCloak(saved);
  }, []);

  return (
    <BrowserRouter>
      <GameProvider>
        <ThemeWrapper>
          <OSShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/media/:type/:id" element={<MovieView />} />
              <Route path="/browser" element={<ProxyBrowser />} />
              <Route path="/community" element={<Community />} />
              <Route path="/game/:id" element={<GameView />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
            </Routes>
          </OSShell>
        </ThemeWrapper>
      </GameProvider>
    </BrowserRouter>
  );
}
