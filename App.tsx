import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Info, Users, Crown, Shield, Edit, Clock, Tv, Film, 
  Home, DownloadCloud, LayoutDashboard, Menu, Search, Globe, 
  Sun, Moon, Bell, LogOut, X, Camera, Check, CreditCard, 
  MessageSquare, HelpCircle, User as UserIcon, Plus, Trash,
  Upload, Sparkles, Smartphone, CheckCircle, AlertCircle, 
  DollarSign, Ticket, Image as ImageIcon, Video, Mic, Smartphone as Phone,
  FileText, Lock, Mail, ChevronRight, Facebook, Send, ArrowLeft, Share2, List, BadgeCheck, BellRing, MapPin, Code
} from 'lucide-react';
import LoginScreen from './components/LoginScreen';
import IntroAnimation from './components/IntroAnimation';
import VideoPlayer from './components/VideoPlayer';
import GeminiAssistant from './components/GeminiAssistant';
import { User, MediaContent, Channel, ViewState, ChatMessage, WatchHistoryItem, PaymentTransaction, Feedback, SubscriptionPlan, Coupon } from './types';
import { INITIAL_USERS, MOCK_CHANNELS, MOCK_CONTENT, TRANSLATIONS, CATEGORIES, INITIAL_PLANS, INITIAL_COUPONS, INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [viewState, setViewState] = useState<ViewState>(ViewState.HOME);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search History State
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Profile Form State
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');

  // Data
  const [movies, setMovies] = useState<MediaContent[]>(MOCK_CONTENT);
  const [channels, setChannels] = useState<Channel[]>(MOCK_CHANNELS);
  const [allUsers, setAllUsers] = useState<User[]>(INITIAL_USERS);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>(INITIAL_TRANSACTIONS);
  
  // Admin State
  const [adminTab, setAdminTab] = useState<'dashboard' | 'users' | 'movies' | 'livetv' | 'finance'>('dashboard');
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  
  // Help Modal State
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Player State
  const [currentContent, setCurrentContent] = useState<MediaContent | Channel | null>(null);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);
  const [playerStartTime, setPlayerStartTime] = useState(0);

  // Details Modal State
  const [selectedContent, setSelectedContent] = useState<MediaContent | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'support', text: 'Hello! How can I help you today?', timestamp: new Date() }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Modals & Forms State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false); // For Movies/Series
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false); // For LiveTV
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [previewChannelLogo, setPreviewChannelLogo] = useState<string | null>(null);
  const [notificationText, setNotificationText] = useState('');

  // Premium/Payment State
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPaymentVerifying, setIsPaymentVerifying] = useState(false);

  // Derived State
  const t = TRANSLATIONS[language];
  const heroContent = movies[0];
  const unreadCount = user?.notifications?.filter(n => !n.read).length || 0;

  // Initialize Theme & Load History
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
        try {
            setSearchHistory(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to parse search history", e);
        }
    }
  }, []);

  // Sync Profile State with User
  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileAvatar(user.avatar || '');
    }
  }, [user]);

  // Helpers
  const getContinueWatchingContent = () => {
    return watchHistory.map(h => {
      const content = movies.find(m => m.id === h.contentId);
      if (!content) return null;
      return {
        ...content,
        displayTitle: content.title,
        displayThumbnail: content.thumbnailUrl,
        progress: h.progress,
        timestamp: h.timestamp,
        currentEpisodeId: h.episodeId
      };
    }).filter(Boolean);
  };

  const handlePlay = (item: MediaContent | Channel, startTime: number = 0) => {
    // Access Control for Premium Content
    if (item.isPremium && !user?.isPremium) {
       if (confirm("This is Premium content. Upgrade to watch?")) {
           setViewState(ViewState.PREMIUM);
       }
       return;
    }

    setCurrentContent(item);
    setPlayerStartTime(startTime);
    setIsPlayerMinimized(false);
  };

  const handleContentSelect = (content: MediaContent) => {
    setSelectedContent(content);
  };

  const handleCloseDetails = () => {
    setSelectedContent(null);
    setIsDownloadMenuOpen(false);
  };

  const handlePlayerNext = () => {
    if (!currentContent) return;
    if ('streamType' in currentContent) {
        // Live TV Channel Logic
        const idx = channels.findIndex(c => c.id === currentContent.id);
        if (idx !== -1) {
            const nextIdx = (idx + 1) % channels.length;
            setCurrentContent(channels[nextIdx]);
        }
    } else {
        // Movie/Content Logic - For now, maybe just loop movies for demo
        // In a real app, this would play next episode
    }
  };

  const handlePlayerPrev = () => {
    if (!currentContent) return;
    if ('streamType' in currentContent) {
        // Live TV Channel Logic
        const idx = channels.findIndex(c => c.id === currentContent.id);
        if (idx !== -1) {
            const prevIdx = (idx - 1 + channels.length) % channels.length;
            setCurrentContent(channels[prevIdx]);
        }
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    const existing = allUsers.find(u => u.id === loggedInUser.id);
    if (!existing) {
        setAllUsers([...allUsers, loggedInUser]);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setViewState(ViewState.HOME);
  };

  const handleSendMessage = (text: string, role: 'user' | 'model' | 'support') => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role,
      text,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleProgressUpdate = (currentTime: number, duration: number) => {
    if (!currentContent || !('id' in currentContent)) return;
    if (!('streamUrl' in currentContent)) {
        const progress = (currentTime / duration) * 100;
        setWatchHistory(prev => {
            const existingIdx = prev.findIndex(h => h.contentId === currentContent.id);
            const newItem: WatchHistoryItem = {
                contentId: currentContent.id,
                progress,
                timestamp: currentTime,
                duration,
                lastWatched: Date.now()
            };
            if (existingIdx >= 0) {
                const newHistory = [...prev];
                newHistory[existingIdx] = newItem;
                return newHistory;
            }
            return [...prev, newItem];
        });
    }
  };

  // --- Search History Helpers ---
  const saveSearchToHistory = (query: string) => {
      if (!query.trim()) return;
      // Add new query to top, remove duplicates, keep max 5
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          saveSearchToHistory(searchQuery);
          setIsSearchFocused(false);
      }
  };

  const handleHistoryClick = (historyItem: string) => {
      setSearchQuery(historyItem);
      saveSearchToHistory(historyItem);
      setIsSearchFocused(false);
  };

  const clearSearchHistory = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); 
      setSearchHistory([]);
      localStorage.removeItem('searchHistory');
  };

  // --- Profile Helpers ---
  const handleProfileAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Validate Password if changed
    if (profilePassword) {
        if (profilePassword !== profileConfirmPassword) {
            alert("Passwords do not match!");
            return;
        }
        if (profilePassword.length < 6) {
             alert("Password must be at least 6 characters.");
             return;
        }
    }

    const updatedUser = {
        ...user,
        name: profileName,
        email: profileEmail,
        avatar: profileAvatar,
        // In a real app, you would handle password hashing here
    };

    setUser(updatedUser);
    setAllUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
    
    // If password changed, clear fields
    if (profilePassword) {
        setProfilePassword('');
        setProfileConfirmPassword('');
        alert("Profile and password updated successfully!");
    } else {
        alert("Profile updated successfully!");
    }
  };

  // --- CRUD Handlers ---

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChannelLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewChannelLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const avatar = previewAvatar || (formData.get('avatar') as string) || editingItem?.avatar;
      const isPremium = formData.get('isPremium') === 'on';
      const isAdmin = formData.get('isAdmin') === 'on';
      
      if (editingItem) {
          // Edit Mode
          setAllUsers(allUsers.map(u => u.id === editingItem.id ? { ...u, name, email, avatar, isPremium, isAdmin } : u));
          if (user && user.id === editingItem.id) {
               setUser({ ...user, name, email, avatar, isPremium, isAdmin });
          }
      } else {
          // Add Mode
          const newUser: User = {
              id: `user-${Date.now()}`,
              name,
              email,
              avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
              isPremium,
              isAdmin: isAdmin
          };
          setAllUsers([...allUsers, newUser]);
      }
      setIsUserModalOpen(false);
      setEditingItem(null);
      setPreviewAvatar(null);
  };

  const handleDeleteUser = (id: string) => {
      if (window.confirm("Are you sure you want to delete this user?")) {
        setAllUsers(allUsers.filter(u => u.id !== id));
      }
  };

  const handleSendNotification = () => {
      if (!editingItem || !notificationText) return;
      
      const newNotification = {
          id: `notif-${Date.now()}`,
          text: notificationText,
          date: new Date(),
          read: false
      };

      setAllUsers(prev => prev.map(u => {
          if (u.id === editingItem.id) {
              return {
                  ...u,
                  notifications: [newNotification, ...(u.notifications || [])]
              };
          }
          return u;
      }));

      // If sending to self
      if (user && user.id === editingItem.id) {
          setUser(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  notifications: [newNotification, ...(prev.notifications || [])]
              };
          });
      }

      alert(`Notification sent to ${editingItem.name}`);
      setIsNotifyModalOpen(false);
      setNotificationText('');
      setEditingItem(null);
  };

  const handleMarkNotificationsRead = () => {
      if (!user) return;
      const updatedUser = {
          ...user,
          notifications: user.notifications?.map(n => ({...n, read: true})) || []
      };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  const handleDeleteNotification = (notifId: string) => {
      if (!user) return;
      const updatedUser = {
          ...user,
          notifications: user.notifications?.filter(n => n.id !== notifId) || []
      };
      setUser(updatedUser);
      setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  const handleSaveContent = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const title = formData.get('title') as string;
      const category = formData.get('category') as string;
      const type = formData.get('type') as 'movie' | 'series';
      const videoUrl = formData.get('videoUrl') as string;
      const thumbnailUrl = formData.get('thumbnailUrl') as string;
      const isPremium = formData.get('isPremium') === 'on';
      
      if (editingItem) {
          setMovies(movies.map(m => m.id === editingItem.id ? { 
            ...m, 
            title, 
            category, 
            type, 
            videoUrl, 
            isPremium,
            thumbnailUrl: thumbnailUrl || m.thumbnailUrl
          } : m));
      } else {
          const newContent: MediaContent = {
              id: `mov-${Date.now()}`,
              title,
              category,
              type,
              description: 'New content description',
              thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1000&q=80',
              videoUrl: videoUrl || '',
              rating: 0,
              year: new Date().getFullYear(),
              duration: '0m',
              isPremium
          };
          setMovies([...movies, newContent]);
      }
      setIsContentModalOpen(false);
      setEditingItem(null);
  };

  const handleDeleteContent = (id: string) => {
      if(window.confirm("Delete this content?")) {
          setMovies(movies.filter(m => m.id !== id));
      }
  };

  const handleSaveChannel = (e: React.FormEvent) => {
      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const name = formData.get('name') as string;
      const streamUrl = formData.get('streamUrl') as string;
      const logo = previewChannelLogo || (formData.get('logo') as string) || editingItem?.logo || 'https://via.placeholder.com/150';
      const category = formData.get('category') as string;
      const isPremium = formData.get('isPremium') === 'on';

      if(editingItem) {
          setChannels(channels.map(c => c.id === editingItem.id ? { ...c, name, streamUrl, logo, category, isPremium } : c));
      } else {
          const newChannel: Channel = {
              id: `ch-${Date.now()}`,
              name,
              streamUrl,
              logo: logo,
              currentProgram: 'Live Stream',
              category: category || 'General',
              isPremium
          };
          setChannels([...channels, newChannel]);
      }
      setIsChannelModalOpen(false);
      setEditingItem(null);
      setPreviewChannelLogo(null);
  };

   const handleDeleteChannel = (id: string) => {
      if(window.confirm("Delete this channel?")) {
          setChannels(channels.filter(c => c.id !== id));
      }
  };

  const handleSavePlan = (id: string, price: number) => {
      setPlans(plans.map(p => p.id === id ? { ...p, price } : p));
  };

  const handleAddCoupon = (code: string, amount: number) => {
      if(!code || !amount) return;
      const newCoupon: Coupon = {
          id: `cpn-${Date.now()}`,
          code,
          discountAmount: amount,
          isActive: true
      };
      setCoupons([...coupons, newCoupon]);
  };

  const handleDeleteCoupon = (id: string) => {
      setCoupons(coupons.filter(c => c.id !== id));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPlan) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const senderNumber = formData.get('senderNumber') as string;
    const trxId = formData.get('trxId') as string;

    setIsPaymentVerifying(true);
    // Simulate auto-detect delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsPaymentVerifying(false);

    const newTrx: PaymentTransaction = {
        id: `trx-${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        bkashNumber: senderNumber,
        trxId: trxId,
        plan: selectedPlan.name,
        amount: selectedPlan.price.toString(),
        status: 'pending',
        date: new Date()
    };

    setTransactions([...transactions, newTrx]);
    alert("Payment submitted successfully! Admin will verify your Transaction ID and activate premium shortly.");
    setSelectedPlan(null);
  };

  const handleApprovePayment = (trxId: string) => {
    const trx = transactions.find(t => t.id === trxId);
    if (!trx) return;

    setTransactions(transactions.map(t => t.id === trxId ? { ...t, status: 'approved' } : t));

    setAllUsers(allUsers.map(u => {
        if (u.id === trx.userId) {
            return {
                ...u,
                isPremium: true,
                paymentDetails: {
                    accountNumber: trx.bkashNumber,
                    transactionId: trx.trxId,
                    method: 'bKash',
                    lastPaymentDate: new Date()
                }
            };
        }
        return u;
    }));
    
    if (user && user.id === trx.userId) {
        setUser({
             ...user,
                isPremium: true,
                paymentDetails: {
                    accountNumber: trx.bkashNumber,
                    transactionId: trx.trxId,
                    method: 'bKash',
                    lastPaymentDate: new Date()
                }
        });
    }
  };

  const handleRejectPayment = (trxId: string) => {
     setTransactions(transactions.map(t => t.id === trxId ? { ...t, status: 'rejected' } : t));
  };


  // --- Render Functions ---

  const renderContentDetailsModal = () => {
    if (!selectedContent) return null;
    
    const relatedContent = movies.filter(m => 
      m.category === selectedContent.category && m.id !== selectedContent.id
    ).slice(0, 4);

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
        <div className="bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] border border-slate-700">
          {/* Close Button */}
          <button 
              onClick={handleCloseDetails}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-red-600 rounded-full text-white transition-colors"
          >
              <X size={24} />
          </button>

          {/* Hero / Banner */}
          <div className="relative w-full aspect-video md:aspect-[21/9] shrink-0">
               <img src={selectedContent.thumbnailUrl} className="w-full h-full object-cover" />
               {selectedContent.isPremium && (
                 <div className="absolute top-6 left-6 z-20 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                   <Crown size={16} fill="black" /> Premium
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
               <div className="absolute bottom-0 left-0 p-6 md:p-10 w-full">
                   <h2 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg leading-tight">{selectedContent.title}</h2>
                   <div className="flex items-center gap-4 text-sm md:text-base text-slate-300 mb-6 font-medium">
                       <span className="text-green-400 font-bold flex items-center gap-1"><Sparkles size={14}/> {selectedContent.rating} Match</span>
                       <span>{selectedContent.year}</span>
                       <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{selectedContent.category}</span>
                       <span>{selectedContent.duration}</span>
                       {selectedContent.type === 'series' && <span>{selectedContent.episodes?.length || 0} Episodes</span>}
                   </div>
                   
                   <div className="flex flex-wrap gap-4">
                       <button 
                          onClick={() => { handlePlay(selectedContent); handleCloseDetails(); }}
                          className="bg-white text-black px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
                       >
                           {selectedContent.isPremium && !user?.isPremium ? <Lock size={20} /> : <Play fill="black" size={20} />} 
                           {selectedContent.isPremium && !user?.isPremium ? 'Upgrade to Watch' : 'Play'}
                       </button>

                       {!selectedContent.isPremium && (
                       <div className="relative">
                           <button 
                               onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                               className="bg-slate-700/80 text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-600 transition-colors border border-slate-600"
                           >
                               <DownloadCloud size={20} /> Download
                           </button>
                           {isDownloadMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-30 animate-fade-in">
                                    <div className="p-3 border-b border-slate-700 bg-slate-900/50">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase">Select Quality</h4>
                                    </div>
                                    {[
                                        { label: 'High (1080p)', size: '1.2 GB' }, 
                                        { label: 'Medium (720p)', size: '700 MB' }, 
                                        { label: 'Low (480p)', size: '350 MB' }
                                    ].map((opt) => (
                                        <button 
                                        key={opt.label}
                                        onClick={() => {
                                            alert(`Starting download: ${selectedContent.title} - ${opt.label}`);
                                            setIsDownloadMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-between group"
                                        >
                                        <span>{opt.label}</span>
                                        <span className="text-xs text-slate-500 group-hover:text-blue-400">{opt.size}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                       </div>
                       )}

                       <button className="p-3.5 border border-slate-500 rounded-full hover:bg-slate-800 text-white hover:border-white transition-colors" title="My List">
                           <Plus size={20} />
                       </button>
                       <button className="p-3.5 border border-slate-500 rounded-full hover:bg-slate-800 text-white hover:border-white transition-colors" title="Share">
                           <Share2 size={20} />
                       </button>
                   </div>
               </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-900">
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 md:gap-12">
                  {/* Left Column: Description & Cast */}
                  <div className="space-y-8">
                      <div>
                          <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2"><Info size={20} className="text-blue-500"/> Synopsis</h3>
                          <p className="text-slate-300 leading-relaxed text-base md:text-lg">
                              {selectedContent.description}
                          </p>
                      </div>
                      
                      {/* Cast */}
                      <div>
                          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 tracking-wider">Cast & Crew</h3>
                          <div className="flex flex-wrap gap-2 text-sm text-slate-300">
                               {selectedContent.cast?.map((actor, i) => (
                                   <span key={i} className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 transition-colors cursor-default">{actor}</span>
                               )) || (
                                 <>
                                   <span className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">Actor One</span>
                                   <span className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">Actor Two</span>
                                   <span className="bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">Director Name</span>
                                 </>
                               )}
                          </div>
                      </div>

                      {/* Meta info */}
                      <div className="grid grid-cols-2 gap-6 text-sm text-slate-400 border-t border-slate-800 pt-6">
                          <div>
                              <span className="block text-slate-500 font-bold mb-1 uppercase text-xs">Genre</span>
                              <span className="text-white">{selectedContent.category}</span>
                          </div>
                          <div>
                              <span className="block text-slate-500 font-bold mb-1 uppercase text-xs">Maturity Rating</span>
                              <span className="text-white border border-slate-600 px-1.5 rounded text-xs">PG-13</span>
                          </div>
                      </div>
                  </div>

                  {/* Right Column: Episodes or Related */}
                  <div className="space-y-6">
                      {selectedContent.type === 'series' && selectedContent.episodes ? (
                          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                                  <List size={18} className="text-purple-500" /> Episodes
                              </h3>
                              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                  {selectedContent.episodes.map((ep, idx) => (
                                      <div 
                                          key={ep.id} 
                                          className="flex gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                          onClick={() => { 
                                              handlePlay(selectedContent); 
                                              handleCloseDetails();
                                          }}
                                      >
                                          <div className="relative w-24 aspect-video bg-slate-800 rounded overflow-hidden flex-shrink-0">
                                              <img src={ep.thumbnailUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"/>
                                              <div className="absolute inset-0 flex items-center justify-center">
                                                  <Play size={12} fill="white" className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                              </div>
                                          </div>
                                          <div className="min-w-0">
                                              <h4 className="text-slate-200 font-medium text-sm line-clamp-1 group-hover:text-white">{idx + 1}. {ep.title}</h4>
                                              <p className="text-slate-500 text-xs mt-0.5">{ep.duration}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ) : (
                          <div>
                              <h3 className="text-lg font-bold text-white mb-4">More Like This</h3>
                              <div className="grid grid-cols-2 gap-3">
                                  {relatedContent.length > 0 ? relatedContent.map(rc => (
                                      <div 
                                          key={rc.id} 
                                          className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer group border border-slate-700"
                                          onClick={() => { setSelectedContent(rc); }}
                                      >
                                          <img src={rc.thumbnailUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full border border-white/30">
                                                  <Info size={16} className="text-white" />
                                              </div>
                                          </div>
                                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black to-transparent">
                                              <p className="text-white text-xs font-bold truncate">{rc.title}</p>
                                          </div>
                                      </div>
                                  )) : (
                                      <div className="col-span-2 text-slate-500 text-sm italic">No related content found.</div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-50 text-slate-900'}`}>
        {showIntro ? (
            <IntroAnimation onComplete={() => setShowIntro(false)} />
        ) : !user ? (
            <LoginScreen 
                onLogin={handleLogin} 
                language={language} 
                onToggleLanguage={() => setLanguage(prev => prev === 'en' ? 'bn' : 'en')} 
                translations={t} 
            />
        ) : (
            <>
                {/* Sidebar */}
                <aside className={`fixed lg:relative z-40 w-64 h-full bg-slate-900 border-r border-slate-800 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                    <div className="p-6 flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                           <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                              <Play fill="white" className="text-white ml-1" size={20} />
                           </div>
                           <h1 className="text-2xl font-black tracking-tight">sumonflix<span className="text-blue-500">.net</span></h1>
                        </div>
                        {/* Mobile Menu Back/Close Button */}
                        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                    </div>
                    
                    <nav className="px-4 space-y-1">
                        <button 
                            onClick={() => { setViewState(ViewState.HOME); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.HOME ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Home size={20} />
                            <span className="font-semibold">{t.home}</span>
                        </button>
                        <button 
                            onClick={() => { setViewState(ViewState.MOVIES); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.MOVIES ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Film size={20} />
                            <span className="font-semibold">{t.movies}</span>
                        </button>
                        <button 
                            onClick={() => { setViewState(ViewState.LIVE_TV); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.LIVE_TV ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Tv size={20} />
                            <span className="font-semibold">{t.liveTv}</span>
                        </button>
                        <button 
                            onClick={() => { setViewState(ViewState.SEARCH); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.SEARCH ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Search size={20} />
                            <span className="font-semibold">{t.search}</span>
                        </button>
                         <button 
                            onClick={() => { setViewState(ViewState.DOWNLOADS); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.DOWNLOADS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <DownloadCloud size={20} />
                            <span className="font-semibold">{t.downloads}</span>
                        </button>
                        
                        {/* Notifications Button */}
                        <button 
                            onClick={() => { setViewState(ViewState.NOTIFICATIONS); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.NOTIFICATIONS ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'} relative`}
                        >
                            <BellRing size={20} />
                            <span className="font-semibold">{t.notifications}</span>
                            {unreadCount > 0 && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Help Button */}
                        <button 
                            onClick={() => { setIsHelpModalOpen(true); setIsMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-slate-400 hover:text-white hover:bg-white/5"
                        >
                            <HelpCircle size={20} />
                            <span className="font-semibold">{t.help || 'Help'}</span>
                        </button>

                        {/* Premium Subscription Button */}
                        <button 
                            onClick={() => { setViewState(ViewState.PREMIUM); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.PREMIUM ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-lg shadow-amber-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Crown size={20} className={viewState === ViewState.PREMIUM ? 'text-white' : 'text-yellow-500'} />
                            <span className="font-semibold">{t.premium}</span>
                        </button>

                        {user.isAdmin && (
                            <button 
                                onClick={() => { setViewState(ViewState.ADMIN); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${viewState === ViewState.ADMIN ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <LayoutDashboard size={20} />
                                <span className="font-semibold">{t.admin}</span>
                            </button>
                        )}
                    </nav>

                    <div className="absolute bottom-6 left-0 right-0 px-6">
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
                             <div className="flex items-center gap-3 mb-3">
                                 <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full bg-slate-700" />
                                 <div className="min-w-0">
                                     <h4 className="font-bold text-sm truncate flex items-center gap-1">
                                         {user.name}
                                         {user.isPremium && <BadgeCheck size={14} className="text-blue-500" />}
                                     </h4>
                                     <p className="text-xs text-slate-500 truncate">{user.isPremium ? 'Premium Member' : 'Free Plan'}</p>
                                 </div>
                             </div>
                             {!user.isPremium && (
                                 <button 
                                    onClick={() => setViewState(ViewState.PREMIUM)}
                                    className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-1 mb-2"
                                 >
                                     <Crown size={12} /> Upgrade
                                 </button>
                             )}
                             <button 
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-xs font-medium py-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
                             >
                                 <LogOut size={12} /> {t.logOut}
                             </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                     {/* Mobile Header */}
                     <header className="lg:hidden flex items-center justify-between p-4 sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
                         <div className="flex items-center gap-3">
                             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300 hover:text-white">
                                 <Menu size={24} />
                             </button>
                             <h1 className="text-xl font-black">sumonflix</h1>
                         </div>
                         <img src={user.avatar} className="w-8 h-8 rounded-full" />
                     </header>

                     {/* Content based on State */}
                     <div className="p-4 lg:p-8 pb-24 max-w-[1600px] mx-auto">
                         {/* ... (Previous Views: HOME, MOVIES, LIVE_TV, SEARCH, DOWNLOADS) ... */}
                         {viewState === ViewState.HOME && (
                             <div className="space-y-8 animate-fade-in">
                                 {/* Continue Watching */}
                                 {watchHistory.length > 0 && (
                                     <div>
                                         <h3 className="text-xl font-bold text-white mb-4">Continue Watching</h3>
                                         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                             {getContinueWatchingContent().map(item => (
                                                 <div key={item.id} className="group relative cursor-pointer" onClick={() => handlePlay(item, item.timestamp)}>
                                                     <div className="aspect-video rounded-xl overflow-hidden mb-2 relative">
                                                         <img src={item.thumbnailUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                                         <div className="absolute inset-0 flex items-center justify-center">
                                                             <Play size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="white"/>
                                                         </div>
                                                         <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700">
                                                             <div className="h-full bg-blue-500" style={{ width: `${item.progress}%` }}></div>
                                                         </div>
                                                     </div>
                                                     <h4 className="font-bold text-sm truncate">{item.title}</h4>
                                                     <p className="text-xs text-slate-500">{Math.round(item.timestamp / 60)}m left</p>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 )}

                                 {/* Live TV Gallery Layout */}
                                 {['News', 'Sports', 'Entertainment'].map(cat => {
                                      const catChannels = channels.filter(c => c.category === cat);
                                      if (catChannels.length === 0) return null;
                                      
                                      return (
                                          <div key={`home-cat-${cat}`} className="mb-8">
                                              <div className="flex items-center justify-between mb-4">
                                                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                      <span className="w-1 h-6 bg-blue-600 rounded-full mr-2"></span>
                                                      {cat === 'Entertainment' ? 'Entertainment' : cat} Channels
                                                  </h3>
                                              </div>
                                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                  {catChannels.map(channel => (
                                                      <div 
                                                          key={channel.id} 
                                                          onClick={() => handlePlay(channel)}
                                                          className="group relative aspect-square bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
                                                      >
                                                          {channel.isPremium && (
                                                            <div className="absolute top-2 right-2 z-20 bg-yellow-500 text-black px-1.5 py-0.5 rounded-md text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                                                                <Crown size={10} fill="black" /> PRO
                                                            </div>
                                                          )}

                                                          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">
                                                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                                              LIVE
                                                          </div>

                                                          {/* Logo Container */}
                                                          <div className="absolute inset-0 flex items-center justify-center p-6 bg-slate-900/50 group-hover:bg-slate-900/30 transition-colors">
                                                              <img 
                                                                src={channel.logo} 
                                                                alt={channel.name}
                                                                className="w-full h-full object-contain drop-shadow-xl transition-transform duration-500 group-hover:scale-110" 
                                                              />
                                                          </div>

                                                          {/* Hover Overlay */}
                                                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 backdrop-blur-[2px]">
                                                              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                                                   <Play fill="white" className="ml-1" size={24} />
                                                              </div>
                                                          </div>

                                                          {/* Bottom Info */}
                                                          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                                                              <h4 className="text-white font-bold text-sm text-center truncate">{channel.name}</h4>
                                                          </div>
                                                      </div>
                                                  ))}
                                              </div>
                                          </div>
                                      );
                                 })}

                                 {/* Categories */}
                                 {CATEGORIES.slice(1).map(cat => {
                                     const catMovies = movies.filter(m => m.category === cat);
                                     if (catMovies.length === 0) return null;
                                     return (
                                         <div key={cat}>
                                             <div className="flex items-center justify-between mb-4">
                                                 <h3 className="text-xl font-bold text-white">{cat} Movies</h3>
                                                 <button className="text-xs font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider">View All</button>
                                             </div>
                                             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                                 {catMovies.map(movie => (
                                                     <div key={movie.id} className="group cursor-pointer" onClick={() => handleContentSelect(movie)}>
                                                         <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative shadow-lg bg-slate-800">
                                                             <img src={movie.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                             {movie.isPremium && (
                                                                <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-md">
                                                                    <Crown size={10} fill="black" /> Premium
                                                                </div>
                                                             )}
                                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                                 <div className="flex items-center gap-2 mb-2">
                                                                     <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black">
                                                                         <Play size={12} fill="black" />
                                                                     </div>
                                                                     <div className="w-8 h-8 rounded-full bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                                                         <Plus size={16} />
                                                                     </div>
                                                                 </div>
                                                                 <p className="text-green-400 text-xs font-bold">{movie.rating} Rating</p>
                                                                 <p className="text-slate-300 text-xs">{movie.year} • {movie.duration}</p>
                                                             </div>
                                                         </div>
                                                         <h4 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">{movie.title}</h4>
                                                         <p className="text-xs text-slate-500">{movie.category}</p>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     );
                                 })}
                             </div>
                         )}

                         {viewState === ViewState.MOVIES && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold">{t.movies}</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {movies.map(movie => (
                                        <div key={movie.id} className="group cursor-pointer" onClick={() => handleContentSelect(movie)}>
                                            <div className="aspect-[2/3] rounded-xl overflow-hidden mb-3 relative shadow-lg bg-slate-800">
                                                <img src={movie.thumbnailUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                {movie.isPremium && (
                                                    <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-md">
                                                        <Crown size={10} fill="black" /> Premium
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                     <button onClick={(e) => { e.stopPropagation(); handlePlay(movie); }} className="w-full bg-white text-black font-bold py-2 rounded-lg mb-2 flex items-center justify-center gap-2 text-sm">
                                                         {movie.isPremium && !user?.isPremium ? <Lock size={14} /> : <Play size={14} fill="black" />}
                                                         {movie.isPremium && !user?.isPremium ? 'Upgrade' : 'Play'}
                                                     </button>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors truncate">{movie.title}</h4>
                                        </div>
                                    ))}
                                </div>
                            </div>
                         )}

                         {viewState === ViewState.LIVE_TV && (
                             <div className="space-y-6 animate-fade-in">
                                 <h2 className="text-2xl font-bold flex items-center gap-2">
                                     {t.liveTv} <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                                 </h2>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                     {channels.map(channel => (
                                         <div 
                                             key={channel.id} 
                                             onClick={() => handlePlay(channel)}
                                             className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-900/20 cursor-pointer group relative"
                                         >
                                             {channel.isPremium && (
                                                <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-md">
                                                    <Crown size={10} fill="black" /> Premium
                                                </div>
                                             )}
                                             <div className="p-4 flex items-center gap-4 border-b border-slate-700 bg-slate-800/50">
                                                 <img src={channel.logo} className="w-12 h-12 rounded-lg object-contain bg-white/5 p-1" />
                                                 <div className="min-w-0">
                                                     <h3 className="font-bold text-white truncate">{channel.name}</h3>
                                                     <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Live Now</p>
                                                 </div>
                                             </div>
                                             <div className="p-4">
                                                 <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
                                                     <Tv size={14} />
                                                     <span className="truncate">{channel.currentProgram}</span>
                                                 </div>
                                                 <button className="w-full bg-slate-700 hover:bg-blue-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 group-hover:bg-blue-600">
                                                     <Play size={16} fill="white" /> Watch Live
                                                 </button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         )}

                         {viewState === ViewState.SEARCH && (
                            <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
                                {/* Search Logic ... */}
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onKeyDown={handleSearchKeyDown}
                                        placeholder={t.trySearching}
                                        className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-2xl px-6 py-4 pl-14 text-white text-lg outline-none transition-all shadow-xl"
                                        autoFocus
                                    />
                                    <Search className="absolute left-5 top-5 text-slate-500" size={24} />
                                    {searchQuery && (
                                        <button onClick={() => setSearchQuery('')} className="absolute right-5 top-5 text-slate-500 hover:text-white">
                                            <X size={24} />
                                        </button>
                                    )}

                                    {/* Search History Dropdown */}
                                    {isSearchFocused && searchHistory.length > 0 && !searchQuery && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20">
                                            <div className="flex justify-between items-center px-4 py-2 border-b border-slate-700 bg-slate-900/50">
                                                <span className="text-xs font-bold text-slate-500 uppercase">Recent Searches</span>
                                                <button onClick={clearSearchHistory} className="text-xs text-red-400 hover:text-red-300">Clear All</button>
                                            </div>
                                            {searchHistory.map((item, idx) => (
                                                <button 
                                                    key={idx} 
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors text-left"
                                                    onMouseDown={() => handleHistoryClick(item)} 
                                                >
                                                    <Clock size={16} />
                                                    {item}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {searchQuery && (
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-4">{t.resultsFor} "{searchQuery}"</h3>
                                        {movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {movies.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                                                    <div key={m.id} className="group cursor-pointer" onClick={() => handleContentSelect(m)}>
                                                        <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 relative">
                                                            <img src={m.thumbnailUrl} className="w-full h-full object-cover" />
                                                            {m.isPremium && (
                                                                <div className="absolute top-2 right-2 z-10 bg-yellow-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 shadow-md">
                                                                    <Crown size={10} fill="black" /> Premium
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h4 className="font-bold text-slate-200">{m.title}</h4>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-slate-500">
                                                <Search size={48} className="mx-auto mb-4 opacity-20" />
                                                <p>{t.noResults}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                         )}
                         
                         {viewState === ViewState.DOWNLOADS && (
                             <div className="text-center py-20 animate-fade-in">
                                 <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                     <DownloadCloud size={48} className="text-slate-600" />
                                 </div>
                                 <h2 className="text-2xl font-bold text-white mb-2">{t.noDownloads}</h2>
                                 <p className="text-slate-400">Download movies and shows to watch offline.</p>
                             </div>
                         )}

                         {viewState === ViewState.NOTIFICATIONS && (
                            <div className="max-w-4xl mx-auto py-8 animate-fade-in">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <BellRing size={24} className="text-blue-500" /> 
                                        Notifications
                                    </h2>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={handleMarkNotificationsRead}
                                            className="text-sm text-blue-400 hover:text-white font-medium hover:underline"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {user.notifications && user.notifications.length > 0 ? (
                                        user.notifications.map((notif) => (
                                            <div 
                                                key={notif.id} 
                                                className={`bg-slate-800 rounded-xl p-5 border transition-colors relative group ${notif.read ? 'border-slate-700 opacity-80' : 'border-blue-500/50 shadow-lg shadow-blue-900/20'}`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`w-2 h-2 rounded-full ${notif.read ? 'bg-slate-500' : 'bg-blue-500'}`}></div>
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                                Admin Message
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {new Date(notif.date).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{notif.text}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleDeleteNotification(notif.id)}
                                                        className="p-2 text-slate-500 hover:text-red-400 rounded-full hover:bg-slate-700/50 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Delete"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                                            <Bell size={48} className="mx-auto mb-4 text-slate-600" />
                                            <p className="text-slate-400 font-medium">{t.noNotifications}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                         )}

                         {viewState === ViewState.ADMIN && user.isAdmin && (
                             <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 animate-fade-in">
                                 <div className="flex items-center gap-4 mb-8">
                                     <div className="p-3 bg-purple-600 rounded-xl">
                                         <LayoutDashboard size={24} className="text-white" />
                                     </div>
                                     <div>
                                         <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
                                         <p className="text-slate-400">Manage content, users, and settings</p>
                                     </div>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                     <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                         <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Total Users</h3>
                                         <p className="text-4xl font-black text-white">{allUsers.length}</p>
                                     </div>
                                     <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                         <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Total Movies</h3>
                                         <p className="text-4xl font-black text-white">{movies.length}</p>
                                     </div>
                                     <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                                         <h3 className="text-slate-400 text-sm font-bold uppercase mb-2">Live Channels</h3>
                                         <p className="text-4xl font-black text-white">{channels.length}</p>
                                     </div>
                                 </div>
                                 {/* Admin Tabs */}
                                 <div className="flex gap-4 border-b border-slate-700 mb-6 overflow-x-auto">
                                     {['dashboard', 'users', 'movies', 'livetv', 'finance'].map((tab) => (
                                         <button 
                                            key={tab}
                                            onClick={() => setAdminTab(tab as any)}
                                            className={`px-4 py-2 border-b-2 font-medium capitalize whitespace-nowrap ${adminTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                                         >
                                             {tab === 'livetv' ? 'Live TV' : tab}
                                         </button>
                                     ))}
                                 </div>
                                 
                                 {adminTab === 'users' && (
                                     <div className="animate-fade-in">
                                         <div className="flex justify-between items-center mb-4">
                                             <h3 className="text-xl font-bold text-white">Manage Users</h3>
                                             <button onClick={() => { setEditingItem(null); setIsUserModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                                 <Plus size={16} /> Add User
                                             </button>
                                         </div>
                                         <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left">
                                                     <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                                                         <tr>
                                                             <th className="p-4">User</th>
                                                             <th className="p-4">Email</th>
                                                             <th className="p-4">Status</th>
                                                             <th className="p-4">Role</th>
                                                             <th className="p-4">Actions</th>
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-slate-700">
                                                         {allUsers.map(u => (
                                                             <tr key={u.id} className="hover:bg-slate-700/30 transition-colors">
                                                                 <td className="p-4">
                                                                     <div className="flex items-center gap-3">
                                                                         <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full bg-slate-700" />
                                                                         <span className="font-bold text-white">{u.name}</span>
                                                                     </div>
                                                                 </td>
                                                                 <td className="p-4 text-slate-300">{u.email}</td>
                                                                 <td className="p-4">
                                                                     {u.isPremium ? (
                                                                         <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30 flex items-center gap-1 w-fit">
                                                                             <Crown size={12} /> Premium
                                                                         </span>
                                                                     ) : (
                                                                         <span className="bg-slate-700 text-slate-400 px-2 py-1 rounded text-xs">Free</span>
                                                                     )}
                                                                 </td>
                                                                 <td className="p-4">
                                                                    {u.isAdmin ? <span className="text-purple-400 font-bold text-xs uppercase">Admin</span> : <span className="text-slate-500 text-xs uppercase">User</span>}
                                                                 </td>
                                                                 <td className="p-4">
                                                                     <div className="flex gap-2">
                                                                         <button 
                                                                            onClick={() => { setEditingItem(u); setNotificationText(''); setIsNotifyModalOpen(true); }}
                                                                            className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors"
                                                                            title="Send Notification"
                                                                         >
                                                                            <Bell size={16} />
                                                                         </button>
                                                                         <button 
                                                                            onClick={() => { setEditingItem(u); setIsUserModalOpen(true); }}
                                                                            className="p-2 bg-purple-600/20 text-purple-400 rounded hover:bg-purple-600 hover:text-white transition-colors"
                                                                            title="Edit User"
                                                                         >
                                                                            <Edit size={16} />
                                                                         </button>
                                                                         <button 
                                                                            onClick={() => handleDeleteUser(u.id)}
                                                                            className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                                                                            title="Delete User"
                                                                         >
                                                                            <Trash size={16} />
                                                                         </button>
                                                                     </div>
                                                                 </td>
                                                             </tr>
                                                         ))}
                                                     </tbody>
                                                 </table>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {adminTab === 'movies' && (
                                     <div className="animate-fade-in">
                                         <div className="flex justify-between items-center mb-4">
                                             <h3 className="text-xl font-bold text-white">Manage Movies & Series</h3>
                                             <button onClick={() => { setEditingItem(null); setIsContentModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                                 <Plus size={16} /> Add Content
                                             </button>
                                         </div>
                                         <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left">
                                                     <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                                                         <tr>
                                                             <th className="p-4">Thumbnail</th>
                                                             <th className="p-4">Title</th>
                                                             <th className="p-4">Category</th>
                                                             <th className="p-4">Premium</th>
                                                             <th className="p-4">Actions</th>
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-slate-700">
                                                         {movies.map(movie => (
                                                             <tr key={movie.id} className="hover:bg-slate-700/30 transition-colors">
                                                                 <td className="p-4">
                                                                     <img src={movie.thumbnailUrl} className="w-12 h-16 object-cover rounded bg-slate-700" />
                                                                 </td>
                                                                 <td className="p-4 font-medium text-white">{movie.title}</td>
                                                                 <td className="p-4 text-slate-300">{movie.category}</td>
                                                                 <td className="p-4">
                                                                     {movie.isPremium ? (
                                                                         <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">Premium</span>
                                                                     ) : (
                                                                         <span className="bg-slate-700 text-slate-400 px-2 py-1 rounded text-xs">Free</span>
                                                                     )}
                                                                 </td>
                                                                 <td className="p-4">
                                                                     <div className="flex gap-2">
                                                                         <button onClick={() => { setEditingItem(movie); setIsContentModalOpen(true); }} className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors"><Edit size={16} /></button>
                                                                         <button onClick={() => handleDeleteContent(movie.id)} className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"><Trash size={16} /></button>
                                                                     </div>
                                                                 </td>
                                                             </tr>
                                                         ))}
                                                     </tbody>
                                                 </table>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {adminTab === 'livetv' && (
                                     <div className="animate-fade-in">
                                         <div className="flex justify-between items-center mb-4">
                                             <h3 className="text-xl font-bold text-white">Manage Live TV Channels</h3>
                                             <button onClick={() => { setEditingItem(null); setIsChannelModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                                                 <Plus size={16} /> Add Channel
                                             </button>
                                         </div>
                                         <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left">
                                                     <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                                                         <tr>
                                                             <th className="p-4">Logo</th>
                                                             <th className="p-4">Name</th>
                                                             <th className="p-4">Category</th>
                                                             <th className="p-4">Premium</th>
                                                             <th className="p-4">Actions</th>
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-slate-700">
                                                         {channels.map(channel => (
                                                             <tr key={channel.id} className="hover:bg-slate-700/30 transition-colors">
                                                                 <td className="p-4">
                                                                     <img src={channel.logo} className="w-10 h-10 object-contain bg-white/5 rounded p-1" />
                                                                 </td>
                                                                 <td className="p-4 font-medium text-white">{channel.name}</td>
                                                                 <td className="p-4 text-slate-300">{channel.category}</td>
                                                                 <td className="p-4">
                                                                     {channel.isPremium ? (
                                                                         <span className="bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">Premium</span>
                                                                     ) : (
                                                                         <span className="bg-slate-700 text-slate-400 px-2 py-1 rounded text-xs">Free</span>
                                                                     )}
                                                                 </td>
                                                                 <td className="p-4">
                                                                     <div className="flex gap-2">
                                                                         <button onClick={() => { setEditingItem(channel); setIsChannelModalOpen(true); }} className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors"><Edit size={16} /></button>
                                                                         <button onClick={() => handleDeleteChannel(channel.id)} className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"><Trash size={16} /></button>
                                                                     </div>
                                                                 </td>
                                                             </tr>
                                                         ))}
                                                     </tbody>
                                                 </table>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {adminTab === 'finance' && (
                                     <div className="animate-fade-in">
                                         <h3 className="text-xl font-bold text-white mb-4">Transaction Approvals</h3>
                                         <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                                             <div className="overflow-x-auto">
                                                 <table className="w-full text-left">
                                                     <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                                                         <tr>
                                                             <th className="p-4">Status</th>
                                                             <th className="p-4">User Info</th>
                                                             <th className="p-4">Plan Details</th>
                                                             <th className="p-4">Payment Info</th>
                                                             <th className="p-4">Date</th>
                                                             <th className="p-4">Actions</th>
                                                         </tr>
                                                     </thead>
                                                     <tbody className="divide-y divide-slate-700">
                                                         {transactions.length > 0 ? (
                                                             transactions.map(trx => (
                                                                 <tr key={trx.id} className="hover:bg-slate-700/30 transition-colors">
                                                                     <td className="p-4">
                                                                        {trx.status === 'pending' && (
                                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                                                                <Clock size={12} /> Pending
                                                                            </span>
                                                                        )}
                                                                        {trx.status === 'approved' && (
                                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                                                                                <CheckCircle size={12} /> Approved
                                                                            </span>
                                                                        )}
                                                                        {trx.status === 'rejected' && (
                                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                                                                <X size={12} /> Rejected
                                                                            </span>
                                                                        )}
                                                                     </td>
                                                                     <td className="p-4">
                                                                         <div className="font-bold text-white flex items-center gap-1">
                                                                            {trx.userName}
                                                                            {allUsers.find(u => u.id === trx.userId)?.isPremium && <BadgeCheck size={14} className="text-blue-500" />}
                                                                         </div>
                                                                         <div className="text-xs text-slate-400">{trx.userEmail}</div>
                                                                     </td>
                                                                     <td className="p-4">
                                                                         <div className="font-medium text-blue-400">{trx.plan}</div>
                                                                         <div className="text-xs text-slate-300 font-bold">৳{trx.amount}</div>
                                                                     </td>
                                                                     <td className="p-4">
                                                                         <div className="text-sm text-white font-mono">{trx.bkashNumber}</div>
                                                                         <div className="text-xs text-slate-400 font-mono">ID: {trx.trxId}</div>
                                                                     </td>
                                                                     <td className="p-4 text-sm text-slate-400">
                                                                         {new Date(trx.date).toLocaleDateString()}
                                                                     </td>
                                                                     <td className="p-4">
                                                                         {trx.status === 'pending' && (
                                                                             <div className="flex gap-2">
                                                                                 <button 
                                                                                    onClick={() => handleApprovePayment(trx.id)}
                                                                                    className="p-2 bg-green-600/20 text-green-400 rounded hover:bg-green-600 hover:text-white transition-colors"
                                                                                    title="Approve"
                                                                                 >
                                                                                     <Check size={16} />
                                                                                 </button>
                                                                                 <button 
                                                                                    onClick={() => handleRejectPayment(trx.id)}
                                                                                    className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors"
                                                                                    title="Reject"
                                                                                 >
                                                                                     <X size={16} />
                                                                                 </button>
                                                                             </div>
                                                                         )}
                                                                     </td>
                                                                 </tr>
                                                             ))
                                                         ) : (
                                                             <tr>
                                                                 <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                                                                     No transactions found.
                                                                 </td>
                                                             </tr>
                                                         )}
                                                     </tbody>
                                                 </table>
                                             </div>
                                         </div>
                                     </div>
                                 )}

                                 {!['movies', 'livetv', 'finance', 'users'].includes(adminTab) && (
                                    <div className="text-center py-12 text-slate-500">
                                        <p>Admin features for {adminTab} would be implemented here.</p>
                                    </div>
                                 )}
                             </div>
                         )}

                         {viewState === ViewState.PREMIUM && (
                             <div className="max-w-4xl mx-auto py-8 animate-fade-in">
                                 <div className="text-center mb-12">
                                     <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Choose Your Plan</h2>
                                     <p className="text-slate-400 text-lg">Unlock the full experience with our premium plans.</p>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                     {plans.map((plan) => (
                                         <div key={plan.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-6 relative hover:border-blue-500 transition-colors group">
                                             {plan.name.includes('Year') && (
                                                 <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-black text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">BEST VALUE</div>
                                             )}
                                             <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                             <div className="flex items-baseline gap-1 mb-6">
                                                 <span className="text-3xl font-black text-white">৳{plan.price}</span>
                                                 <span className="text-slate-500">/{plan.duration}</span>
                                             </div>
                                             <ul className="space-y-3 mb-8">
                                                 {plan.features.map((feat, i) => (
                                                     <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                         <Check size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                                         {feat}
                                                     </li>
                                                 ))}
                                             </ul>
                                             <button 
                                                onClick={() => setSelectedPlan(plan)}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                                             >
                                                 Choose Plan
                                             </button>
                                         </div>
                                     ))}
                                 </div>
                                 {/* Payment Modal would be here if selectedPlan is set */}
                                 {selectedPlan && (
                                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                         <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full relative">
                                             <button onClick={() => setSelectedPlan(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                                             <h3 className="text-xl font-bold text-white mb-6">Payment for {selectedPlan.name}</h3>
                                             <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                                 <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                                                     <p className="text-sm text-slate-400 mb-1">Send ৳{selectedPlan.price} to bKash Personal</p>
                                                     <div className="flex items-center justify-between">
                                                         <span className="text-lg font-bold text-white">01609843481</span>
                                                         <button type="button" className="text-blue-400 text-xs font-bold uppercase">Copy</button>
                                                     </div>
                                                 </div>
                                                 <input name="senderNumber" placeholder="Your bKash Number" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" required />
                                                 <input name="trxId" placeholder="Transaction ID (TrxID)" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500" required />
                                                 <button type="submit" disabled={isPaymentVerifying} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
                                                     {isPaymentVerifying ? 'Verifying...' : 'Submit Payment'}
                                                 </button>
                                                 <p className="text-xs text-slate-500 mt-4 text-center">Payment Problem? Call <a href="tel:09638580088" className="text-blue-400 hover:underline">09638580088</a></p>
                                             </form>
                                         </div>
                                     </div>
                                 )}
                             </div>
                         )}

                     </div>
                </main>
                
                {/* Floating Assistant */}
                <GeminiAssistant 
                    language={language}
                    messages={chatMessages}
                    onSendMessage={handleSendMessage}
                    isLoading={isChatLoading}
                    setLoading={setIsChatLoading}
                />

                {/* Video Player Overlay */}
                {currentContent && (
                    <VideoPlayer 
                        content={currentContent} 
                        onClose={() => { setCurrentContent(null); setIsPlayerMinimized(false); }}
                        isLive={'streamType' in currentContent}
                        onNext={handlePlayerNext}
                        onPrev={handlePlayerPrev}
                        isMinimized={isPlayerMinimized}
                        onToggleMinimize={() => setIsPlayerMinimized(!isPlayerMinimized)}
                        startTime={playerStartTime}
                        onProgressUpdate={handleProgressUpdate}
                    />
                )}

                {/* Modals */}
                {renderContentDetailsModal()}
                
                {/* Help Modal */}
                {isHelpModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full relative shadow-2xl">
                            <button onClick={() => setIsHelpModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                            
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                                    <HelpCircle size={32} className="text-blue-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Official Contact</h3>
                                <p className="text-slate-400 text-sm">We are here to help you</p>
                            </div>

                            <div className="space-y-4">
                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-start gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase mb-1">Address</h4>
                                        <p className="text-slate-300 text-sm">Vayadanga Bazare, Sreebardi Sherpur</p>
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-start gap-4">
                                     <div className="p-2 bg-green-500/10 rounded-lg text-green-500 mt-1">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white uppercase mb-1">Official Phone</h4>
                                        <a href="tel:01609843481" className="text-slate-300 text-sm hover:text-white">01609843481</a>
                                    </div>
                                </div>

                                <div className="border-t border-slate-700 pt-4 mt-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 text-center tracking-wider">Apps Developer Contact</h4>
                                    
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                                             <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                                <Code size={18} />
                                            </div>
                                             <div className="min-w-0">
                                                <p className="text-xs text-slate-500 font-bold uppercase">Developer Phone</p>
                                                <a href="tel:01307280088" className="text-slate-300 text-sm hover:text-white truncate block">01307280088</a>
                                            </div>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 flex items-center gap-3">
                                             <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                                                <Mail size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-slate-500 font-bold uppercase">Email</p>
                                                <a href="mailto:sumonflix.net@gmail.com" className="text-slate-300 text-sm hover:text-white truncate block">sumonflix.net@gmail.com</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-center">
                                <p className="text-xs text-slate-500 font-medium">Powered By <span className="text-blue-500">Sumon Network</span></p>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Admin Modals */}
                {isContentModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full relative">
                             <button onClick={() => setIsContentModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                             <h3 className="text-xl font-bold text-white mb-6">{editingItem ? 'Edit Content' : 'Add New Content'}</h3>
                             <form onSubmit={handleSaveContent} className="space-y-4">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Title</label>
                                     <input name="title" defaultValue={editingItem?.title} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" required />
                                 </div>
                                 <div className="grid grid-cols-2 gap-4">
                                     <div>
                                         <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                                         <select name="category" defaultValue={editingItem?.category || 'Action'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500">
                                             {CATEGORIES.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                                         </select>
                                     </div>
                                     <div>
                                         <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Type</label>
                                         <select name="type" defaultValue={editingItem?.type || 'movie'} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500">
                                             <option value="movie">Movie</option>
                                             <option value="series">Series</option>
                                         </select>
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thumbnail URL</label>
                                     <input name="thumbnailUrl" defaultValue={editingItem?.thumbnailUrl} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" required />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Video URL</label>
                                     <input name="videoUrl" defaultValue={editingItem?.videoUrl} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                                 </div>
                                 <div className="flex items-center gap-2 pt-2">
                                     <input type="checkbox" name="isPremium" id="isPremium" defaultChecked={editingItem?.isPremium} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-offset-0 focus:ring-0" />
                                     <label htmlFor="isPremium" className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer">
                                         <Crown size={14} className="text-yellow-500" fill="currentColor" /> Mark as Premium Content
                                     </label>
                                 </div>
                                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-4">Save Content</button>
                             </form>
                        </div>
                    </div>
                )}

                {isChannelModalOpen && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                         <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full relative">
                              <button onClick={() => setIsChannelModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                              <h3 className="text-xl font-bold text-white mb-6">{editingItem ? 'Edit Channel' : 'Add New Channel'}</h3>
                              <form onSubmit={handleSaveChannel} className="space-y-4">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Channel Name</label>
                                      <input name="name" defaultValue={editingItem?.name} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" required />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                                      <input 
                                         list="categories" 
                                         name="category" 
                                         defaultValue={editingItem?.category} 
                                         className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" 
                                         placeholder="Select or type a category..."
                                      />
                                      <datalist id="categories">
                                          <option value="Sports" />
                                          <option value="News" />
                                          <option value="Entertainment" />
                                          <option value="Movies" />
                                          <option value="Music" />
                                          <option value="Kids" />
                                      </datalist>
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Stream URL (.m3u8 / Embed)</label>
                                      <input name="streamUrl" defaultValue={editingItem?.streamUrl} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" required />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Logo URL</label>
                                      <div className="flex gap-2">
                                          <input name="logo" defaultValue={editingItem?.logo} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="https://..." />
                                          <div className="relative">
                                              <input type="file" onChange={handleChannelLogoFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                              <button type="button" className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg border border-slate-600"><Upload size={20}/></button>
                                          </div>
                                      </div>
                                      {previewChannelLogo && <img src={previewChannelLogo} className="w-10 h-10 mt-2 object-contain bg-white/10 rounded" />}
                                  </div>
                                  <div className="flex items-center gap-2 pt-2">
                                     <input type="checkbox" name="isPremium" id="isChannelPremium" defaultChecked={editingItem?.isPremium} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-offset-0 focus:ring-0" />
                                     <label htmlFor="isChannelPremium" className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer">
                                         <Crown size={14} className="text-yellow-500" fill="currentColor" /> Mark as Premium Channel
                                     </label>
                                 </div>
                                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-4">Save Channel</button>
                              </form>
                         </div>
                     </div>
                )}

                {isUserModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-lg w-full relative">
                             <button onClick={() => setIsUserModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                             <h3 className="text-xl font-bold text-white mb-6">{editingItem ? 'Edit User' : 'Add New User'}</h3>
                             <form onSubmit={handleSaveUser} className="space-y-4">
                                 <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                                     <input name="name" defaultValue={editingItem?.name} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" required />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                                     <input type="email" name="email" defaultValue={editingItem?.email} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" required />
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Avatar URL</label>
                                     <div className="flex gap-2">
                                        <input name="avatar" defaultValue={editingItem?.avatar} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="https://..." />
                                        <div className="relative">
                                            <input type="file" onChange={handleAvatarFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                                            <button type="button" className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg border border-slate-600"><Upload size={20}/></button>
                                        </div>
                                     </div>
                                     {previewAvatar && <img src={previewAvatar} className="w-10 h-10 mt-2 rounded-full object-cover bg-slate-700" />}
                                 </div>
                                 <div className="flex flex-col gap-3 pt-2">
                                     <div className="flex items-center gap-2">
                                         <input type="checkbox" name="isPremium" id="isUserPremium" defaultChecked={editingItem?.isPremium} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-offset-0 focus:ring-0" />
                                         <label htmlFor="isUserPremium" className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer">
                                             <Crown size={14} className="text-yellow-500" fill="currentColor" /> Premium User Status
                                         </label>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         <input type="checkbox" name="isAdmin" id="isUserAdmin" defaultChecked={editingItem?.isAdmin} className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-offset-0 focus:ring-0" />
                                         <label htmlFor="isUserAdmin" className="text-sm font-bold text-white flex items-center gap-2 cursor-pointer">
                                             <Shield size={14} className="text-purple-500" fill="currentColor" /> Admin Privileges
                                         </label>
                                     </div>
                                 </div>
                                 <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors mt-4">Save User</button>
                             </form>
                        </div>
                    </div>
                )}

                {isNotifyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full relative">
                             <button onClick={() => setIsNotifyModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20}/></button>
                             <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-600/20 rounded-full text-blue-500">
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Send Notification</h3>
                                    <p className="text-xs text-slate-400">To: {editingItem?.name}</p>
                                </div>
                             </div>
                             
                             <textarea 
                                value={notificationText}
                                onChange={(e) => setNotificationText(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 min-h-[120px] mb-4 resize-none"
                                placeholder="Type your message here..."
                                autoFocus
                             />
                             
                             <button 
                                onClick={handleSendNotification}
                                disabled={!notificationText.trim()}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                             >
                                 <Send size={18} /> Send Message
                             </button>
                        </div>
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default App;