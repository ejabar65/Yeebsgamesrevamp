/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import Home from './pages/Home';
import GameView from './pages/GameView';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Community from './pages/Community';
import Chat from './pages/Chat';
import Movies from './pages/Movies';
import MovieView from './pages/MovieView';
import Tutorials from './pages/Tutorials';
import Reviews from './pages/Reviews';
import Legal from './pages/Legal';
import Updates from './pages/Updates';
import VideoPortal from './pages/VideoPortal';
import { GameProvider } from './context/GameContext';
import { applyCloak, getSavedCloak } from './cloakUtils';
import { useGames } from './context/GameContext';

import OSShell from './components/OSShell';
import { MiniChat } from './components/MiniChat';
import MusicPlayer from './components/MusicPlayer';
import MultiplayerManager from './components/MultiplayerManager';
import PanicButton from './components/PanicButton';

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useGames();
  const theme = user?.settings?.customTheme || 'default';
  const isPerfMode = user?.settings?.performanceMode;
  
  return (
    <div className="min-h-screen bg-dark-surface" data-theme={theme}>
      <MotionConfig reducedMotion={isPerfMode ? "always" : "user"}>
        {children}
      </MotionConfig>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const saved = getSavedCloak();
    applyCloak(saved);

    // Panic Button Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      const panicKey = localStorage.getItem('yeebsgames_panic_key') || '`';
      const panicUrl = localStorage.getItem('yeebsgames_panic_url') || 'https://classroom.google.com';
      
      if (e.key === panicKey) {
        window.location.href = panicUrl;
      }
    };

    // Tab Blur Cloaking (Optional enhancement)
    const handleBlur = () => {
       const saved = getSavedCloak();
       if (saved !== 'None (Default)') {
         applyCloak(saved);
       }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
    };
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
              <Route path="/streaming" element={<VideoPortal />} />
              <Route path="/tutorials" element={<Tutorials />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/updates" element={<Updates />} />
              <Route path="/media/:type/:id" element={<MovieView />} />
              <Route path="/movie/:id" element={<MovieView typeOverride="movie" />} />
              <Route path="/tv/:id" element={<MovieView typeOverride="tv" />} />
              <Route path="/community" element={<Community />} />
              <Route path="/game/:id" element={<GameView />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
            </Routes>
            <MiniChat />
            <MusicPlayer />
            <MultiplayerManager />
            <PanicButton />
          </OSShell>
        </ThemeWrapper>
      </GameProvider>
    </BrowserRouter>
  );
}
