import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Tv, 
  Film, 
  Search, 
  User as UserIcon, 
  Play, 
  Info, 
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Clock,
  Star,
  Calendar,
  Tag,
  Crown,
  Check,
  Copy,
  Download,
  Link,
  Globe,
  Youtube as YoutubeIcon,
  LogOut,
  Sun,
  Moon,
  HelpCircle,
  MapPin,
  Phone,
  Mail,
  Facebook,
  LayoutDashboard,
  Plus,
  Trash,
  Edit,
  Radio,
  Clapperboard,
  Users,
  MessageSquare,
  Settings,
  Bell,
  Send,
  Image as ImageIcon,
  Key,
  Shield,
  Headphones,
  ArrowLeft,
  CheckCircle,
  CreditCard,
  MessageSquarePlus,
  Bug,
  Smartphone,
  BadgeCheck,
  FileText,
  XCircle
} from 'lucide-react';
import { MOCK_CONTENT, MOCK_CHANNELS, CATEGORIES, TRANSLATIONS, INITIAL_USERS } from './constants';
import { MediaContent, Channel, ViewState, Episode, User, ChatMessage, WatchHistoryItem, Feedback, PaymentTransaction } from './types';
import VideoPlayer from './components/VideoPlayer';
import GeminiAssistant from './components/GeminiAssistant';
import LoginScreen from './components/LoginScreen';
import IntroAnimation from './components/IntroAnimation';

export default function App() {
  // Intro State
  const [showIntro, setShowIntro] = useState(true);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Language State
  const [language, setLanguage] = useState<'en' | 'bn'>('en');

  // Application Data State (Lifted from constants to allow Admin modifications)
  const [movies, setMovies] = useState<MediaContent[]>(MOCK_CONTENT);
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [appName, setAppName] = useState('sumonflix.net');
  
  // Watch History State
  const [watchHistory, setWatchHistory] = useState<Record<string, WatchHistoryItem>>({});
  
  // Admin Data State
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]); 
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([
    {
        id: 'tx-mock-1',
        userId: 'user-1',
        userName: 'Rahim Ahmed',
        userEmail: 'rahim@gmail.com',
        bkashNumber: '01711223344',
        trxId: 'TRX99887766',
        plan: 'Monthly',
        amount: '120',
        status: 'pending',
        date: new Date(Date.now() - 3600000) // 1 hour ago
    }
  ]);

  const [activeTab, setActiveTab] = useState<ViewState>(ViewState.HOME);
  const [selectedContent, setSelectedContent] = useState<MediaContent | Channel | null>(null);
  const [startPlaybackTime, setStartPlaybackTime] = useState(0);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [detailsContent, setDetailsContent] = useState<MediaContent | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChannelCategory, setActiveChannelCategory] = useState('All');
  
  // Payment Verification State
  const [selectedPlan, setSelectedPlan] = useState<'Monthly' | 'Yearly' | null>(null);
  const [userBkashNumber, setUserBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [isVerifyingTrx, setIsVerifyingTrx] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'pending' | 'error'>('idle');
  const paymentRef = useRef<HTMLDivElement>(null);
  
  // Feedback State
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug'>('feedback');

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Admin Panel State
  const [adminSection, setAdminSection] = useState<'dashboard' | 'content' | 'channels' | 'users' | 'inbox' | 'transactions' | 'settings'>('dashboard');
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // For movies, channels, users
  const [notificationText, setNotificationText] = useState('');
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  // User Notifications View State
  const [showNotifications, setShowNotifications] = useState(false);

  // Help Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Hero Content (Randomly select one for demo)
  const heroContent = movies[0];

  // Translation Helper
  const t = TRANSLATIONS[language];

  // Initialize Chat Welcome Message
  useEffect(() => {
     if (chatMessages.length === 0) {
        const welcomeText = language === 'bn' 
        ? 'হ্যালো! আমি আপনার সুমনফ্লিক্স অ্যাসিস্ট্যান্ট। মুভি সাজেশন বা অ্যাপ নিয়ে যেকোনো প্রশ্ন করতে পারেন।'
        : 'Hi! I\'m your sumonflix.net assistant. Ask me for recommendations or help with the app!';
        
        setChatMessages([{
            id: 'welcome',
            role: 'model',
            text: welcomeText,
            timestamp: new Date()
        }]);
     }
  }, [language]);

  // Initialize Auth, Theme, Language and History from LocalStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('sumonflix_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        const foundUser = allUsers.find(u => u.id === parsedUser.id);
        if (foundUser) setUser(foundUser);
      } catch (e) {
        console.error("Failed to parse user data", e);
        localStorage.removeItem('sumonflix_user');
      }
    }
    setAuthLoading(false);

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }

    const storedLang = localStorage.getItem('language') as 'en' | 'bn';
    if (storedLang) {
      setLanguage(storedLang);
    }
    
    // Load Watch History
    try {
        const history = localStorage.getItem('sumonflix_history');
        if (history) {
            setWatchHistory(JSON.parse(history));
        }
    } catch (e) {
        console.error("Failed to parse history", e);
    }
  }, []);

  const handleLogin = (newUser: User) => {
    const existing = allUsers.find(u => u.email === newUser.email);
    let userToSet = newUser;
    
    if (existing) {
        userToSet = existing;
    } else {
        setAllUsers([...allUsers, newUser]);
    }

    setUser(userToSet);
    localStorage.setItem('sumonflix_user', JSON.stringify(userToSet));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sumonflix_user');
    setActiveTab(ViewState.HOME);
    setSelectedContent(null);
    setDetailsContent(null);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'bn' : 'en';
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handlePlay = (content: MediaContent | Channel, startTime: number = 0) => {
    setSelectedContent(content);
    setStartPlaybackTime(startTime);
    setIsPlayerMinimized(false);
    setIsMobileMenuOpen(false);
    setDetailsContent(null);
  };

  const handleShowDetails = (content: MediaContent) => {
    setDetailsContent(content);
  };

  const handleClosePlayer = () => {
    setSelectedContent(null);
    setStartPlaybackTime(0);
    setIsPlayerMinimized(false);
  };

  const handleVideoProgress = (currentTime: number, duration: number) => {
    if (!selectedContent || 'streamUrl' in selectedContent) return; // Don't track live channels

    const progress = (currentTime / duration) * 100;
    const historyId = selectedContent.currentEpisodeId 
        ? `${selectedContent.id}_${selectedContent.currentEpisodeId}` 
        : selectedContent.id;

    const historyItem: WatchHistoryItem = {
        contentId: selectedContent.id,
        episodeId: selectedContent.currentEpisodeId,
        progress,
        timestamp: currentTime,
        duration,
        lastWatched: Date.now()
    };

    setWatchHistory(prev => {
        const newState = { ...prev, [historyId]: historyItem };
        localStorage.setItem('sumonflix_history', JSON.stringify(newState));
        return newState;
    });
  };

  const handlePlayerNext = () => {
    if (!selectedContent) return;

    if ('streamUrl' in selectedContent) {
      const currentIndex = channels.findIndex(c => c.id === selectedContent.id);
      if (currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % channels.length;
        handlePlay(channels[nextIndex]);
      }
      return;
    }

    if (selectedContent.type === 'series' && selectedContent.episodes && selectedContent.currentEpisodeId) {
      const currentIndex = selectedContent.episodes.findIndex(e => e.id === selectedContent.currentEpisodeId);
      if (currentIndex !== -1 && currentIndex < selectedContent.episodes.length - 1) {
        const nextEp = selectedContent.episodes[currentIndex + 1];
        const originalSeries = movies.find(c => c.id === selectedContent.id);
        const seriesTitle = originalSeries ? originalSeries.title : selectedContent.title.split(':')[0];

        handlePlay({
          ...selectedContent,
          videoUrl: nextEp.videoUrl,
          title: `${seriesTitle}: ${nextEp.title}`,
          currentEpisodeId: nextEp.id,
          description: nextEp.description,
          thumbnailUrl: nextEp.thumbnailUrl,
          subtitles: nextEp.subtitles
        });
      }
    }
  };

  const handlePlayerPrev = () => {
    if (!selectedContent) return;
    if ('streamUrl' in selectedContent) {
      const currentIndex = channels.findIndex(c => c.id === selectedContent.id);
      if (currentIndex !== -1) {
        const prevIndex = (currentIndex - 1 + channels.length) % channels.length;
        handlePlay(channels[prevIndex]);
      }
    }
  };

  const isContentLive = (content: MediaContent | Channel) => {
    return 'streamType' in content || !!(content as MediaContent).isLive;
  };

  const handleChatSendMessage = (text: string, role: 'user' | 'model' | 'support') => {
      setChatMessages(prev => [...prev, {
          id: Date.now().toString(),
          role,
          text,
          timestamp: new Date()
      }]);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const name = formData.get('name') as string;
    const coverName = formData.get('coverName') as string;
    const avatar = formData.get('avatar') as string;

    const updatedUser = { ...user, name, coverName, avatar };
    setUser(updatedUser);
    
    // Also update in allUsers list
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
    
    localStorage.setItem('sumonflix_user', JSON.stringify(updatedUser));
    setIsProfileModalOpen(false);
    alert(language === 'bn' ? "প্রোফাইল সফলভাবে আপডেট হয়েছে!" : "Profile updated successfully!");
  };

  // --- Payment Handler (User Side) ---
  const handleSelectPlan = (plan: 'Monthly' | 'Yearly') => {
    setSelectedPlan(plan);
    setTimeout(() => {
        paymentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleVerifyPayment = () => {
    if (!trxId || !userBkashNumber) {
        alert("Please enter both your bKash number and Transaction ID.");
        return;
    }
    
    setIsVerifyingTrx(true);
    setPaymentStatus('idle');
    
    // Simulate Submission to Admin
    setTimeout(() => {
        setIsVerifyingTrx(false);
        // Validation: ID must be at least 8 chars long and phone number valid length
        if (trxId.length >= 8 && userBkashNumber.length >= 11) {
            
            // Create a pending transaction request
            const newTransaction: PaymentTransaction = {
                id: `tx-${Date.now()}`,
                userId: user?.id || 'unknown',
                userName: user?.name || 'Unknown',
                userEmail: user?.email || 'Unknown',
                bkashNumber: userBkashNumber,
                trxId: trxId,
                plan: selectedPlan || 'Monthly',
                amount: selectedPlan === 'Yearly' ? '1000' : '120',
                status: 'pending',
                date: new Date()
            };

            setTransactions(prev => [newTransaction, ...prev]);
            setPaymentStatus('pending');
            
            // Notify user clearly
            alert("Payment details submitted successfully! Your subscription will be active once Admin verifies the transaction.");
        } else {
            setPaymentStatus('error');
        }
    }, 1500);
  };

  // --- Admin Transaction Handlers ---
  const handleApproveTransaction = (transactionId: string) => {
      const tx = transactions.find(t => t.id === transactionId);
      if (!tx) return;

      // Update transaction status
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'approved' } : t));

      // Upgrade user to Premium
      setAllUsers(prev => prev.map(u => {
          if (u.id === tx.userId) {
              return { ...u, isPremium: true };
          }
          return u;
      }));

      // If the current logged in user is the one being approved, update local state
      if (user && user.id === tx.userId) {
          const updatedUser = { ...user, isPremium: true };
          setUser(updatedUser);
          localStorage.setItem('sumonflix_user', JSON.stringify(updatedUser));
      }

      alert(`Transaction ${tx.trxId} approved. User ${tx.userName} is now Premium.`);
  };

  const handleRejectTransaction = (transactionId: string) => {
      setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'rejected' } : t));
  };

  const toggleUserPremium = (targetUserId: string) => {
      const targetUser = allUsers.find(u => u.id === targetUserId);
      if (!targetUser) return;

      const newStatus = !targetUser.isPremium;
      
      setAllUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isPremium: newStatus } : u));
      
      if (user && user.id === targetUserId) {
          const updatedUser = { ...user, isPremium: newStatus };
          setUser(updatedUser);
          localStorage.setItem('sumonflix_user', JSON.stringify(updatedUser));
      }
      
      alert(`User ${targetUser.name} Premium status: ${newStatus ? 'ACTIVATED' : 'REVOKED'}`);
  };

  // --- Feedback Handler ---
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    const newFeedback: Feedback = {
      id: `fb-${Date.now()}`,
      userId: user?.id || 'anonymous',
      userName: user?.name || 'Anonymous',
      text: feedbackText,
      type: feedbackType,
      date: new Date()
    };

    setFeedbacks(prev => [newFeedback, ...prev]);
    setIsFeedbackModalOpen(false);
    setFeedbackText('');
    setFeedbackType('feedback');
    alert('Thank you for your feedback!');
  };
  
  // --- Recommendation & Content Helpers ---
  const getRecommendations = (current: MediaContent) => {
      const scored = movies
          .filter(m => m.id !== current.id)
          .map(m => {
              let score = 0;
              // 1. Same Director: High relevance (+3)
              if (current.director && m.director && m.director === current.director) {
                  score += 3;
              }
              // 2. Same Genre/Category: Medium relevance (+2)
              if (m.category === current.category) {
                  score += 2;
              }
              // 3. Shared Cast: +1 per matching actor
              if (current.cast && m.cast) {
                  const shared = current.cast.filter(actor => m.cast!.includes(actor));
                  score += shared.length;
              }
              return { ...m, score };
          });
      
      // Sort by score (descending), then fallback to standard sort if scores are equal (effectively 0)
      scored.sort((a, b) => b.score - a.score);
      
      // Return top 4
      return scored.slice(0, 4);
  };

  const getContinueWatchingContent = () => {
      // Convert history map to array and sort by lastWatched descending
      const historyItems = (Object.values(watchHistory) as WatchHistoryItem[])
          .filter(item => item.progress > 0 && item.progress < 95) // Filter out not started or finished (approx 95%)
          .sort((a, b) => b.lastWatched - a.lastWatched);
      
      return historyItems.map(historyItem => {
          const content = movies.find(m => m.id === historyItem.contentId);
          if (!content) return null;

          let displayTitle = content.title;
          let displayThumbnail = content.thumbnailUrl;
          let episodeData: Episode | undefined;

          // If it's a series and has an episode ID, try to get specific episode details
          if (content.type === 'series' && historyItem.episodeId && content.episodes) {
              episodeData = content.episodes.find(ep => ep.id === historyItem.episodeId);
              if (episodeData) {
                  displayTitle = `${content.title}: ${episodeData.title}`;
                  displayThumbnail = episodeData.thumbnailUrl;
              }
          }

          return {
              ...content, // Base content
              displayTitle, 
              displayThumbnail,
              ...historyItem, // Attach history data (timestamp, progress) for the card
              // If series, ensure we use the episode's video URL when playing
              videoUrl: episodeData ? episodeData.videoUrl : content.videoUrl,
              currentEpisodeId: historyItem.episodeId
          };
      }).filter(Boolean);
  };

  // Helper to generate displayable cast list
  const getDisplayCast = (content: MediaContent) => {
      const displayList = [];
      if (content.director) {
          displayList.push({ name: content.director, role: 'Director' });
      }
      if (content.cast) {
          content.cast.forEach((actor, i) => {
             displayList.push({ name: actor, role: i === 0 ? 'Lead' : 'Cast' }); 
          });
      }
      
      // Fallback if no metadata
      if (displayList.length === 0) {
          return [
            { name: 'Director Info Unavailable', role: 'Director' },
            { name: 'Cast Info Unavailable', role: 'Cast' }
          ];
      }
      
      return displayList;
  };

  // --- Admin CRUD Handlers ---

  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newItem: MediaContent = {
      id: editingItem ? editingItem.id : `mov-${Date.now()}`,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      thumbnailUrl: formData.get('thumbnailUrl') as string,
      videoUrl: formData.get('videoUrl') as string,
      category: formData.get('category') as string,
      rating: parseFloat(formData.get('rating') as string) || 4.5,
      year: parseInt(formData.get('year') as string) || new Date().getFullYear(),
      duration: '2h', // Could be added to form if needed
      type: (formData.get('type') as 'movie' | 'series') || 'movie',
    };

    if (editingItem) {
      setMovies(movies.map(m => m.id === editingItem.id ? { ...m, ...newItem } : m));
    } else {
      setMovies([...movies, newItem]);
    }
    setIsContentModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteContent = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      setMovies(movies.filter(m => m.id !== id));
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const logoUrl = previewLogo || (formData.get('logo') as string);

    const newChannel: Channel = {
      id: editingItem ? editingItem.id : `ch-custom-${Date.now()}`,
      name: formData.get('name') as string,
      logo: logoUrl,
      currentProgram: formData.get('currentProgram') as string || 'Live Stream',
      category: formData.get('category') as string,
      streamUrl: formData.get('streamUrl') as string,
      streamType: formData.get('streamType') as any || 'video',
    };

    if (editingItem) {
      setChannels(channels.map(c => c.id === editingItem.id ? { ...c, ...newChannel } : c));
    } else {
      setChannels([...channels, newChannel]);
    }
    setIsChannelModalOpen(false);
    setEditingItem(null);
    setPreviewLogo(null);
  };

  const handleDeleteChannel = (id: string) => {
    if (window.confirm('Are you sure you want to delete this channel?')) {
      setChannels(channels.filter(c => c.id !== id));
    }
  };

  // --- Admin User Management ---
  
  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const coverName = formData.get('coverName') as string;
      const email = formData.get('email') as string;
      const avatar = formData.get('avatar') as string;
      
      if (editingItem) {
          setAllUsers(allUsers.map(u => u.id === editingItem.id ? { ...u, name, coverName, email, avatar } : u));
          
          // Update current user if it's them
          if (user && user.id === editingItem.id) {
               const updated = { ...user, name, coverName, email, avatar };
               setUser(updated);
               localStorage.setItem('sumonflix_user', JSON.stringify(updated));
          }
      }
      setIsUserModalOpen(false);
      setEditingItem(null);
  };

  const handleDeleteUser = (id: string) => {
      if (window.confirm('Are you sure you want to delete this user?')) {
          setAllUsers(allUsers.filter(u => u.id !== id));
      }
  };

  const handleSendNotification = () => {
      if (!editingItem || !notificationText.trim()) return;
      
      const newNotification = {
          id: `notif-${Date.now()}`,
          text: notificationText,
          date: new Date(),
          read: false
      };

      setAllUsers(allUsers.map(u => {
          if (u.id === editingItem.id) {
              return { ...u, notifications: [newNotification, ...(u.notifications || [])] };
          }
          return u;
      }));
      
      if (user && user.id === editingItem.id) {
          setUser({ ...user, notifications: [newNotification, ...(user.notifications || [])] });
      }

      setIsNotificationModalOpen(false);
      setNotificationText('');
      setEditingItem(null);
      alert('Notification sent!');
  };

  const handleAdminPasswordChange = (e: React.FormEvent) => {
      e.preventDefault();
      alert("Password updated successfully!");
  };
  
  const handleSupportReply = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const text = formData.get('reply') as string;
    
    if (text.trim()) {
        setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'support',
            text: text,
            timestamp: new Date()
        }]);
        (e.target as HTMLFormElement).reset();
    }
  };

  // --- Render Help Modal ---
  const renderHelpModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="text-blue-500" /> {t.help}
                </h2>
                <button onClick={() => setIsHelpModalOpen(false)} className="text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <X size={24} />
                </button>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                        <Phone size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{t.officialContact}</h3>
                        <p className="text-sm text-slate-500 mt-1">{t.callNow}: 01609843481</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600">
                        <Mail size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{t.email}</h3>
                        <p className="text-sm text-slate-500 mt-1">support@sumonflix.net</p>
                    </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600">
                        <Facebook size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{t.facebook}</h3>
                        <a href="#" className="text-sm text-blue-500 hover:underline mt-1 block">{t.visitPage}</a>
                    </div>
                </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-sm text-slate-500">Need more help? Use the Feedback form.</p>
            </div>
        </div>
    </div>
  );

  // --- Views ---

  const renderHome = () => {
    const continueWatchingList = getContinueWatchingContent();
    const liveChannels = channels;
    const webSeries = movies.filter(m => m.type === 'series');
    const moviesList = movies.filter(m => m.type === 'movie');

    return (
    <div className="pb-20">
      {/* Hero Banner */}
      <div className="relative h-[60vh] w-full group">
        <div className="absolute inset-0">
          <img 
            src={heroContent.thumbnailUrl} 
            alt={heroContent.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#0f172a] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
        </div>
        
        <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3 lg:w-1/2 space-y-4">
          <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-wider">
            {t.featured}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            {heroContent.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-300">
             <span className="text-green-400 font-semibold">{heroContent.rating} {t.rating}</span>
             <span>{heroContent.year}</span>
             <span>{heroContent.duration}</span>
             <span className="px-2 py-0.5 border border-gray-600 rounded text-xs">{heroContent.category}</span>
          </div>
          <p className="text-gray-300 text-lg line-clamp-3 md:line-clamp-none">
            {heroContent.description}
          </p>
          <div className="flex items-center gap-4 pt-4">
            <button 
              onClick={() => handlePlay(heroContent)}
              className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              {t.watchNow}
            </button>
            <button 
              onClick={() => handleShowDetails(heroContent)}
              className="px-8 py-3 bg-gray-500/30 backdrop-blur-sm text-white font-bold rounded hover:bg-gray-500/50 transition-colors flex items-center gap-2"
            >
              <Info size={20} />
              {t.moreInfo}
            </button>
          </div>
        </div>
      </div>

      {/* Continue Watching Section */}
      {continueWatchingList.length > 0 && (
          <div className="mt-8 px-8">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              Continue Watching
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              {continueWatchingList.map((item: any) => (
                 <div 
                    key={`${item.id}-${item.currentEpisodeId || 'movie'}`} 
                    className="flex-none w-[240px] aspect-video relative rounded-lg overflow-hidden cursor-pointer group snap-start bg-slate-900 border border-slate-700 shadow-md"
                    onClick={() => handlePlay(item, item.timestamp)}
                  >
                    <img 
                      src={item.displayThumbnail || item.thumbnailUrl} 
                      alt={item.displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm border border-white/20">
                          <Play size={24} fill="white" className="text-white" />
                      </div>
                    </div>
                    {/* Progress Bar Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
                        <div className="h-full bg-red-600" style={{ width: `${item.progress}%` }}></div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                         <h4 className="text-white text-xs font-bold truncate drop-shadow-md">{item.displayTitle}</h4>
                         <span className="text-[10px] text-gray-300 drop-shadow-md">
                            {Math.floor(item.progress)}% complete
                         </span>
                    </div>
                 </div>
              ))}
            </div>
          </div>
      )}

      {/* 1. Live TV Section */}
      <div className="mt-8 px-8">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Tv size={20} className="text-red-500" />
            {t.liveTvChannels}
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
             {liveChannels.map(channel => (
                 <div 
                    key={channel.id}
                    onClick={() => handlePlay(channel)}
                    className="flex-none w-[240px] aspect-video bg-white dark:bg-slate-800 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl border border-slate-200 dark:border-slate-700 group relative snap-start"
                 >
                    <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                       {/* Logo / Thumbnail */}
                       <img 
                          src={channel.logo} 
                          alt={channel.name}
                          className="w-20 h-20 object-contain rounded-full bg-white/10 p-2 backdrop-blur-sm"
                       />
                       <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</div>
                       <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                            <h3 className="font-bold text-white truncate">{channel.name}</h3>
                            <p className="text-slate-300 text-xs truncate">{channel.currentProgram}</p>
                       </div>
                    </div>
                 </div>
             ))}
        </div>
      </div>

      {/* 2. Web Series Section */}
      {webSeries.length > 0 && (
      <div className="mt-8 px-8">
         <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Film size={20} className="text-purple-500" />
            Web Series
         </h3>
         <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              {webSeries.map((item) => (
                 <div 
                    key={item.id} 
                    className="flex-none w-[200px] aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer group snap-start bg-slate-200 dark:bg-slate-800"
                    onClick={() => handleShowDetails(item)}
                  >
                    <img 
                      src={item.thumbnailUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                       <h4 className="text-white font-bold mb-2">{item.title}</h4>
                       <span className="text-xs text-purple-300 mb-2">{item.category}</span>
                       <button className="px-4 py-2 bg-blue-600 rounded-full text-white text-xs font-bold hover:bg-blue-500 transition-colors">
                         {t.moreInfo}
                       </button>
                    </div>
                 </div>
              ))}
         </div>
      </div>
      )}

      {/* 3. Movies & Drama Section */}
      {moviesList.length > 0 && (
      <div className="mt-8 px-8">
         <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Clapperboard size={20} className="text-blue-500" />
            Movies & Drama
         </h3>
         <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              {moviesList.map((item) => (
                 <div 
                    key={item.id} 
                    className="flex-none w-[200px] aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer group snap-start bg-slate-200 dark:bg-slate-800"
                    onClick={() => handleShowDetails(item)}
                  >
                    <img 
                      src={item.thumbnailUrl} 
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                       <h4 className="text-white font-bold mb-2">{item.title}</h4>
                       <span className="text-xs text-blue-300 mb-2">{item.category}</span>
                       <button className="px-4 py-2 bg-blue-600 rounded-full text-white text-xs font-bold hover:bg-blue-500 transition-colors">
                         {t.moreInfo}
                       </button>
                    </div>
                 </div>
              ))}
         </div>
      </div>
      )}
    </div>
  );
  };

  const renderContentDetails = () => {
    if (!detailsContent) return null;
    
    // Get Recommendations based on the current content logic
    const recommendations = getRecommendations(detailsContent);
    const displayCast = getDisplayCast(detailsContent);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-y-auto relative shadow-2xl border border-slate-200 dark:border-slate-700 hide-scrollbar">
          <button 
            onClick={() => setDetailsContent(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="relative h-[300px] md:h-[400px]">
            <img 
              src={detailsContent.thumbnailUrl} 
              alt={detailsContent.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 w-full">
               <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2">{detailsContent.title}</h2>
               <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700 dark:text-gray-300">
                  <span className="text-green-600 dark:text-green-400 font-bold">{detailsContent.rating} Match</span>
                  <span>{detailsContent.year}</span>
                  <span className="border border-slate-300 dark:border-gray-600 px-2 py-0.5 rounded text-xs">HD</span>
                  <span>{detailsContent.duration}</span>
                  {detailsContent.type === 'series' && <span>{detailsContent.episodes?.length} {t.episodes}</span>}
               </div>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 space-y-6">
                <div className="flex gap-3">
                   <button 
                     onClick={() => handlePlay(detailsContent)}
                     className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                   >
                     <Play size={20} fill="currentColor" /> {t.play}
                   </button>
                   {/* Add to List Button Placeholder */}
                   <button className="p-3 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-white">
                     <Plus size={20} />
                   </button>
                   <button className="p-3 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-white">
                     <Download size={20} />
                   </button>
                </div>

                <p className="text-slate-600 dark:text-gray-300 leading-relaxed text-lg">
                  {detailsContent.description}
                </p>

                {/* Episode List for Series */}
                {detailsContent.type === 'series' && detailsContent.episodes && (
                  <div className="mt-6">
                     <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                       <Film size={20} /> {t.episodes}
                     </h3>
                     <div className="space-y-4">
                       {detailsContent.episodes.map((ep, index) => (
                         <div 
                           key={ep.id} 
                           className="flex items-center gap-4 p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
                           onClick={() => {
                             handlePlay({
                               ...detailsContent,
                               videoUrl: ep.videoUrl,
                               title: `${detailsContent.title}: ${ep.title}`,
                               currentEpisodeId: ep.id,
                               description: ep.description,
                               thumbnailUrl: ep.thumbnailUrl,
                               subtitles: ep.subtitles
                             });
                           }}
                         >
                            <span className="text-slate-400 font-bold text-lg w-6">{index + 1}</span>
                            <div className="relative w-32 aspect-video rounded-md overflow-hidden bg-slate-800 flex-shrink-0">
                               <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Play size={24} fill="white" className="text-white" />
                               </div>
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start">
                                 <h4 className="text-slate-900 dark:text-white font-semibold truncate">{ep.title}</h4>
                                 <span className="text-xs text-slate-500 dark:text-gray-400">{ep.duration}</span>
                               </div>
                               <p className="text-sm text-slate-500 dark:text-gray-400 line-clamp-1 mt-1">{ep.description}</p>
                            </div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}
             </div>

             <div className="space-y-6">
                <div>
                   <h4 className="text-sm text-slate-500 dark:text-gray-400 mb-2">{t.castCrew}</h4>
                   <div className="flex flex-wrap gap-2">
                      {displayCast.map((person, idx) => (
                        <div key={idx} className="flex flex-col">
                           <span className="text-slate-900 dark:text-white text-sm font-medium">{person.name}</span>
                           <span className="text-xs text-slate-500 dark:text-gray-500">{person.role}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div>
                   <h4 className="text-sm text-slate-500 dark:text-gray-400 mb-1">{t.genre}</h4>
                   <div className="flex flex-wrap gap-2">
                      <span className="text-slate-900 dark:text-white text-sm hover:underline cursor-pointer">{detailsContent.category}</span>
                   </div>
                </div>
                
                {/* Advanced Recommendation Logic */}
                <div className="bg-slate-100 dark:bg-white/5 p-4 rounded-xl">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Sparkles size={16} className="text-yellow-500" />
                      {t.youMayLike}
                   </h3>
                   <div className="space-y-4">
                      {recommendations.map(rec => (
                         <div 
                           key={rec.id} 
                           className="group cursor-pointer flex gap-3 items-center"
                           onClick={() => setDetailsContent(rec)}
                         >
                            <div className="relative w-20 h-28 rounded-md overflow-hidden flex-shrink-0">
                               <img src={rec.thumbnailUrl} alt={rec.title} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play size={20} fill="white" className="text-white" />
                               </div>
                            </div>
                            <div>
                               <h4 className="text-slate-900 dark:text-white font-medium text-sm group-hover:text-blue-400 transition-colors line-clamp-2">{rec.title}</h4>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-slate-500 dark:text-gray-400">{rec.year}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300 rounded border border-slate-300 dark:border-white/10">{rec.category}</span>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLiveTv = () => {
    // Filter Channels
    const filteredChannels = channels.filter(c => {
       const matchesCategory = activeChannelCategory === 'All' || c.category === activeChannelCategory;
       const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
       return matchesCategory && matchesSearch;
    });

    // Extract unique categories from channels
    const channelCategories = ['All', ...Array.from(new Set(channels.map(c => c.category)))];

    return (
      <div className="p-8 pb-24">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
           <Tv className="text-red-500" /> {t.liveTvChannels}
        </h2>
        
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-6 hide-scrollbar">
           {channelCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveChannelCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeChannelCategory === cat 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
           ))}
        </div>

        {filteredChannels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredChannels.map(channel => (
              <div 
                key={channel.id}
                onClick={() => handlePlay(channel)}
                className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl border border-slate-200 dark:border-slate-700 group relative"
              >
                <div className="aspect-video relative bg-slate-900 flex items-center justify-center">
                   {/* Logo / Thumbnail */}
                   <img 
                      src={channel.logo} 
                      alt={channel.name}
                      className="w-24 h-24 object-contain rounded-full bg-white/10 p-2 backdrop-blur-sm"
                   />
                   <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</div>
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play size={48} fill="white" className="text-white drop-shadow-lg" />
                   </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">{channel.name}</h3>
                  <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 truncate">{channel.currentProgram}</p>
                  <div className="flex items-center justify-between mt-3">
                     <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-gray-300 rounded">{channel.category}</span>
                     <span className="text-xs text-slate-400">Stream: {channel.streamType || 'Video'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 dark:text-gray-400">
             <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Tv size={40} className="opacity-50" />
             </div>
             <p className="text-xl font-medium">{t.noChannels}</p>
          </div>
        )}
      </div>
    );
  };
  
  if (showIntro) {
      return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  if (!user && !authLoading) {
     return <LoginScreen onLogin={handleLogin} language={language} onToggleLanguage={toggleLanguage} translations={t} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white font-sans transition-colors duration-300 selection:bg-blue-500/30 selection:text-blue-200 ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* Sidebar Navigation */}
      <nav className={`fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Play size={16} fill="white" className="text-white ml-0.5" />
             </div>
             <span className="text-xl font-bold tracking-tight">{appName}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-slate-500">
             <X size={24} />
          </button>
        </div>

        <div className="px-4 py-2">
           <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Menu</div>
           <button 
             onClick={() => { setActiveTab(ViewState.HOME); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${activeTab === ViewState.HOME ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
           >
             <Home size={20} /> {t.home}
           </button>
           <button 
             onClick={() => { setActiveTab(ViewState.LIVE_TV); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all mt-1 ${activeTab === ViewState.LIVE_TV ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
           >
             <Tv size={20} /> {t.liveTv}
           </button>
           <button 
             onClick={() => { setActiveTab(ViewState.MOVIES); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all mt-1 ${activeTab === ViewState.MOVIES ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
           >
             <Film size={20} /> {t.movies}
           </button>
           <button 
             onClick={() => { setActiveTab(ViewState.PREMIUM); setIsMobileMenuOpen(false); }}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all mt-1 ${activeTab === ViewState.PREMIUM ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
           >
             <Crown size={20} /> {t.premium}
           </button>
           
           {user.isAdmin && (
             <button 
               onClick={() => { setActiveTab(ViewState.ADMIN); setIsMobileMenuOpen(false); }}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all mt-1 ${activeTab === ViewState.ADMIN ? 'bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
             >
               <LayoutDashboard size={20} /> {t.admin}
             </button>
           )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
           <button 
             onClick={() => setIsFeedbackModalOpen(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-2"
           >
              <MessageSquare size={20} /> Feedback
           </button>
           <button 
             onClick={() => setIsHelpModalOpen(true)}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mb-2"
           >
              <HelpCircle size={20} /> {t.help}
           </button>
           <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
              <div 
                className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setIsProfileModalOpen(true)}
              >
                  <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full bg-slate-700" />
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center gap-1">
                         <p className="text-sm font-bold truncate text-slate-900 dark:text-white">
                            {user.coverName || user.name}
                         </p>
                         {user.isPremium && (
                            <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10 flex-shrink-0" />
                         )}
                     </div>
                     <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
              </div>
              <button onClick={handleLogout} className="text-slate-500 hover:text-red-500 transition-colors" title={t.logOut}>
                 <LogOut size={18} />
              </button>
           </div>
        </div>
      </nav>
      {/* Main Content (Header, Views etc.) */}
      <main className="md:ml-64 min-h-screen relative">
         <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-900 dark:text-white">
               <Menu size={24} />
            </button>
            <div className="flex-1 max-w-xl mx-4 relative hidden sm:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder={language === 'en' ? "Search movies, shows, channels..." : "মুভি, শো, চ্যানেল খুঁজুন..."}
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-full py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
               />
            </div>
            <div className="flex items-center gap-3">
               <button onClick={toggleLanguage} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Change Language">
                  <Globe size={20} />
               </button>
               <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" title="Toggle Theme">
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
               </button>
               <div className="relative">
                  <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative">
                     <Bell size={20} />
                     {user.notifications && user.notifications.some(n => !n.read) && (
                        <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0f172a]"></span>
                     )}
                  </button>
                  {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in-up">
                       <div className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                          {t.notifications}
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                          {user.notifications && user.notifications.length > 0 ? (
                             user.notifications.map(n => (
                               <div key={n.id} className="p-4 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <p className="text-sm text-slate-800 dark:text-gray-200">{n.text}</p>
                                  <p className="text-xs text-slate-500 mt-1">{new Date(n.date).toLocaleDateString()}</p>
                               </div>
                             ))
                          ) : (
                             <div className="p-8 text-center text-slate-500 text-sm">{t.noNotifications}</div>
                          )}
                       </div>
                    </div>
                  )}
               </div>
            </div>
         </header>
         
         {activeTab === ViewState.HOME && renderHome()}
         {activeTab === ViewState.LIVE_TV && renderLiveTv()}
         {activeTab === ViewState.MOVIES && (
            <div className="p-8 pb-20">
               <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                 <Film className="text-purple-500" /> {t.movies}
               </h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                 {movies.map(movie => (
                   <div 
                      key={movie.id} 
                      className="aspect-[2/3] relative rounded-xl overflow-hidden cursor-pointer group bg-slate-200 dark:bg-slate-800"
                      onClick={() => handleShowDetails(movie)}
                   >
                      <img src={movie.thumbnailUrl} alt={movie.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                         <h4 className="text-white font-bold">{movie.title}</h4>
                         <span className="text-xs text-gray-300 mt-1">{movie.year} • {movie.category}</span>
                         <button className="mt-3 px-4 py-2 bg-blue-600 rounded-full text-white text-xs font-bold">{t.moreInfo}</button>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
         )}
         {activeTab === ViewState.PREMIUM && (
            <div className="p-8 flex justify-center pb-20">
               <div className="max-w-5xl w-full">
                  <div className="text-center mb-12">
                     <span className="inline-block p-3 rounded-full bg-yellow-500/10 text-yellow-500 mb-4"><Crown size={32} /></span>
                     <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">{t.upgradeText}</h2>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-8">
                     {/* Free Plan */}
                     <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free</h3>
                        <div className="mt-4 flex items-baseline text-slate-900 dark:text-white">
                           <span className="text-4xl font-bold tracking-tight">৳0</span>
                           <span className="ml-1 text-xl font-semibold text-slate-500">/mo</span>
                        </div>
                        <ul className="mt-8 space-y-4">
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-green-500" /> SD Quality (480p)</li>
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-green-500" /> Limited Content</li>
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-green-500" /> Ads Included</li>
                        </ul>
                        <button className="w-full mt-8 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Current Plan</button>
                     </div>

                     {/* Monthly Plan */}
                     <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-blue-500 relative transform scale-105 shadow-2xl">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider">POPULAR</div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Monthly Premium</h3>
                        <div className="mt-4 flex items-baseline text-slate-900 dark:text-white">
                           <span className="text-4xl font-bold tracking-tight">৳120</span>
                           <span className="ml-1 text-xl font-semibold text-slate-500">/mo</span>
                        </div>
                        <ul className="mt-8 space-y-4">
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-blue-500" /> HD & 4K Quality</li>
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-blue-500" /> All Content Access</li>
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-blue-500" /> Ad-Free Experience</li>
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-blue-500" /> Offline Downloads</li>
                        </ul>
                        <button 
                           onClick={() => handleSelectPlan('Monthly')}
                           className="w-full mt-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30"
                        >
                           Subscribe Now
                        </button>
                     </div>
                     
                     {/* Yearly Plan */}
                     <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Yearly</h3>
                        <div className="mt-4 flex items-baseline text-slate-900 dark:text-white">
                           <span className="text-4xl font-bold tracking-tight">৳1000</span>
                           <span className="ml-1 text-xl font-semibold text-slate-500">/yr</span>
                        </div>
                        <ul className="mt-8 space-y-4">
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-green-500" /> All Monthly Benefits</li>
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-green-500" /> Save ৳440 Yearly</li>
                           <li className="flex items-center gap-3 text-slate-600 dark:text-gray-300"><Check size={18} className="text-green-500" /> Priority Support</li>
                        </ul>
                        <button 
                           onClick={() => handleSelectPlan('Yearly')}
                           className="w-full mt-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity"
                        >
                           Subscribe Now
                        </button>
                     </div>
                  </div>
                  
                  {/* bKash Payment Info with Verification */}
                  <div ref={paymentRef} className="mt-12 bg-pink-600 text-white p-6 rounded-2xl shadow-xl transition-all duration-500 ease-in-out">
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6 border-b border-pink-500/50 pb-6">
                          <div className="flex items-center gap-4">
                             <div className="bg-white p-2 rounded-lg">
                                <span className="text-pink-600 font-black text-xl">bKash</span>
                             </div>
                             <div>
                                <h4 className="font-bold text-lg">{t.howToPay}</h4>
                                <p className="text-pink-100 text-sm">{t.bkashInstruction}</p>
                             </div>
                          </div>
                          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30 text-center">
                              <p className="text-xs font-bold uppercase tracking-wider mb-1">{t.personalNumber}</p>
                              <p className="text-2xl font-mono font-bold tracking-widest select-all">01609843481</p>
                          </div>
                      </div>

                      {/* Transaction Input Area */}
                      <div className="bg-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm border border-white/10">
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="font-bold flex items-center gap-2">
                                 <CheckCircle size={18} /> Verify Payment
                             </h4>
                             {selectedPlan && (
                                <span className="text-xs bg-white text-pink-600 font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                                    Selected: {selectedPlan} Plan
                                </span>
                             )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 mb-3">
                              {/* Account Number Input */}
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-pink-300">
                                      <Smartphone size={18} />
                                  </div>
                                  <input 
                                      type="text" 
                                      placeholder="Your bKash Account Number" 
                                      value={userBkashNumber}
                                      onChange={(e) => setUserBkashNumber(e.target.value)}
                                      className="w-full bg-white text-pink-600 font-mono placeholder:text-pink-300 pl-10 pr-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-white"
                                  />
                              </div>

                              {/* TrxID Input */}
                              <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-pink-300">
                                      <CreditCard size={18} />
                                  </div>
                                  <input 
                                      type="text" 
                                      placeholder="Transaction ID (TrxID)" 
                                      value={trxId}
                                      onChange={(e) => setTrxId(e.target.value)}
                                      className="w-full bg-white text-pink-600 font-mono placeholder:text-pink-300 pl-10 pr-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-white"
                                  />
                              </div>
                          </div>

                          <button 
                              onClick={handleVerifyPayment}
                              disabled={isVerifyingTrx || !trxId || !userBkashNumber}
                              className="w-full bg-white text-pink-600 font-bold px-6 py-3 rounded-lg hover:bg-pink-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                              {isVerifyingTrx ? 'Checking...' : 'Submit Payment Info'}
                          </button>

                          {paymentStatus === 'success' && (
                              <div className="mt-4 p-4 bg-green-600 rounded-xl shadow-lg border border-green-400 flex items-center gap-3 animate-fade-in">
                                  <div className="bg-white rounded-full p-1">
                                    <Check size={20} className="text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-lg">Payment Verified!</p>
                                    <p className="text-green-100 text-sm">Your Premium subscription is now active.</p>
                                  </div>
                              </div>
                          )}
                          
                          {paymentStatus === 'pending' && (
                              <div className="mt-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-400/50 flex items-center gap-3 animate-fade-in">
                                  <div className="bg-yellow-500 rounded-full p-1 text-white">
                                    <Clock size={20} />
                                  </div>
                                  <div>
                                    <p className="font-bold text-lg">Verification Pending</p>
                                    <p className="text-yellow-100 text-sm">Admin will verify your transaction shortly.</p>
                                  </div>
                              </div>
                          )}

                          {paymentStatus === 'error' && (
                              <div className="mt-3 text-sm font-bold bg-red-500/20 text-white p-2 rounded border border-red-400/30 flex items-center gap-2">
                                  <XCircle size={16} /> Invalid Input. Please check and try again.
                              </div>
                          )}
                      </div>
                  </div>
               </div>
            </div>
         )}
         
         {activeTab === ViewState.ADMIN && (
            <div className="p-8 pb-20">
               {/* Admin Layout */}
               <div className="flex flex-col md:flex-row gap-8">
                  {/* Admin Sidebar */}
                  <div className="w-full md:w-64 space-y-2">
                     <button onClick={() => setAdminSection('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${adminSection === 'dashboard' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {t.dashboard}
                     </button>
                     <button onClick={() => setAdminSection('transactions')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${adminSection === 'transactions' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <span className="flex items-center gap-2"><CreditCard size={16}/> Transactions</span>
                     </button>
                     <button onClick={() => setAdminSection('content')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${adminSection === 'content' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {t.manageContent}
                     </button>
                     <button onClick={() => setAdminSection('channels')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${adminSection === 'channels' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {t.manageChannels}
                     </button>
                     <button onClick={() => setAdminSection('users')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${adminSection === 'users' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {t.manageUsers}
                     </button>
                     <button onClick={() => setAdminSection('inbox')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${adminSection === 'inbox' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {t.manageInbox}
                     </button>
                     <button onClick={() => setAdminSection('settings')} className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${adminSection === 'settings' ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        {t.settings}
                     </button>
                  </div>

                  {/* Admin Content Area */}
                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                      {adminSection === 'dashboard' && (
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                               <p className="text-sm text-blue-600 dark:text-blue-400 font-bold uppercase">{t.totalUsers}</p>
                               <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{allUsers.length}</p>
                            </div>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                               <p className="text-sm text-purple-600 dark:text-purple-400 font-bold uppercase">{t.totalMovies}</p>
                               <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{movies.length}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                               <p className="text-sm text-green-600 dark:text-green-400 font-bold uppercase">{t.totalChannels}</p>
                               <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{channels.length}</p>
                            </div>
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                               <p className="text-sm text-orange-600 dark:text-orange-400 font-bold uppercase">{t.revenue}</p>
                               <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">৳{parseInt(transactions.reduce((acc, curr) => curr.status === 'approved' ? acc + parseInt(curr.amount) : acc, 12500).toString())}</p>
                            </div>
                         </div>
                      )}

                      {/* Transaction Management */}
                      {adminSection === 'transactions' && (
                          <div>
                              <div className="flex justify-between items-center mb-6">
                                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transaction Requests</h3>
                              </div>
                              <div className="overflow-x-auto">
                                  <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                      <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase font-bold text-slate-500">
                                          <tr>
                                              <th className="p-4">User</th>
                                              <th className="p-4">bKash Number</th>
                                              <th className="p-4">TrxID</th>
                                              <th className="p-4">Plan</th>
                                              <th className="p-4">Status</th>
                                              <th className="p-4">Actions</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {transactions.length === 0 ? (
                                              <tr><td colSpan={6} className="p-8 text-center">No transactions found.</td></tr>
                                          ) : (
                                              transactions.map(tx => (
                                                  <tr key={tx.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                      <td className="p-4 font-medium text-slate-900 dark:text-white">
                                                          {tx.userName}<br/>
                                                          <span className="text-xs text-slate-500">{tx.userEmail}</span>
                                                      </td>
                                                      <td className="p-4 font-mono">{tx.bkashNumber}</td>
                                                      <td className="p-4 font-mono">{tx.trxId}</td>
                                                      <td className="p-4">
                                                          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-1 rounded text-xs font-bold">
                                                              {tx.plan}
                                                          </span>
                                                      </td>
                                                      <td className="p-4">
                                                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                              tx.status === 'approved' ? 'bg-green-100 text-green-600' : 
                                                              tx.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                                                              'bg-yellow-100 text-yellow-600'
                                                          }`}>
                                                              {tx.status}
                                                          </span>
                                                      </td>
                                                      <td className="p-4 flex gap-2">
                                                          {tx.status === 'pending' && (
                                                              <>
                                                                  <button 
                                                                      onClick={() => handleApproveTransaction(tx.id)}
                                                                      className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded hover:bg-green-200 dark:hover:bg-green-900/50"
                                                                      title="Approve"
                                                                  >
                                                                      <Check size={16} />
                                                                  </button>
                                                                  <button 
                                                                      onClick={() => handleRejectTransaction(tx.id)}
                                                                      className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded hover:bg-red-200 dark:hover:bg-red-900/50"
                                                                      title="Reject"
                                                                  >
                                                                      <X size={16} />
                                                                  </button>
                                                              </>
                                                          )}
                                                          {tx.status !== 'pending' && (
                                                              <span className="text-xs text-gray-400 italic">Completed</span>
                                                          )}
                                                      </td>
                                                  </tr>
                                              ))
                                          )}
                                      </tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                      
                      {/* Content Management */}
                      {adminSection === 'content' && (
                         <div>
                            <div className="flex justify-between items-center mb-6">
                               <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.manageContent}</h3>
                               <button onClick={() => { setEditingItem(null); setIsContentModalOpen(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-500">
                                  <Plus size={16} /> {t.addContent}
                                </button>
                            </div>
                            <div className="space-y-4">
                               {movies.map(m => (
                                  <div key={m.id} className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                     <img src={m.thumbnailUrl} alt={m.title} className="w-16 h-10 object-cover rounded bg-slate-200" />
                                     <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{m.title}</h4>
                                        <p className="text-xs text-slate-500">{m.category} • {m.year}</p>
                                     </div>
                                     <div className="flex items-center gap-2">
                                        <button onClick={() => { setEditingItem(m); setIsContentModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit size={18} /></button>
                                        <button onClick={() => handleDeleteContent(m.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash size={18} /></button>
                                     </div>
                                  </div>
                               ))}
                            </div>
                         </div>
                      )}

                      {/* Channels Management */}
                      {adminSection === 'channels' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.manageChannels}</h3>
                                <button 
                                  onClick={() => { setEditingItem(null); setPreviewLogo(null); setIsChannelModalOpen(true); }} 
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-500"
                                >
                                    <Plus size={16} /> {t.addChannel}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {channels.map(channel => (
                                    <div key={channel.id} className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                        <img src={channel.logo} alt={channel.name} className="w-12 h-12 object-contain bg-white rounded-full p-1" />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 dark:text-white truncate">{channel.name}</h4>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">{channel.category}</span>
                                                <span className="text-[10px] uppercase bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{channel.streamType || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button 
                                              onClick={() => { setEditingItem(channel); setPreviewLogo(null); setIsChannelModalOpen(true); }} 
                                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                            >
                                              <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteChannel(channel.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"><Trash size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                      )}
                      
                      {/* User Management */}
                       {adminSection === 'users' && (
                         <div>
                            <div className="flex justify-between items-center mb-6">
                               <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.manageUsers}</h3>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                <thead className="bg-slate-100 dark:bg-slate-700/50 text-xs uppercase font-bold text-slate-500">
                                  <tr>
                                    <th className="p-4">{t.fullName}</th>
                                    <th className="p-4">{t.emailAddress}</th>
                                    <th className="p-4">{t.type}</th>
                                    <th className="p-4">{t.actions}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {allUsers.map(u => (
                                    <tr key={u.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                      <td className="p-4 font-medium text-slate-900 dark:text-white">{u.name}</td>
                                      <td className="p-4">{u.email}</td>
                                      <td className="p-4">
                                         {u.isAdmin ? <span className="text-purple-500 font-bold">Admin</span> : (u.isPremium ? <span className="text-yellow-500 font-bold">Premium</span> : 'Free')}
                                      </td>
                                      <td className="p-4 flex gap-2">
                                         <button 
                                            onClick={() => toggleUserPremium(u.id)}
                                            className={`p-1.5 rounded ${u.isPremium ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'} hover:opacity-80`}
                                            title={u.isPremium ? "Revoke Premium" : "Make Premium"}
                                         >
                                            <Crown size={14} className={u.isPremium ? "fill-orange-600" : ""} />
                                         </button>
                                         <button onClick={() => { setEditingItem(u); setIsUserModalOpen(true); }} className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50"><Edit size={14} /></button>
                                         <button onClick={() => { setEditingItem(u); setIsNotificationModalOpen(true); }} className="p-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50"><Bell size={14} /></button>
                                         <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 rounded hover:bg-red-200 dark:hover:bg-red-900/50"><Trash size={14} /></button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                         </div>
                      )}

                      {/* Inbox / Feedback Management */}
                      {adminSection === 'inbox' && (
                        <div>
                           <div className="flex justify-between items-center mb-6">
                              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.manageInbox}</h3>
                           </div>
                           {feedbacks.length === 0 ? (
                             <div className="text-center py-20 text-slate-500">No feedback received yet.</div>
                           ) : (
                             <div className="space-y-4">
                               {feedbacks.map(fb => (
                                 <div key={fb.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-700/30">
                                    <div className="flex justify-between items-start mb-2">
                                       <div className="flex items-center gap-2">
                                          {fb.type === 'bug' ? (
                                            <span className="bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                              <Bug size={12} /> Bug Report
                                            </span>
                                          ) : (
                                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
                                              <MessageSquarePlus size={12} /> General Feedback
                                            </span>
                                          )}
                                          <span className="text-xs text-slate-400">{fb.date.toLocaleString()}</span>
                                       </div>
                                       <span className="text-xs font-medium text-slate-500 dark:text-slate-400">User: {fb.userName}</span>
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap">{fb.text}</p>
                                 </div>
                               ))}
                             </div>
                           )}
                        </div>
                      )}

                      {/* Settings Management */}
                      {adminSection === 'settings' && (
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.settings}</h3>
                            
                            {/* Theme Settings */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Sparkles size={20} className="text-purple-500" /> Appearance
                                </h4>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">Theme Mode</p>
                                        <p className="text-sm text-slate-500">Switch between light and dark themes</p>
                                    </div>
                                    <div className="flex bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                                        <button 
                                            onClick={() => { if(theme !== 'light') toggleTheme(); }}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            Light
                                        </button>
                                        <button 
                                            onClick={() => { if(theme !== 'dark') toggleTheme(); }}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-slate-600 text-white shadow' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                                        >
                                            Dark
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Branding Settings (Mock) */}
                            <div className="p-6 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Settings size={20} className="text-blue-500" /> General Settings
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Application Name</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                value={appName}
                                                onChange={(e) => setAppName(e.target.value)}
                                                className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white outline-none focus:border-blue-500"
                                            />
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                      )}
                  </div>
               </div>
            </div>
         )}
      </main>

      {/* Video Player Modal */}
      {selectedContent && (
        <VideoPlayer 
           content={selectedContent} 
           onClose={handleClosePlayer}
           isLive={isContentLive(selectedContent)} 
           onNext={handlePlayerNext}
           onPrev={handlePlayerPrev}
           isMinimized={isPlayerMinimized}
           onToggleMinimize={() => setIsPlayerMinimized(!isPlayerMinimized)}
           startTime={startPlaybackTime}
           onProgressUpdate={handleVideoProgress}
        />
      )}

      {/* Details Modal */}
      {detailsContent && renderContentDetails()}

      {/* Help Modal */}
      {isHelpModalOpen && renderHelpModal()}

      {/* Profile Settings Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex justify-between items-start">
                 <div>
                   <h2 className="text-xl font-bold flex items-center gap-2"><UserIcon /> Profile Settings</h2>
                   <p className="text-blue-100 text-sm mt-1">Update your personal information</p>
                 </div>
                 <button onClick={() => setIsProfileModalOpen(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.fullName}</label>
                    <input 
                      name="name" 
                      defaultValue={user.name} 
                      className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.coverName}</label>
                    <input 
                      name="coverName" 
                      defaultValue={user.coverName} 
                      placeholder="Display Name (Optional)"
                      className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <p className="text-xs text-slate-400 mt-1">This name will be displayed on your profile instead of your full name.</p>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.profilePhoto}</label>
                    <input 
                      name="avatar" 
                      defaultValue={user.avatar} 
                      placeholder="Avatar URL"
                      className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                 </div>
                 
                 <div className="pt-2 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsProfileModalOpen(false)}
                      className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      {t.cancel}
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/30"
                    >
                       {t.save}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex justify-between items-start">
                 <div>
                   <h2 className="text-xl font-bold flex items-center gap-2"><MessageSquare /> Share Feedback</h2>
                   <p className="text-blue-100 text-sm mt-1">Help us improve your experience</p>
                 </div>
                 <button onClick={() => setIsFeedbackModalOpen(false)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Feedback Type</label>
                    <div className="flex gap-4">
                       <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${feedbackType === 'feedback' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          <input 
                            type="radio" 
                            name="feedbackType" 
                            value="feedback" 
                            checked={feedbackType === 'feedback'}
                            onChange={() => setFeedbackType('feedback')}
                            className="hidden" 
                          />
                          <MessageSquarePlus size={18} />
                          <span className="font-medium text-sm">General</span>
                       </label>
                       <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${feedbackType === 'bug' ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-600 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                          <input 
                            type="radio" 
                            name="feedbackType" 
                            value="bug" 
                            checked={feedbackType === 'bug'}
                            onChange={() => setFeedbackType('bug')}
                            className="hidden" 
                          />
                          <Bug size={18} />
                          <span className="font-medium text-sm">Bug Report</span>
                       </label>
                    </div>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Message</label>
                    <textarea 
                       value={feedbackText}
                       onChange={(e) => setFeedbackText(e.target.value)}
                       placeholder="Tell us what you think or report an issue..."
                       className="w-full p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                       required
                    />
                 </div>

                 <div className="pt-2">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                       <Send size={18} /> Submit Feedback
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Content Edit Modal (Admin) */}
      {isContentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{editingItem ? t.edit : t.addContent}</h3>
              <form onSubmit={handleSaveContent} className="space-y-4">
                 <input name="title" defaultValue={editingItem?.title} placeholder="Title" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 <textarea name="description" defaultValue={editingItem?.description} placeholder="Description" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white h-24" />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <select name="category" defaultValue={editingItem?.category || 'Action'} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                        {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select name="type" defaultValue={editingItem?.type || 'movie'} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                        <option value="movie">Movie</option>
                        <option value="series">Series</option>
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <input name="year" type="number" defaultValue={editingItem?.year || new Date().getFullYear()} placeholder="Year" className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                    <input name="rating" type="number" step="0.1" max="5" defaultValue={editingItem?.rating || 4.5} placeholder="Rating (0-5)" className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 </div>

                 <input name="thumbnailUrl" defaultValue={editingItem?.thumbnailUrl} placeholder="Thumbnail URL" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 <input name="videoUrl" defaultValue={editingItem?.videoUrl} placeholder="Video URL" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 
                 <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsContentModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">{t.cancel}</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">{t.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* User Edit Modal (Admin) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Edit User</h3>
              <form onSubmit={handleSaveUser} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input name="name" defaultValue={editingItem?.name} placeholder="Full Name" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.coverName}</label>
                    <input name="coverName" defaultValue={editingItem?.coverName} placeholder="Cover Name" className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.emailAddress}</label>
                    <input name="email" defaultValue={editingItem?.email} placeholder="Email" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t.profilePhoto}</label>
                    <input name="avatar" defaultValue={editingItem?.avatar} placeholder="Avatar URL" className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 </div>
                 <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">{t.cancel}</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">{t.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Notification Modal */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{t.sendNotification}</h3>
              <div className="space-y-4">
                 <p className="text-sm text-slate-500">To: {editingItem?.name}</p>
                 <textarea 
                    value={notificationText}
                    onChange={(e) => setNotificationText(e.target.value)}
                    placeholder={t.notificationMessage}
                    className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white h-32" 
                 />
                 <div className="flex justify-end gap-3">
                    <button onClick={() => setIsNotificationModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">{t.cancel}</button>
                    <button onClick={handleSendNotification} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">{t.send}</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Channel Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{editingItem ? 'Edit Channel' : t.addChannel}</h3>
              <form onSubmit={handleSaveChannel} className="space-y-4">
                 <input name="name" defaultValue={editingItem?.name} placeholder="Channel Name" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 
                 <input name="currentProgram" defaultValue={editingItem?.currentProgram} placeholder="Current Program (e.g. News, Live Sports)" className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{t.logoUpload}</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoFileChange}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                 </div>
                 <div className="text-center text-xs text-slate-400 font-bold uppercase">- OR -</div>
                 <input name="logo" defaultValue={editingItem?.logo} placeholder="Logo URL" className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 {previewLogo && <img src={previewLogo} alt="Preview" className="w-16 h-16 object-contain bg-slate-900 rounded-lg mx-auto" />}

                 <div className="grid grid-cols-2 gap-4">
                    <select name="category" defaultValue={editingItem?.category || 'Sports'} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                        {['Sports', 'News', 'Entertainment', 'Movies', 'Kids', 'Music', 'Religious'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select name="streamType" defaultValue={editingItem?.streamType || 'm3u8'} className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white">
                        <option value="m3u8">M3U8 / HLS</option>
                        <option value="embed">Embed (Iframe)</option>
                        <option value="youtube">YouTube</option>
                        <option value="video">Direct Video File (MP4)</option>
                    </select>
                 </div>

                 <input name="streamUrl" defaultValue={editingItem?.streamUrl} placeholder="Stream URL" required className="w-full p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-900 dark:text-white" />
                 <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsChannelModalOpen(false)} className="px-4 py-2 text-slate-500 hover:text-slate-900 dark:hover:text-white">{t.cancel}</button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">{t.save}</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <GeminiAssistant 
        language={language}
        messages={chatMessages}
        onSendMessage={handleChatSendMessage}
        isLoading={isChatLoading}
        setLoading={setIsChatLoading}
      />
    </div>
  );
}