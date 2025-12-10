import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Settings, SkipForward, SkipBack, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Captions, Sliders, ArrowLeft, PictureInPicture, Minimize2, Maximize2, Volume1, Download, Check, Loader } from 'lucide-react';
import { MediaContent, Channel } from '../types';

interface VideoPlayerProps {
  content: MediaContent | Channel;
  onClose: () => void;
  isLive?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  startTime?: number;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  content, 
  onClose, 
  isLive = false, 
  onNext, 
  onPrev,
  isMinimized = false,
  onToggleMinimize,
  startTime = 0,
  onProgressUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  
  // Initialize playback rate from localStorage
  const [playbackRate, setPlaybackRate] = useState(() => {
      try {
          const saved = localStorage.getItem('sumonflix-playback-rate');
          return saved ? parseFloat(saved) : 1;
      } catch { return 1; }
  });

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number | null>(null); // null means off
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showNextEpisodeBtn, setShowNextEpisodeBtn] = useState(false);
  const [showChannelOSD, setShowChannelOSD] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [hlsInstance, setHlsInstance] = useState<any>(null);
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  
  // Download State
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'downloaded'>('idle');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);

  // Quality State
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const qualities = ['Auto', '1080p', '720p', '480p', '360p'];

  // Volume OSD
  const [volumeOSD, setVolumeOSD] = useState<{show: boolean, value: number}>({show: false, value: 0});
  
  const controlsTimeoutRef = useRef<any>(null);
  const osdTimeoutRef = useRef<any>(null);
  const volumeTimeoutRef = useRef<any>(null);

  const getVideoUrl = (item: MediaContent | Channel) => {
    return 'streamUrl' in item ? item.streamUrl : item.videoUrl;
  };

  const streamUrl = getVideoUrl(content);
  
  // Get subtitles if available
  const subtitles = 'subtitles' in content ? content.subtitles : undefined;

  // Helper to extract src from raw iframe code
  const extractSrcFromIframe = (htmlString: string): string | null => {
      const srcRegex = /src=["']([^"']+)["']/;
      const match = htmlString.match(srcRegex);
      return match ? match[1] : null;
  };

  // Restore Subtitle Preference on content change
  useEffect(() => {
      if (subtitles && subtitles.length > 0) {
          const savedLang = localStorage.getItem('sumonflix-subtitle-lang');
          if (savedLang && savedLang !== 'off') {
              const idx = subtitles.findIndex(t => t.lang === savedLang);
              if (idx !== -1) {
                  setActiveSubtitleIndex(idx);
              } else {
                  setActiveSubtitleIndex(null);
              }
          } else {
              setActiveSubtitleIndex(null);
          }
      } else {
          setActiveSubtitleIndex(null);
      }
  }, [content, subtitles]);

  // Determine effective stream type and source
  useEffect(() => {
    // Reset previous HLS
    if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
    }
    setIframeSrc(null);

    const url = streamUrl.trim();
    const isRawIframe = url.startsWith('<iframe');
    const isEmbedUrl = 'streamType' in content && (content.streamType === 'embed' || content.streamType === 'youtube');
    const isM3U8 = url.includes('.m3u8') || url.includes('.m3u') || url.includes('.ts') || url.includes('.php');

    if (isRawIframe) {
        const extracted = extractSrcFromIframe(url);
        if (extracted) setIframeSrc(extracted);
    } else if (isEmbedUrl) {
        setIframeSrc(url);
    } else {
        // Handle Video Element Logic (Native or HLS)
        if (videoRef.current) {
            const Hls = (window as any).Hls;
            if (Hls && Hls.isSupported() && isM3U8) {
                const hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(videoRef.current);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                   if (!isMinimized) videoRef.current?.play().catch(() => {});
                });
                setHlsInstance(hls);
            } else if (url) {
                // Native playback (mp4, webm, or Safari HLS)
                // Only set source if URL is present to avoid "element has no supported sources"
                videoRef.current.src = url;
                videoRef.current.load();
            }
        }
    }

    // Auto-play settings
    if (!isRawIframe && !isEmbedUrl && videoRef.current) {
         if (startTime > 0) videoRef.current.currentTime = startTime;
         // Attempt autoplay
         const playPromise = videoRef.current.play();
         if (playPromise !== undefined) {
             playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
         }
         videoRef.current.volume = isMuted ? 0 : volume;
         videoRef.current.muted = isMuted;
         videoRef.current.playbackRate = playbackRate; // Apply persisted playback rate
    }
  }, [content, streamUrl]); // Dependency on content or URL change


  const isIframeContent = !!iframeSrc;

  const closeAllMenus = () => {
    setShowSpeedMenu(false);
    setShowSubtitleMenu(false);
    setShowQualityMenu(false);
    setShowDownloadMenu(false);
    setShowVolumeSlider(false);
  };

  const handleUserActivity = () => {
    if (!showControls) setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Only auto-hide if playing (and not iframe, though for iframe we just hide controls mainly)
    if (isPlaying && !isMinimized) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        closeAllMenus();
      }, 3000);
    }
  };

  const handleControlsHover = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
  };

  const handleControlsLeave = () => {
    handleUserActivity();
  };

  // Handle subtitle track switching via video API
  useEffect(() => {
    if (videoRef.current && subtitles) {
      // Access textTracks
      const tracks = videoRef.current.textTracks;
      
      // Loop through all tracks and set mode
      for (let i = 0; i < tracks.length; i++) {
        if (activeSubtitleIndex !== null && i === activeSubtitleIndex) {
          tracks[i].mode = 'showing';
        } else {
          tracks[i].mode = 'hidden';
        }
      }
    }
  }, [activeSubtitleIndex, subtitles]);

  // PiP Event Listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || isIframeContent) return;

    const handleEnterPiP = () => setIsPipActive(true);
    const handleLeavePiP = () => setIsPipActive(false);

    videoElement.addEventListener('enterpictureinpicture', handleEnterPiP);
    videoElement.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      videoElement.removeEventListener('enterpictureinpicture', handleEnterPiP);
      videoElement.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [content, isIframeContent]);

  // Fullscreen unlock listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        // Unlock orientation if exited fullscreen
        if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
          try {
            window.screen.orientation.unlock();
          } catch (e) {
            console.log('Unlock failed or not supported');
          }
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // iOS/Safari legacy
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Check Download Status
  useEffect(() => {
    if (isLive) return;
    try {
        const downloads = JSON.parse(localStorage.getItem('downloads') || '[]');
        const isDownloaded = downloads.some((item: any) => item.id === content.id);
        setDownloadStatus(isDownloaded ? 'downloaded' : 'idle');
    } catch (e) {
        console.error("Error reading downloads", e);
    }
  }, [content, isLive]);

  // OSD Listeners
  useEffect(() => {
    if (isLive && !isMinimized) {
      setShowChannelOSD(true);
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
      osdTimeoutRef.current = setTimeout(() => {
        setShowChannelOSD(false);
      }, 4000);
    }
    
    // Reset selection states (Note: subtitles are handled by separate effect now)
    setCurrentQuality('Auto');
    setIsPipActive(!!document.pictureInPictureElement);
  }, [content, isLive, isIframeContent]); 

  // Volume Change Helper
  const changeVolume = (delta: number) => {
    if (isIframeContent) return;
    
    let newVol = Math.min(1, Math.max(0, volume + delta));
    setVolume(newVol);
    
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);

    // Show OSD
    setVolumeOSD({ show: true, value: newVol });
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    volumeTimeoutRef.current = setTimeout(() => {
      setVolumeOSD(prev => ({ ...prev, show: false }));
    }, 2000);
  };

  const toggleFullScreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
           window.screen.orientation.unlock();
        }
      } else if (containerRef.current && containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
        // Attempt to lock orientation to landscape
        // Cast to any to avoid TypeScript error: Property 'lock' does not exist on type 'ScreenOrientation'
        if (window.screen && window.screen.orientation && (window.screen.orientation as any).lock) {
            try {
                await (window.screen.orientation as any).lock('landscape');
            } catch (e) {
                console.log('Orientation lock failed:', e);
            }
        }
      } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
        // iOS Safari fallback
        (videoRef.current as any).webkitEnterFullscreen();
      }
    } catch (err) {
      console.error("Error toggling fullscreen:", err);
    }
  };

  // Remote Control / Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMinimized) return;
      
      // Allow browser defaults for F5, etc.
      if (['F5', 'F11', 'F12'].includes(e.key)) return;

      handleUserActivity();

      switch(e.key) {
        case 'f':
        case 'F':
           toggleFullScreen();
           break;
        case 'm':
        case 'M':
           toggleMute();
           break;
        case ' ':
        case 'Enter':
           e.preventDefault();
           togglePlay();
           break;
        case 'Escape':
        case 'Backspace':
           if (!document.fullscreenElement) {
               onClose();
           }
           break;
        case 'ArrowUp':
        case 'ChannelUp':
           e.preventDefault();
           if (isLive) {
               if (onNext) onNext();
           } else {
               changeVolume(0.1);
           }
           break;
        case 'ArrowDown':
        case 'ChannelDown':
           e.preventDefault();
           if (isLive) {
               if (onPrev) onPrev();
           } else {
               changeVolume(-0.1);
           }
           break;
        case 'ArrowLeft':
           e.preventDefault();
           if (isLive) {
               changeVolume(-0.1);
           } else {
               handleSkip(-10);
           }
           break;
        case 'ArrowRight':
           e.preventDefault();
           if (isLive) {
               changeVolume(0.1);
           } else {
               handleSkip(10);
           }
           break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLive, isMinimized, onNext, onPrev, volume, isIframeContent, showControls]);

  useEffect(() => {
    handleUserActivity();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    };
  }, [isPlaying, isMinimized]);

  // Next Episode Button Logic
  useEffect(() => {
    if (!isLive && onNext && 'type' in content && content.type === 'series') {
        const timer = setTimeout(() => {
           setShowNextEpisodeBtn(true);
        }, 5000); 
        return () => clearTimeout(timer);
    }
    setShowNextEpisodeBtn(false);
  }, [content, isLive, onNext]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isIframeContent) return; 

    // Refined behavior: If controls are hidden, click just wakes them up without pausing
    if (!showControls && !isMinimized) {
       handleUserActivity();
       return;
    }
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (isIframeContent) return;

    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (!newMuted && volume === 0) {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
      // Show OSD briefly
      setVolumeOSD({ show: true, value: newMuted ? 0 : (volume || 0.5) });
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      volumeTimeoutRef.current = setTimeout(() => {
        setVolumeOSD(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isIframeContent) return;

    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
    setIsMuted(newVol === 0);
  };

  const togglePiP = async () => {
    if (isIframeContent) return;
    if (videoRef.current && document.pictureInPictureEnabled) {
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else {
          await videoRef.current.requestPictureInPicture();
        }
      } catch (err) {
        console.error("Failed to enter Picture-in-Picture mode:", err);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
        if (onProgressUpdate) {
            onProgressUpdate(current, duration);
        }
      }

      if ('type' in content && content.type === 'series') {
        if (current > 5 && current < 85) {
          setShowSkipIntro(true);
        } else {
          setShowSkipIntro(false);
        }
      }
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };
  
  const handleSkipIntro = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 90; // Skip to 1:30
      handleUserActivity();
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setShowSpeedMenu(false);
      localStorage.setItem('sumonflix-playback-rate', speed.toString());
    }
  };
  
  const handleSubtitleChange = (index: number | null) => {
    setActiveSubtitleIndex(index);
    setShowSubtitleMenu(false);
    
    if (subtitles && index !== null) {
        localStorage.setItem('sumonflix-subtitle-lang', subtitles[index].lang);
    } else {
        localStorage.setItem('sumonflix-subtitle-lang', 'off');
    }
  };

  const handleQualityChange = (q: string) => {
    setCurrentQuality(q);
    setShowQualityMenu(false);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (downloadStatus !== 'idle') return;
      setShowDownloadConfirm(true);
  };

  const confirmDownload = () => {
      setShowDownloadConfirm(false);
      setDownloadStatus('downloading');
      setDownloadProgress(0);

      const totalSteps = 20;
      let currentStep = 0;

      const interval = setInterval(() => {
          currentStep++;
          const newProgress = (currentStep / totalSteps) * 100;
          setDownloadProgress(newProgress);

          if (currentStep >= totalSteps) {
              clearInterval(interval);
              setDownloadStatus('downloaded');
              
              // Store metadata locally
              try {
                  const downloads = JSON.parse(localStorage.getItem('downloads') || '[]');
                  if (!downloads.some((item: any) => item.id === content.id)) {
                      downloads.push({
                          ...content,
                          downloadedAt: new Date().toISOString()
                      });
                      localStorage.setItem('downloads', JSON.stringify(downloads));
                  }
              } catch (error) {
                  console.error("Failed to save download", error);
              }
          }
      }, 200); // 4 seconds total simulation
  };

  const getTitle = (item: MediaContent | Channel) => {
    return 'name' in item ? item.name : item.title;
  };

  const getSubtitle = (item: MediaContent | Channel) => {
    return 'currentProgram' in item ? item.currentProgram : ('category' in item ? item.category : '');
  };

  // Enhanced container class with z-[100] and h-dvh for full skin coverage
  // Added 'cursor-none' when controls are hidden
  const containerClasses = isMinimized 
    ? "fixed bottom-6 right-6 w-80 md:w-96 aspect-video z-[100] bg-slate-900 rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 ease-in-out group ring-1 ring-white/10"
    : `fixed inset-0 z-[100] bg-black flex flex-col transition-all duration-300 ease-in-out h-dvh w-screen ${!showControls ? 'cursor-none' : ''}`;

  return (
    <div 
      ref={containerRef}
      className={containerClasses}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onClick={handleUserActivity}
      onDoubleClick={!isMinimized && !isIframeContent ? toggleFullScreen : undefined}
    >
      {(showSpeedMenu || showSubtitleMenu || showQualityMenu || showDownloadMenu || showVolumeSlider) && (
        <div className="absolute inset-0 z-40" onClick={(e) => { e.stopPropagation(); closeAllMenus(); }}></div>
      )}

      {/* Persistent Back Button */}
      {!isMinimized && (
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          onMouseEnter={handleControlsHover}
          onMouseLeave={handleControlsLeave}
          className={`absolute top-6 left-6 z-[60] p-3 bg-slate-900/50 hover:bg-red-600 text-white rounded-full backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-110 shadow-lg group ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          title="Exit Player"
          aria-label="Exit Player"
          style={{ pointerEvents: 'auto' }}
        >
          <ArrowLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
        </button>
      )}

      {/* OSD - Hide if minimized */}
      {isLive && !isMinimized && (
        <div 
          className={`absolute top-8 right-8 z-30 flex flex-col items-end pointer-events-none transition-all duration-700 ease-out transform ${
            showChannelOSD ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
          }`}
        >
          <div className="bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl max-w-sm">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                  {'logo' in content ? (
                    <img src={content.logo} alt="Channel Logo" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold">TV</span>
                  )}
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-white leading-none">{getTitle(content)}</h2>
                 <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Live</span>
               </div>
            </div>
            <div className="h-px w-full bg-white/20 my-2"></div>
            <p className="text-gray-300 text-sm font-medium">Now: {getSubtitle(content)}</p>
          </div>
        </div>
      )}

      {/* Volume OSD */}
      {!isMinimized && (
          <div 
            className={`absolute right-8 top-1/2 -translate-y-1/2 z-30 bg-black/70 backdrop-blur-md p-4 rounded-xl flex flex-col items-center gap-3 transition-opacity duration-300 pointer-events-none border border-white/10 ${
                volumeOSD.show ? 'opacity-100' : 'opacity-0'
            }`}
          >
             {volumeOSD.value === 0 ? <VolumeX size={32} className="text-red-500" /> : <Volume2 size={32} className="text-white" />}
             <div className="h-32 w-2 bg-slate-700 rounded-full relative overflow-hidden">
                 <div 
                    className={`absolute bottom-0 left-0 right-0 rounded-full transition-all duration-100 ${volumeOSD.value === 0 ? 'bg-red-500' : 'bg-blue-500'}`} 
                    style={{ height: `${volumeOSD.value * 100}%` }}
                 />
             </div>
             <span className="text-white font-bold text-sm">{Math.round(volumeOSD.value * 100)}%</span>
          </div>
      )}

      {/* Header */}
      {!isMinimized && (
      <div 
        className={`absolute top-0 left-0 right-0 p-4 pl-24 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onMouseEnter={handleControlsHover}
        onMouseLeave={handleControlsLeave}
      >
        <div className="flex-1">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             {isLive && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>}
             {getTitle(content)}
           </h2>
           <p className="text-gray-300 text-sm">{getSubtitle(content)}</p>
        </div>

        {onToggleMinimize && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors pointer-events-auto"
            title="Minimize Player"
            aria-label="Minimize Player"
          >
            <Minimize2 size={24} className="text-white" />
          </button>
        )}
      </div>
      )}

      {/* Mini Player Overlay */}
      {isMinimized && (
        <>
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 z-50 backdrop-blur-[2px]">
                {onToggleMinimize && (
                    <button onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-transform hover:scale-110" title="Expand" aria-label="Expand">
                        <Maximize2 size={24} />
                    </button>
                )}
                 {!isIframeContent && (
                    <button onClick={togglePlay} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-transform hover:scale-110" title={isPlaying ? "Pause" : "Play"} aria-label={isPlaying ? "Pause" : "Play"}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                 )}
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white backdrop-blur-md transition-transform hover:scale-110" title="Close" aria-label="Close">
                    <X size={24} />
                </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-40">
                <p className="text-white text-sm font-bold truncate pr-4">{getTitle(content)}</p>
                <div className="h-0.5 w-full bg-white/20 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </>
      )}

      {/* Video Container */}
      <div className={`relative bg-black flex items-center justify-center overflow-hidden ${isMinimized ? 'w-full h-full' : 'flex-1'}`}>
        {isIframeContent ? (
           <iframe 
             src={iframeSrc!} 
             className="w-full h-full border-0" 
             allowFullScreen 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             title={getTitle(content)}
           />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            loop
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            crossOrigin="anonymous" 
            playsInline
          >
            {subtitles && subtitles.map((track, idx) => (
                <track 
                    key={idx}
                    kind="subtitles"
                    src={track.src}
                    srcLang={track.lang}
                    label={track.label}
                    default={idx === activeSubtitleIndex}
                />
            ))}
          </video>
        )}
        
        {/* Buttons Stack */}
        {!isIframeContent && !isMinimized && (
        <div 
          className={`absolute bottom-32 right-8 z-20 flex flex-col gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onMouseEnter={handleControlsHover}
          onMouseLeave={handleControlsLeave}
        >
             {showSkipIntro && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleSkipIntro(); }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 transition-all hover:scale-105 group pointer-events-auto shadow-lg"
                  aria-label="Skip Intro"
                >
                  <SkipForward size={20} className="fill-white" />
                  Skip Intro
                </button>
             )}
             {showNextEpisodeBtn && (
                <button
                  onClick={(e) => { e.stopPropagation(); if(onNext) onNext(); }}
                  className="bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md border border-blue-400/30 px-6 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 transition-all hover:scale-105 group pointer-events-auto shadow-lg animate-fade-in"
                  aria-label="Next Episode"
                >
                  <SkipForward size={20} className="fill-white" />
                  Next Episode
                </button>
             )}
        </div>
        )}
        
        {/* Controls Overlay */}
        {!isIframeContent && !isMinimized && (
        <div 
          className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onMouseEnter={handleControlsHover}
          onMouseLeave={handleControlsLeave}
        >
          {/* Progress Bar (Only for VOD) */}
          {!isLive && (
            <div className="w-full h-1.5 bg-gray-600 rounded-full mb-4 cursor-pointer overflow-hidden group/progress pointer-events-auto relative">
              <div className="h-full bg-blue-500 relative" style={{ width: `${progress}%` }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform scale-0 group-hover/progress:scale-100 transition-transform"></div>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(e) => {
                  if (videoRef.current) {
                    const newTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
                    videoRef.current.currentTime = newTime;
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Seek Video"
              />
            </div>
          )}

          <div className="flex items-center justify-between pointer-events-auto gap-2">
            <div className="flex items-center gap-2 md:gap-6">
              <div className="flex items-center gap-2 md:gap-4">
                 
                 {isLive && onPrev && (
                   <button 
                      onClick={onPrev} 
                      className="text-white hover:text-blue-400 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all border border-white/10 group" 
                      title="Previous Channel" 
                      aria-label="Previous Channel"
                   >
                      <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                   </button>
                 )}

                 {!isLive && (
                   <button onClick={() => handleSkip(-15)} className="text-gray-300 hover:text-white transition-colors p-1 hidden sm:block" title="-15s" aria-label="Rewind 15 seconds">
                      <RotateCcw size={20} />
                   </button>
                 )}

                 <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors p-2 hover:bg-white/10 rounded-full" aria-label={isPlaying ? "Pause" : "Play"}>
                   {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                 </button>

                 {!isLive && (
                   <button onClick={() => handleSkip(15)} className="text-gray-300 hover:text-white transition-colors p-1 hidden sm:block" title="+15s" aria-label="Forward 15 seconds">
                      <RotateCw size={20} />
                   </button>
                 )}

                 {isLive && onNext && (
                    <button 
                        onClick={onNext} 
                        className="text-white hover:text-blue-400 bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all border border-white/10 group" 
                        title="Next Channel" 
                        aria-label="Next Channel"
                    >
                        <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                 )}

                 {!isLive && onNext && 'type' in content && content.type === 'series' && (
                    <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors p-1 ml-2" title="Next Episode" aria-label="Next Episode">
                       <SkipForward size={24} />
                    </button>
                 )}
              </div>
              
              <div className="flex items-center gap-2 relative">
                <button 
                    onClick={(e) => { 
                        e.stopPropagation(); 
                        setShowVolumeSlider(!showVolumeSlider);
                        setShowSpeedMenu(false);
                        setShowSubtitleMenu(false);
                        setShowQualityMenu(false);
                        setShowDownloadMenu(false);
                    }} 
                    className="text-white hover:text-blue-400 transition-colors" 
                    aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-out flex items-center ${showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'}`}>
                   <input 
                     type="range" 
                     min="0" 
                     max="1" 
                     step="0.05"
                     value={isMuted ? 0 : volume}
                     onChange={handleVolumeChange}
                     className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 ml-2"
                     onClick={(e) => e.stopPropagation()} 
                     aria-label="Volume"
                   />
                </div>
              </div>

              {isLive && (
                <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 border border-red-600/50 rounded text-red-500 text-xs font-bold uppercase tracking-wider hidden sm:flex">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Live
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4">
               {/* Download Button (VOD Only) */}
               {!isLive && !isIframeContent && (
                  <div className="relative z-50">
                    {downloadStatus === 'downloading' ? (
                        <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/90 backdrop-blur-md border border-slate-600 rounded-lg shadow-lg">
                            <div className="relative">
                                <Loader size={16} className="animate-spin text-blue-500" />
                            </div>
                            <div className="flex flex-col w-24 sm:w-32">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wider">Downloading</span>
                                    <span className="text-[10px] font-bold text-white">{Math.round(downloadProgress)}%</span>
                                </div>
                                <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-200 ease-out" 
                                        style={{ width: `${downloadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (downloadStatus === 'downloaded') return;
                                setShowDownloadMenu(!showDownloadMenu); 
                                setShowSpeedMenu(false); 
                                setShowSubtitleMenu(false); 
                                setShowQualityMenu(false);
                                setShowVolumeSlider(false);
                            }}
                            className={`flex items-center justify-center p-2 rounded transition-colors ${downloadStatus === 'downloaded' ? 'text-green-500 hover:text-green-400 bg-green-500/10 border border-green-500/50' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}
                            title={downloadStatus === 'downloaded' ? 'Downloaded' : 'Download'}
                            disabled={downloadStatus === 'downloaded'}
                        >
                            {downloadStatus === 'idle' && <Download size={24} />}
                            {downloadStatus === 'downloaded' && <Check size={24} />}
                        </button>
                        
                        {showDownloadMenu && downloadStatus === 'idle' && (
                             <div className="absolute bottom-full right-0 mb-4 w-48 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                                <div className="px-4 py-2 border-b border-white/10 text-xs font-bold text-gray-500 uppercase">Download Quality</div>
                                {['1080p', '720p', '480p'].map(q => (
                                  <button 
                                      key={q} 
                                      onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setShowDownloadMenu(false);
                                          setShowDownloadConfirm(true); 
                                      }} 
                                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors text-gray-300 hover:text-white flex justify-between items-center"
                                  >
                                      {q}
                                      <Download size={14} />
                                  </button>
                                ))}
                             </div>
                        )}
                        </>
                    )}
                  </div>
               )}

               {subtitles && subtitles.length > 0 && (
                 <div className="relative z-50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSubtitleMenu(!showSubtitleMenu); setShowSpeedMenu(false); setShowQualityMenu(false); setShowDownloadMenu(false); setShowVolumeSlider(false); }}
                      className={`flex items-center gap-1 hover:text-white transition-colors p-2 rounded hover:bg-white/10 ${activeSubtitleIndex !== null ? 'text-blue-400' : 'text-gray-300'}`}
                      title="Subtitles / Captions"
                      aria-label="Subtitles"
                    >
                      <Captions size={24} />
                    </button>
                    {showSubtitleMenu && (
                       <div className="absolute bottom-full right-0 mb-4 w-48 max-h-60 overflow-y-auto bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                         <button onClick={() => handleSubtitleChange(null)} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors border-b border-white/5 ${activeSubtitleIndex === null ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>Off</button>
                         {subtitles.map((track, idx) => (
                           <button key={idx} onClick={() => handleSubtitleChange(idx)} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${activeSubtitleIndex === idx ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>{track.label}</button>
                         ))}
                       </div>
                    )}
                 </div>
               )}

               <div className="relative z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); setShowSubtitleMenu(false); setShowDownloadMenu(false); setShowVolumeSlider(false); }}
                    className="flex items-center gap-1 text-gray-300 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
                    title="Video Quality"
                    aria-label="Quality"
                  >
                    <Sliders size={20} className="sm:hidden" />
                    <Sliders size={16} className="hidden sm:block" />
                    <span className="hidden sm:inline">{currentQuality}</span>
                  </button>
                  {showQualityMenu && (
                     <div className="absolute bottom-full right-0 mb-4 w-32 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                       {qualities.map(q => (
                         <button key={q} onClick={() => handleQualityChange(q)} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${currentQuality === q ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>{q}</button>
                       ))}
                     </div>
                  )}
               </div>

               <div className="relative z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowSubtitleMenu(false); setShowQualityMenu(false); setShowDownloadMenu(false); setShowVolumeSlider(false); }}
                    className="flex items-center gap-1 text-gray-300 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
                    aria-label="Playback Speed"
                  >
                    <Settings size={20} className="sm:hidden" />
                    <Settings size={16} className="hidden sm:block" />
                    <span className="hidden sm:inline">{playbackRate}x</span>
                  </button>
                  {showSpeedMenu && (
                     <div className="absolute bottom-full right-0 mb-4 w-32 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl overflow-hidden py-1 z-50">
                       {[0.5, 1.0, 1.5, 2.0].map(rate => (
                         <button key={rate} onClick={() => handleSpeedChange(rate)} className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${playbackRate === rate ? 'text-blue-400 font-bold' : 'text-gray-300'}`}>{rate}x</button>
                       ))}
                     </div>
                  )}
               </div>

               {document.pictureInPictureEnabled && (
                 <button 
                   onClick={togglePiP} 
                   className={`transition-colors ${isPipActive ? 'text-blue-500 hover:text-blue-400' : 'text-white hover:text-blue-400'}`}
                   title={isPipActive ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
                   aria-label="Picture-in-Picture"
                 >
                    <PictureInPicture size={24} />
                 </button>
               )}

               <button onClick={toggleFullScreen} className="text-white hover:text-blue-400 transition-colors" aria-label="Fullscreen">
                  <Maximize size={24} />
               </button>
            </div>
          </div>
        </div>
        )}

      {showDownloadConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl transform scale-100 transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                        <Download size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white">Download Content?</h3>
                </div>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Do you want to download <span className="text-white font-medium">"{getTitle(content)}"</span> for offline viewing? This will use your local storage.
                </p>
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={() => setShowDownloadConfirm(false)}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmDownload}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-600/20 transition-colors flex items-center gap-2 text-sm"
                    >
                        Yes, Download
                    </button>
                </div>
            </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default VideoPlayer;