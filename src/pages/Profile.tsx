import React, { useState } from 'react';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Package, Heart, History, Trash2, Settings as SettingsIcon, Layout, MessageCircle, Palette, Save, CheckCircle2, Zap, Shield } from 'lucide-react';
import { auth, signOut } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import GameCard from '../components/GameCard';

export default function Profile() {
  const { user, games, favorites, authLoading, toggleFavorite, logout, updateSettings, updateAvatar } = useGames();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'inventory' | 'settings' | 'avatar'>('inventory');
  const [saveStatus, setSaveStatus] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    compactMode: user?.settings?.compactMode || false,
    showChatPreview: user?.settings?.showChatPreview ?? true,
    customTheme: user?.settings?.customTheme || 'default',
    soundsEnabled: user?.settings?.soundsEnabled ?? true,
    privateProfile: user?.settings?.privateProfile ?? false
  });

  const [avatarForm, setAvatarForm] = useState({
    style: user?.avatarConfig?.style || 'avataaars',
    seed: user?.avatarConfig?.seed || user?.username || 'yeebs',
    backgroundColor: user?.avatarConfig?.backgroundColor || 'b6e3f4',
    rotate: user?.avatarConfig?.rotate || 0
  });

  if (authLoading) {
    return (
      <div className="min-h-screen pt-32 px-4 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 px-4 flex flex-col items-center justify-center text-center">
        <div className="p-6 rounded-full bg-primary/10 mb-6">
          <User className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-3xl font-display font-black uppercase mb-4">Access Denied</h1>
        <p className="text-gray-400 mb-8 max-w-sm">Please login through the system portal to view your custom inventory.</p>
        <button 
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-xl bg-primary text-dark-surface font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(250,204,21,0.2)]"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const savedGames = games.filter(game => favorites.includes(game.id));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSaveSettings = async () => {
    await updateSettings(settingsForm);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  return (
    <main className="pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="glass rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <SettingsIcon className="w-64 h-64 rotate-12" />
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
            <img 
              src={user.photoURL || ''} 
              alt={user.username} 
              className="w-32 h-32 rounded-full border-4 border-primary/20 relative z-10"
            />
          </div>
          
          <div className="flex-1 text-center md:text-left relative z-10">
            <h1 className="text-4xl font-display font-black uppercase mb-2">@{user.username}</h1>
            <p className="text-gray-400 mb-6 font-mono text-xs uppercase tracking-widest">
              {user.isAdmin ? 'System Administrator' : 'Portal User'} • ID: {user.uid.slice(0, 8)}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold uppercase tracking-widest">{savedGames.length} Items</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold uppercase tracking-widest">{favorites.length} Favs</span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 relative z-10"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`px-8 py-3 rounded-xl font-display font-black uppercase tracking-widest text-sm transition-all border whitespace-nowrap ${activeTab === 'inventory' ? 'bg-primary text-dark-surface border-primary' : 'bg-white/5 text-gray-500 border-white/5'}`}
            >
              Inventory
            </button>
            <button 
              onClick={() => setActiveTab('avatar')}
              className={`px-8 py-3 rounded-xl font-display font-black uppercase tracking-widest text-sm transition-all border whitespace-nowrap ${activeTab === 'avatar' ? 'bg-primary text-dark-surface border-primary' : 'bg-white/5 text-gray-500 border-white/5'}`}
            >
              Custom Avatar
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-8 py-3 rounded-xl font-display font-black uppercase tracking-widest text-sm transition-all border whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary text-dark-surface border-primary' : 'bg-white/5 text-gray-500 border-white/5'}`}
            >
              Settings
            </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'inventory' ? (
            <motion.section 
              key="inventory"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-black uppercase flex items-center gap-3">
                  <Package className="w-6 h-6 text-primary" />
                  Your Inventory
                </h2>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">
                  Saved for later
                </div>
              </div>

              {savedGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {savedGames.map(game => (
                    <div key={game.id} className="relative group">
                      <GameCard game={game} />
                      <button 
                        onClick={() => toggleFavorite(game.id)}
                        className="absolute bottom-4 right-4 p-2 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        title="Remove from inventory"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass rounded-3xl p-20 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/5">
                  <div className="p-6 rounded-full bg-white/5 mb-6">
                    <History className="w-12 h-12 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400 mb-2">Inventory Empty</h3>
                  <p className="text-gray-500 text-sm mb-8 max-w-xs">Start building your collection by liking games across the platform.</p>
                  <Link 
                    to="/" 
                    className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-primary hover:text-dark-surface transition-all font-bold uppercase tracking-widest"
                  >
                    Discover Games
                  </Link>
                </div>
              )}
            </motion.section>
          ) : activeTab === 'avatar' ? (
            <motion.section 
              key="avatar"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="glass rounded-3xl p-8 border border-white/5 text-center flex flex-col items-center justify-center">
                    <div className="relative mb-8">
                       <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full" />
                       <img 
                         src={`https://api.dicebear.com/7.x/${avatarForm.style}/svg?seed=${avatarForm.seed}`}
                         alt="Preview"
                         className="w-48 h-48 rounded-full border-8 border-white/10 relative z-10 bg-dark-card shadow-2xl"
                       />
                    </div>
                    <h3 className="text-2xl font-display font-black uppercase mb-1">Avatar Preview</h3>
                    <p className="text-gray-500 text-[10px] uppercase tracking-widest font-mono">Generated ID: {avatarForm.seed}</p>
                 </div>

                 <div className="glass rounded-3xl p-8 border border-white/5 space-y-8">
                    <div className="space-y-4">
                       <h4 className="text-sm font-black uppercase tracking-widest text-primary">1. Choose Your Vibe</h4>
                       <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'avataaars', name: 'Original' },
                            { id: 'pixel-art', name: 'Retro Pixel' },
                            { id: 'bottts', name: 'Cyber Bot' },
                            { id: 'human', name: 'Minimalist' },
                            { id: 'identicon', name: 'Abstract' },
                            { id: 'croodles', name: 'Hand-drawn' }
                          ].map(style => (
                            <button
                              key={style.id}
                              onClick={() => setAvatarForm({ ...avatarForm, style: style.id })}
                              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${avatarForm.style === style.id ? 'bg-primary text-dark-surface border-primary' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                            >
                               {style.name}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h4 className="text-sm font-black uppercase tracking-widest text-primary">2. Personalize Seed</h4>
                       <div className="relative">
                          <input 
                            type="text"
                            value={avatarForm.seed}
                            onChange={(e) => setAvatarForm({ ...avatarForm, seed: e.target.value })}
                            placeholder="Type anything to randomize..."
                            className="w-full px-4 py-4 pr-16 bg-white/5 border border-white/10 rounded-2xl focus:border-primary transition-all text-sm font-mono"
                          />
                          <button 
                            onClick={() => setAvatarForm({ ...avatarForm, seed: Math.random().toString(36).substring(7) })}
                            className="absolute right-2 top-2 p-3 rounded-xl bg-white/10 hover:bg-primary hover:text-dark-surface transition-all"
                          >
                             <History className="w-4 h-4" />
                          </button>
                       </div>
                       <p className="text-[10px] text-gray-500 uppercase italic">Every character is unique. Share your seed with friends!</p>
                    </div>

                    <button 
                      onClick={() => {
                        updateAvatar(avatarForm);
                        setSaveStatus(true);
                        setTimeout(() => setSaveStatus(false), 2000);
                      }}
                      className="w-full py-4 rounded-2xl bg-white text-dark-surface font-black uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center justify-center gap-3"
                    >
                       <Save className="w-5 h-5" />
                       Apply Character
                    </button>
                 </div>
              </div>
            </motion.section>
          ) : (
            <motion.section 
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-3xl"
            >
              <div className="glass rounded-3xl p-8 border border-white/5 space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-display font-black uppercase flex items-center gap-3">
                       <SettingsIcon className="w-5 h-5 text-primary" />
                       Custom Preferences
                    </h3>
                    {saveStatus && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase italic"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Settings Synced
                      </motion.div>
                    )}
                 </div>

                 <div className="grid gap-6">
                    {/* Compact Mode */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-primary/10">
                             <Layout className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                             <h4 className="font-bold text-sm text-white">Compact Mode</h4>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Denser UI for power users</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setSettingsForm({ ...settingsForm, compactMode: !settingsForm.compactMode })}
                         className={`w-12 h-6 rounded-full relative transition-colors ${settingsForm.compactMode ? 'bg-primary' : 'bg-gray-700'}`}
                       >
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${settingsForm.compactMode ? 'translate-x-6' : ''}`} />
                       </button>
                    </div>

                    {/* Chat Preview */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-blue-500/10">
                             <MessageCircle className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                             <h4 className="font-bold text-sm text-white">Chat Previews</h4>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Show live chat snippets in navbar</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setSettingsForm({ ...settingsForm, showChatPreview: !settingsForm.showChatPreview })}
                         className={`w-12 h-6 rounded-full relative transition-colors ${settingsForm.showChatPreview ? 'bg-primary' : 'bg-gray-700'}`}
                       >
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${settingsForm.showChatPreview ? 'translate-x-6' : ''}`} />
                       </button>
                    </div>

                    {/* Custom Theme */}
                    <div className="space-y-4">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-orange-500/10">
                             <Palette className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                             <h4 className="font-bold text-sm text-white">System Theme</h4>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Personalize your portal aesthetic</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          {['default', 'cyber', 'retro', 'minimal'].map(theme => (
                            <button
                              key={theme}
                              onClick={() => setSettingsForm({ ...settingsForm, customTheme: theme })}
                              className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${settingsForm.customTheme === theme ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}
                            >
                               {theme}
                            </button>
                          ))}
                       </div>
                    </div>

                    {/* Sounds Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-emerald-500/10">
                             <Zap className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                             <h4 className="font-bold text-sm text-white">Audio Feedback</h4>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Enable system sound effects</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setSettingsForm({ ...settingsForm, soundsEnabled: !settingsForm.soundsEnabled })}
                         className={`w-12 h-6 rounded-full relative transition-colors ${settingsForm.soundsEnabled ? 'bg-primary' : 'bg-gray-700'}`}
                       >
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${settingsForm.soundsEnabled ? 'translate-x-6' : ''}`} />
                       </button>
                    </div>

                    {/* Private Profile */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-purple-500/10">
                             <Shield className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                             <h4 className="font-bold text-sm text-white">Privacy Lock</h4>
                             <p className="text-[10px] text-gray-500 uppercase tracking-widest">Hide your inventory from search</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setSettingsForm({ ...settingsForm, privateProfile: !settingsForm.privateProfile })}
                         className={`w-12 h-6 rounded-full relative transition-colors ${settingsForm.privateProfile ? 'bg-primary' : 'bg-gray-700'}`}
                       >
                          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${settingsForm.privateProfile ? 'translate-x-6' : ''}`} />
                       </button>
                    </div>
                 </div>

                 <button 
                   onClick={handleSaveSettings}
                   className="w-full py-4 rounded-2xl bg-primary text-dark-surface font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(250,204,21,0.2)]"
                 >
                    <Save className="w-5 h-5" />
                    Save & Sync Settings
                 </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
