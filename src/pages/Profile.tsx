import React, { useState, useEffect } from 'react';
import { useGames } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Package, Heart, History, Trash2, Settings as SettingsIcon, Layout, MessageCircle, Palette, Save, CheckCircle2, Zap, Shield, Globe, ExternalLink } from 'lucide-react';
import { auth, signOut } from '../lib/firebase';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import GameCard from '../components/GameCard';
import Login from '../components/Login';
import { CLOAK_OPTIONS } from '../constants';
import { applyCloak, getSavedCloak, launchAboutBlank } from '../cloakUtils';

export default function Profile() {
  const { username: profileUsername } = useParams();
  const location = useLocation();
  const { user: currentUser, games, favorites: currentFavorites, authLoading, toggleFavorite, logout, updateSettings, updateAvatar, updateBio, getPublicProfile } = useGames();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'collection' | 'settings' | 'avatar'>('collection');

  // Handle tab from query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'settings') setActiveTab('settings');
    if (tab === 'avatar') setActiveTab('avatar');
    if (tab === 'collection') setActiveTab('collection');
  }, [location.search]);

  const [saveStatus, setSaveStatus] = useState(false);
  const [publicUser, setPublicUser] = useState<any>(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState('');

  const isOwnProfile = !profileUsername || profileUsername.toLowerCase() === currentUser?.username.toLowerCase();

  React.useEffect(() => {
    if (isOwnProfile && currentUser) {
      setBioDraft(currentUser.bio || '');
    }
  }, [isOwnProfile, currentUser]);

  React.useEffect(() => {
    if (!isOwnProfile && profileUsername) {
      setLoadingPublic(true);
      getPublicProfile(profileUsername).then(data => {
        setPublicUser(data);
        setLoadingPublic(false);
      });
    }
  }, [profileUsername, isOwnProfile, getPublicProfile]);

  const profileData = isOwnProfile ? currentUser : publicUser;
  const profileFavorites = isOwnProfile ? currentFavorites : (publicUser?.favoriteGameIds || []);

  const [settingsForm, setSettingsForm] = useState({
    compactMode: currentUser?.settings?.compactMode || false,
    showChatPreview: currentUser?.settings?.showChatPreview ?? true,
    customTheme: currentUser?.settings?.customTheme || 'default',
    soundsEnabled: currentUser?.settings?.soundsEnabled ?? true,
    privateProfile: currentUser?.settings?.privateProfile ?? false,
    panicKey: localStorage.getItem('yeebsgames_panic_key') || '`',
    panicUrl: localStorage.getItem('yeebsgames_panic_url') || 'https://classroom.google.com',
    cloak: getSavedCloak()
  });

  const handleCloakChange = (cloakName: string) => {
    setSettingsForm({ ...settingsForm, cloak: cloakName });
    applyCloak(cloakName);
  };

  const handlePanicSave = () => {
    localStorage.setItem('yeebsgames_panic_key', settingsForm.panicKey);
    localStorage.setItem('yeebsgames_panic_url', settingsForm.panicUrl);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const [avatarForm, setAvatarForm] = useState({
    style: currentUser?.avatarConfig?.style || 'avataaars',
    seed: currentUser?.avatarConfig?.seed || currentUser?.username || 'yeebs',
    backgroundColor: currentUser?.avatarConfig?.backgroundColor || 'b6e3f4',
    rotate: currentUser?.avatarConfig?.rotate || 0,
    customUrl: ''
  });

  const [useCustomUrl, setUseCustomUrl] = useState(!!currentUser?.photoURL && !currentUser?.photoURL.includes('dicebear'));

  const previewUrl = useCustomUrl 
    ? (avatarForm.customUrl || currentUser?.photoURL || '') 
    : `https://api.dicebear.com/7.x/${avatarForm.style}/svg?seed=${avatarForm.seed}${avatarForm.backgroundColor ? `&backgroundColor=${avatarForm.backgroundColor}` : ''}`;

  if (authLoading || loadingPublic) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-md mx-auto space-y-6">
        {!profileUsername ? (
          <div className="card-subtle p-8 w-full">
             <Login inline />
          </div>
        ) : (
          <div className="card-subtle p-12 w-full space-y-6">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto text-blue-500">
               <User className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">User not found</h1>
              <p className="text-gray-500 text-sm">This profile may be private or the identifier is incorrect.</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    );
  }

  const savedGames = games.filter(game => profileFavorites.includes(game.id));

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
    <div className="space-y-12 max-w-7xl mx-auto font-sans">
      {/* Profile Header */}
      <header className="card-subtle p-8 md:p-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden bg-white/[0.02]">
        <div className="relative">
          <div className="w-40 h-40 rounded-3xl border-4 border-white/5 overflow-hidden bg-white/5 p-1">
            {profileData.photoURL ? (
              <img 
                src={profileData.photoURL} 
                alt={profileData.username} 
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700">
                <User className="w-16 h-16" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-2">
              {profileData.username}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20">
                {profileData.isAdmin ? 'Administrator' : 'Verified Member'}
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                ID {profileData.uid?.slice(0, 8) || 'PUBLIC'}
              </span>
            </div>
          </div>
          
          {isOwnProfile ? (
            <div className="max-w-md">
              {isEditingBio ? (
                <div className="space-y-3">
                  <textarea 
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium focus:border-blue-500 outline-hidden min-h-[100px] text-gray-200 transition-all"
                    autoFocus
                  />
                  <div className="flex gap-2">
                     <button 
                       onClick={async () => {
                         await updateBio(bioDraft);
                         setIsEditingBio(false);
                       }}
                       className="px-6 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                     >
                       Save
                     </button>
                     <button 
                       onClick={() => {
                         setBioDraft(currentUser?.bio || '');
                         setIsEditingBio(false);
                       }}
                       className="px-6 py-2 rounded-lg bg-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-all border border-white/10"
                     >
                       Cancel
                     </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingBio(true)}
                  className="group block text-sm font-medium text-gray-400 hover:text-white transition-colors text-left"
                >
                  <p className="leading-relaxed">
                    {profileData.bio || "Click to add a short bio or status..."}
                  </p>
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md">
              {profileData.bio || "No status information available for this sector."}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-12">
            <div className="space-y-1">
               <span className="block text-3xl font-bold text-white tracking-tight">{savedGames.length}</span>
               <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Library</span>
            </div>
            <div className="space-y-1">
               <span className="block text-3xl font-bold text-white tracking-tight">{profileFavorites.length}</span>
               <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Favorites</span>
            </div>
            {isOwnProfile && (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveTab('collection')}
            className={`px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all border ${activeTab === 'collection' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}
          >
            Collection
          </button>
          {isOwnProfile && (
            <>
              <button 
                onClick={() => setActiveTab('avatar')}
                className={`px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all border ${activeTab === 'avatar' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}
              >
                Avatar
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-8 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all border ${activeTab === 'settings' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}
              >
                Settings
              </button>
            </>
          )}
      </nav>

      <AnimatePresence mode="wait">
        {activeTab === 'collection' ? (
          <motion.section 
            key="collection"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {isOwnProfile ? 'Your Collection' : `${profileData.username}'s Collection`}
              </h2>
            </div>

            {savedGames.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {savedGames.map((game, i) => (
                  <div key={`${game.id}-${i}`} className="relative group">
                    <GameCard game={game} />
                    {isOwnProfile && (
                      <button 
                        onClick={() => toggleFavorite(game.id)}
                        className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-105 active:scale-95"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-subtle p-20 text-center flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-gray-700">
                  <Package className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">Collection Empty</h3>
                  <p className="text-gray-500 text-xs max-w-xs mx-auto leading-relaxed">Save your favorite games and media to build your personal library.</p>
                </div>
                {isOwnProfile && (
                  <Link 
                    to="/" 
                    className="px-8 py-3 rounded-xl bg-white text-black hover:bg-blue-500 hover:text-white transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
                  >
                    Explore Games
                  </Link>
                )}
              </div>
            )}
          </motion.section>
        ) : activeTab === 'avatar' ? (
          <motion.section 
            key="avatar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl"
          >
             <div className="card-subtle p-12 text-center flex flex-col items-center justify-center relative overflow-hidden bg-white/5">
                <div className="relative group">
                   <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                   <img 
                     src={previewUrl}
                     alt="Preview"
                     className="w-48 h-48 rounded-3xl relative z-10 bg-black/40 shadow-2xl transition-all duration-500 object-cover"
                     onError={(e) => {
                       (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${profileData.username}`;
                     }}
                   />
                </div>
                <h3 className="text-2xl font-bold text-white mt-8 mb-2 capitalize">
                  {useCustomUrl ? 'External Identity' : avatarForm.style.replace('-', ' ')}
                </h3>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                  {useCustomUrl ? 'Synchronized via URL' : `Seed: ${avatarForm.seed}`}
                </p>
             </div>
12345: 
             <div className="card-subtle p-10 space-y-10">
                <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setUseCustomUrl(false)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${!useCustomUrl ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                  >
                    Generator
                  </button>
                  <button 
                    onClick={() => setUseCustomUrl(true)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${useCustomUrl ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
                  >
                    Custom URL
                  </button>
                </div>

                {!useCustomUrl ? (
                  <>
                    <div className="space-y-6">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Avatar Style</h4>
                       <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'avataaars', name: 'Avataaars' },
                            { id: 'pixel-art', name: 'Pixel' },
                            { id: 'bottts', name: 'Bots' },
                            { id: 'adventurer', name: 'Adventurer' },
                            { id: 'big-smile', name: 'Smile' },
                            { id: 'croodles', name: 'Croodles' },
                            { id: 'fun-emoji', name: 'Emoji' },
                            { id: 'micah', name: 'Micah' },
                            { id: 'notionists', name: 'Notion' }
                          ].map(style => (
                            <button
                              key={style.id}
                              onClick={() => setAvatarForm({ ...avatarForm, style: style.id })}
                              className={`px-3 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all ${avatarForm.style === style.id ? 'bg-blue-500 text-white border-blue-500 shadow-md' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10'}`}
                            >
                               {style.name}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Background</h4>
                       <div className="flex flex-wrap gap-2">
                          {['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'transparent'].map(color => (
                            <button
                              key={color}
                              onClick={() => setAvatarForm({ ...avatarForm, backgroundColor: color === 'transparent' ? '' : color })}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${avatarForm.backgroundColor === color || (color === 'transparent' && !avatarForm.backgroundColor) ? 'border-blue-500 scale-110' : 'border-white/10'}`}
                              style={{ backgroundColor: color === 'transparent' ? 'transparent' : `#${color}` }}
                            />
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Identity Seed</h4>
                       <div className="relative">
                          <input 
                            type="text"
                            value={avatarForm.seed}
                            onChange={(e) => setAvatarForm({ ...avatarForm, seed: e.target.value })}
                            placeholder="Type anything..."
                            className="w-full px-6 py-4 pr-16 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-sm font-medium text-white"
                          />
                          <button 
                            onClick={() => setAvatarForm({ ...avatarForm, seed: Math.random().toString(36).substring(7) })}
                            className="absolute right-2 top-2 bottom-2 px-3 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all"
                          >
                             <History className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-500">External Image URL</h4>
                    <div className="space-y-4">
                      <input 
                        type="url"
                        value={avatarForm.customUrl}
                        onChange={(e) => setAvatarForm({ ...avatarForm, customUrl: e.target.value })}
                        placeholder="https://images.com/your-avatar.jpg"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 transition-all text-sm font-medium text-white"
                      />
                      <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                        Link a high-resolution image to represent your digital character. 
                        Recommended size: 512x512.
                      </p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={async () => {
                    if (useCustomUrl) {
                      const urlToSave = avatarForm.customUrl || currentUser?.photoURL;
                      // We need a way to save just the PhotoURL, let's update AvatarConfig to handle it or similar
                      // For now, I'll update GameContext to support this
                      await updateAvatar({ 
                        ...avatarForm, 
                        photoURLOverride: urlToSave 
                      } as any);
                    } else {
                      await updateAvatar(avatarForm);
                    }
                    setSaveStatus(true);
                    setTimeout(() => setSaveStatus(false), 2000);
                  }}
                  className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                >
                   Commit Avatar Update
                </button>
             </div>
          </motion.section>
        ) : (
          <motion.section 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-4xl space-y-8"
          >
            <div className="card-subtle p-10 space-y-12">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h3 className="text-2xl font-bold text-white">Interface Settings</h3>
                     <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Customize your platform experience</p>
                  </div>
                  {saveStatus && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-blue-500 text-xs font-bold uppercase tracking-widest"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </motion.div>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Compact Mode */}
                  <div className="p-6 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all">
                     <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white">High Density Layout</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Optimized for power users</p>
                     </div>
                     <button 
                       onClick={() => setSettingsForm({ ...settingsForm, compactMode: !settingsForm.compactMode })}
                       className={`w-12 h-6 rounded-full relative transition-all ${settingsForm.compactMode ? 'bg-blue-500' : 'bg-white/10'}`}
                     >
                        <motion.div 
                          animate={{ x: settingsForm.compactMode ? 26 : 2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" 
                        />
                     </button>
                  </div>

                  {/* Private Profile */}
                  <div className="p-6 rounded-2xl bg-white/2 border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all">
                     <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white">Privacy Mode</h4>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Restrict profile visibility</p>
                     </div>
                     <button 
                       onClick={() => setSettingsForm({ ...settingsForm, privateProfile: !settingsForm.privateProfile })}
                       className={`w-12 h-6 rounded-full relative transition-all ${settingsForm.privateProfile ? 'bg-blue-500' : 'bg-white/10'}`}
                     >
                        <motion.div 
                          animate={{ x: settingsForm.privateProfile ? 26 : 2 }}
                          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" 
                        />
                     </button>
                  </div>
               </div>

               {/* Tab Cloaking */}
               <div className="space-y-6 pt-10 border-t border-white/5">
                  <div className="space-y-1">
                     <h4 className="text-xl font-bold text-white">Tab Disguise</h4>
                     <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">Stealth Browser Integration</p>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                     {CLOAK_OPTIONS.map(option => (
                       <button
                         key={option.name}
                         onClick={() => handleCloakChange(option.name)}
                         className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${settingsForm.cloak === option.name ? 'bg-blue-500/10 border-blue-500 shadow-lg' : 'bg-white/2 border-white/5 text-gray-500 hover:border-white/10'}`}
                       >
                          <img src={option.icon} alt="" className="w-6 h-6 rounded" />
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${settingsForm.cloak === option.name ? 'text-white' : 'text-gray-600'}`}>{option.name}</span>
                       </button>
                     ))}
                  </div>

                  <div className="card-subtle p-8 bg-blue-500/5 border border-blue-500/20 flex flex-col md:flex-row items-center gap-8">
                     <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                        <Globe className="w-6 h-6" />
                     </div>
                     <div className="flex-1 space-y-4 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div>
                              <h4 className="font-bold text-lg text-white leading-none">About:Blank Stealth</h4>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Full isolation environment</p>
                           </div>
                           <button 
                             onClick={() => launchAboutBlank()}
                             className="px-8 py-2.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
                           >
                              Activate
                           </button>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Panic Button */}
               <div className="card-subtle p-8 bg-black/40 border border-red-500/20 space-y-8">
                    <div>
                       <h4 className="text-xl font-bold text-red-500 leading-none">Emergency Configuration</h4>
                       <p className="text-[10px] text-gray-700 uppercase font-bold tracking-widest mt-1">Panic button protocol</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-700 tracking-widest">Trigger Key</label>
                            <input 
                                type="text"
                                maxLength={1}
                                value={settingsForm.panicKey}
                                onChange={(e) => setSettingsForm({ ...settingsForm, panicKey: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 transition-all font-mono"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-gray-700 tracking-widest">Target Redirect URL</label>
                            <input 
                                type="text"
                                value={settingsForm.panicUrl}
                                onChange={(e) => setSettingsForm({ ...settingsForm, panicUrl: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-red-500 transition-all"
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handlePanicSave}
                        className="w-full py-4 rounded-xl border border-red-500/30 text-red-500 font-bold text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                        Commit Emergency Protocol
                    </button>
               </div>

               <button 
                 onClick={handleSaveSettings}
                 className="w-full py-5 rounded-2xl bg-blue-500 text-white font-bold text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
               >
                  Sync System Settings
               </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
