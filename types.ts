export interface SubtitleTrack {
  label: string;
  src: string;
  lang: string;
}

export interface User {
  id: string;
  name: string;
  coverName?: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  isAdmin?: boolean;
  password?: string; // For mock password management
  notifications?: { id: string; text: string; date: Date; read: boolean }[];
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bkashNumber: string;
  trxId: string;
  plan: 'Monthly' | 'Yearly';
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  date: Date;
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  subtitles?: SubtitleTrack[];
}

export interface MediaContent {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string; // Generic placeholder video URL
  category: string;
  rating: number;
  year: number;
  duration: string;
  isLive?: boolean;
  channelName?: string;
  type: 'movie' | 'series';
  episodes?: Episode[];
  currentEpisodeId?: string;
  subtitles?: SubtitleTrack[];
  cast?: string[];
  director?: string;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  currentProgram: string;
  category: string;
  streamUrl: string;
  streamType?: 'video' | 'm3u8' | 'embed' | 'youtube';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'support';
  text: string;
  timestamp: Date;
}

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  text: string;
  type: 'feedback' | 'bug';
  date: Date;
}

export interface WatchHistoryItem {
  contentId: string;
  episodeId?: string; // If series
  progress: number; // Percentage 0-100
  timestamp: number; // Current playback time in seconds
  duration: number; // Total duration in seconds
  lastWatched: number; // Date.now()
}

export enum ViewState {
  HOME = 'HOME',
  LIVE_TV = 'LIVE_TV',
  MOVIES = 'MOVIES',
  PLAYER = 'PLAYER',
  SEARCH = 'SEARCH',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
  NOTIFICATIONS = 'NOTIFICATIONS'
}