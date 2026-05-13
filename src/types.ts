export interface UserSettings {
  compactMode: boolean;
  showChatPreview: boolean;
  customTheme?: string;
  soundsEnabled?: boolean;
  privateProfile?: boolean;
  performanceMode?: boolean;
}

export interface AvatarConfig {
  style: string;
  seed: string;
  backgroundColor?: string;
  rotate?: number;
}

export interface AuthUser {
  uid: string;
  username: string;
  isAdmin: boolean;
  isMod: boolean;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: string;
  banLimitInfo?: {
    count: number;
    lastReset: string;
  };
  photoURL?: string;
  avatarConfig?: AvatarConfig;
  settings?: UserSettings;
  history?: string[];
  bio?: string;
  tabs?: { id: string; title: string; path: string; }[];
}

export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  category: string;
  description: string;
  playCount: number;
  rating: number;
  htmlBlock?: string;
  isMultiplayer?: boolean;
}

export interface GameInvite {
  id: string;
  from: string;
  to: string;
  gameId: string;
  gameTitle: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}
