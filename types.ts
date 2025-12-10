
export interface SubtitleTrack {
  label: string;
  src: string;
  lang: string;
}

export interface UserPermissions {
  camera: boolean;
  gallery: boolean;
  microphone: boolean;
}

export interface UserDeviceInfo {
  model: string;
  os: string;
  ip: string;
  permissions: UserPermissions;
}

export interface UserPaymentDetails {
  accountNumber: string;
  transactionId: string;
  method: 'bKash' | 'Nagad' | 'Card';
  lastPaymentDate: Date;
}

export interface User {
  id: string;
  name: string;
  coverName?: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  isAdmin?: boolean;
  password?: string; 
  notifications?: { id: string; text: string; date: Date; read: boolean }[];
  deviceInfo?: UserDeviceInfo;
  paymentDetails?: UserPaymentDetails;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  bkashNumber: string;
  trxId: string;
  plan: string;
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
  videoUrl: string; 
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
  isPremium?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  logo: string;
  currentProgram: string;
  category: string;
  streamUrl: string;
  streamType?: 'video' | 'm3u8' | 'embed' | 'youtube';
  isPremium?: boolean;
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
  episodeId?: string; 
  progress: number; 
  timestamp: number; 
  duration: number; 
  lastWatched: number; 
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
}

export interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  isActive: boolean;
}

export enum ViewState {
  HOME = 'HOME',
  LIVE_TV = 'LIVE_TV',
  MOVIES = 'MOVIES',
  PLAYER = 'PLAYER',
  SEARCH = 'SEARCH',
  PREMIUM = 'PREMIUM',
  ADMIN = 'ADMIN',
  NOTIFICATIONS = 'NOTIFICATIONS',
  DOWNLOADS = 'DOWNLOADS',
  PROFILE = 'PROFILE'
}