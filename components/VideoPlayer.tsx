import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Settings, SkipForward, SkipBack, ChevronUp, ChevronDown, Captions, Sliders, ArrowLeft, PictureInPicture, Minimize2, Maximize2 } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [activeSubtitleIndex, setActiveSubtitleIndex] = useState<number | null>(null); // null means off
  const [showControls, setShowControls] = useState(true);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [showNextEpisodeBtn, setShowNextEpisodeBtn] = useState(false);
  const [showChannelOSD, setShowChannelOSD] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  
  // Quality State
  const [currentQuality, setCurrentQuality] = useState('Auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const qualities = ['Auto', '1080p', '720p', '480p', '360p'];
  
  const controlsTimeoutRef = useRef<any>(null);
  const osdTimeoutRef = useRef<any>(null);

  // Determine if content is iframe-based (YouTube, Embed) or direct video
  const isIframeContent = isLive && 'streamType' in content && (content.streamType === 'embed' || content.streamType === 'youtube');
  
  // Get subtitles if available
  const subtitles = 'subtitles' in content ? content.subtitles : undefined;

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Only auto-hide if playing (and not iframe, though for iframe we just hide controls mainly)
    if (isPlaying && !isMinimized) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        // Also close menus when controls hide
        setShowSpeedMenu(false);
        setShowSubtitleMenu(false);
        setShowQualityMenu(false);
      }, 3000);
    }
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

  // Autoplay and OSD trigger on content change
  useEffect(() => {
    if (!isIframeContent && videoRef.current) {
      // Set start time if provided
      if (startTime > 0) {
        videoRef.current.currentTime = startTime;
      }

      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
      setIsPlaying(true);
      // Sync volume on mount/content change
      videoRef.current.volume = isMuted ? 0 : volume;
      videoRef.current.muted = isMuted;
    }

    if (isLive && !isMinimized) {
      // Reset visibility to trigger fade in
      setShowChannelOSD(true);
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
      osdTimeoutRef.current = setTimeout(() => {
        setShowChannelOSD(false);
      }, 4000);
    }
    
    // Reset subtitle selection on new content
    setActiveSubtitleIndex(null);
    // Reset quality on new content
    setCurrentQuality('Auto');
    // Reset PiP state if content changes (though browser usually exits PiP)
    setIsPipActive(!!document.pictureInPictureElement);
  }, [content, isLive, isIframeContent]); 

  useEffect(() => {
    handleUserActivity();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    };
  }, [isPlaying, isMinimized]);

  // Keyboard Listeners for Live TV Channel Switch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLive || isMinimized) return; 

      if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ChannelUp') {
        e.preventDefault();
        handleUserActivity(); // Show controls/feedback
        if (onNext) onNext();
      } else if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ChannelDown') {
        e.preventDefault();
        handleUserActivity(); // Show controls/feedback
        if (onPrev) onPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLive, onNext, onPrev, isMinimized]);

  // Next Episode Button Logic
  useEffect(() => {
    if (!isLive && onNext && 'type' in content && content.type === 'series') {
        const timer = setTimeout(() => {
           setShowNextEpisodeBtn(true);
        }, 5000); // Show after 5 seconds of playback
        return () => clearTimeout(timer);
    }
    setShowNextEpisodeBtn(false);
  }, [content, isLive, onNext]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isIframeContent) return; 
    
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
      
      // If unmuting and volume was 0, restore to 0.5
      if (!newMuted && volume === 0) {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
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

  const toggleFullScreen = () => {
    // Basic fullscreen toggle for the container
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
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
      // Avoid NaN for live streams or loading states
      if (duration > 0) {
        setProgress((current / duration) * 100);
        // Call progress callback
        if (onProgressUpdate) {
            onProgressUpdate(current, duration);
        }
      }

      // Check for Skip Intro condition
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
    }
  };
  
  const handleSubtitleChange = (index: number | null) => {
    setActiveSubtitleIndex(index);
    setShowSubtitleMenu(false);
  };

  const handleQualityChange = (q: string) => {
    setCurrentQuality(q);
    setShowQualityMenu(false);
    console.log(`Switched quality to ${q}`);
  };

  const getVideoUrl = (item: MediaContent | Channel) => {
    return 'streamUrl' in item ? item.streamUrl : item.videoUrl;
  };

  const getTitle = (item: MediaContent | Channel) => {
    return 'name' in item ? item.name : item.title;
  };

  const getSubtitle = (item: MediaContent | Channel) => {
    return 'currentProgram' in item ? item.currentProgram : ('category' in item ? item.category : '');
  };

  // Close menus when clicking outside (handled by simple overlay or logic)
  const closeAllMenus = () => {
    setShowSpeedMenu(false);
    setShowSubtitleMenu(false);
    setShowQualityMenu(false);
  };

  // Determine container classes based on minimized state
  const containerClasses = isMinimized 
    ? "fixed bottom-6 right-6 w-80 md:w-96 aspect-video z-50 bg-slate-900 rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden transition-all duration-300 ease-in-out group ring-1 ring-white/10"
    : "fixed inset-0 z-50 bg-black flex flex-col transition-all duration-300 ease-in-out";

  return (
    <div 
      className={containerClasses}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onClick={handleUserActivity}
    >
      {/* Background click handler to close menus */}
      {(showSpeedMenu || showSubtitleMenu || showQualityMenu) && (
        <div className="absolute inset-0 z-40" onClick={(e) => { e.stopPropagation(); closeAllMenus(); }}></div>
      )}

      {/* Live TV Channel OSD - Hide if minimized */}
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

      {/* Header overlay - Conditional Render for Full Screen */}
      {!isMinimized && (
      <div className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center gap-4 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button 
          onClick={onClose}
          className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors pointer-events-auto z-50 group"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft size={24} className="text-white group-hover:-translate-x-1 transition-transform" />
        </button>

        <div className="flex-1">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             {isLive && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>}
             {getTitle(content)}
           </h2>
           <p className="text-gray-300 text-sm">{getSubtitle(content)}</p>
        </div>

        {/* Minimize Button */}
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

      {/* Mini Player Overlay Controls (Hover) */}
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
            {/* Title Bar for Mini Player */}
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
             src={getVideoUrl(content)} 
             className="w-full h-full border-0" 
             allowFullScreen 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             title={getTitle(content)}
           />
        ) : (
          <video
            ref={videoRef}
            src={getVideoUrl(content)}
            className="w-full h-full object-contain"
            loop
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
            crossOrigin="anonymous" 
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
        
        {/* Buttons Stack (Bottom Right) - Hide if Minimized */}
        {!isIframeContent && !isMinimized && (
        <div className={`absolute bottom-32 right-8 z-20 flex flex-col gap-3 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             
             {/* Skip Intro Button */}
             {showSkipIntro && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSkipIntro();
                  }}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 transition-all hover:scale-105 group pointer-events-auto shadow-lg"
                  aria-label="Skip Intro"
                >
                  <SkipForward size={20} className="fill-white" />
                  Skip Intro
                </button>
             )}

             {/* Play Next Episode Button */}
             {showNextEpisodeBtn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(onNext) onNext();
                  }}
                  className="bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md border border-blue-400/30 px-6 py-2.5 rounded-lg text-white font-semibold flex items-center gap-2 transition-all hover:scale-105 group pointer-events-auto shadow-lg animate-fade-in"
                  aria-label="Next Episode"
                >
                  <SkipForward size={20} className="fill-white" />
                  Next Episode
                </button>
             )}
        </div>
        )}
        
        {/* Controls Overlay - Hide for iFrames and Minimized */}
        {!isIframeContent && !isMinimized && (
        <div className={`absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {/* Progress Bar (Only for VOD) */}
          {!isLive && (
            <div className="w-full h-1.5 bg-gray-600 rounded-full mb-4 cursor-pointer overflow-hidden group/progress pointer-events-auto relative">
              <div 
                className="h-full bg-blue-500 relative"
                style={{ width: `${progress}%` }}
              >
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
                 
                 {/* Live Channel Controls */}
                 {isLive && onPrev && (
                   <button 
                     onClick={onPrev} 
                     className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all" 
                     title="Previous Channel"
                     aria-label="Previous Channel"
                   >
                      <SkipBack size={24} />
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

                 {/* Live Channel Controls */}
                 {isLive && onNext && (
                    <button 
                      onClick={onNext} 
                      className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all" 
                      title="Next Channel"
                      aria-label="Next Channel"
                    >
                        <SkipForward size={24} />
                    </button>
                 )}

                 {/* Next Episode Button in Control Bar */}
                 {!isLive && onNext && 'type' in content && content.type === 'series' && (
                    <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors p-1 ml-2" title="Next Episode" aria-label="Next Episode">
                       <SkipForward size={24} />
                    </button>
                 )}
              </div>
              
              {/* Volume Control Group */}
              <div className="flex items-center gap-2 group/volume relative">
                <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
                  {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
                
                {/* Volume Slider - Expand on hover/focus, hidden on mobile */}
                <div className="w-0 overflow-hidden group-hover/volume:w-24 group-focus-within/volume:w-24 transition-all duration-300 ease-out flex items-center hidden sm:flex">
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
               {/* Subtitles Button */}
               {subtitles && subtitles.length > 0 && (
                 <div className="relative z-50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowSubtitleMenu(!showSubtitleMenu); setShowSpeedMenu(false); setShowQualityMenu(false); }}
                      className={`flex items-center gap-1 hover:text-white transition-colors p-2 rounded hover:bg-white/10 ${activeSubtitleIndex !== null ? 'text-blue-400' : 'text-gray-300'}`}
                      title="Subtitles / Captions"
                      aria-label="Subtitles"
                    >
                      <Captions size={24} />
                    </button>

                    {showSubtitleMenu && (
                       <div className="absolute bottom-full right-0 mb-4 w-48 max-h-60 overflow-y-auto bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl py-1 z-50">
                         <button
                           onClick={() => handleSubtitleChange(null)}
                           className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors border-b border-white/5 ${activeSubtitleIndex === null ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
                         >
                           Off
                         </button>
                         {subtitles.map((track, idx) => (
                           <button
                             key={idx}
                             onClick={() => handleSubtitleChange(idx)}
                             className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${activeSubtitleIndex === idx ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
                           >
                             {track.label}
                           </button>
                         ))}
                       </div>
                    )}
                 </div>
               )}

               {/* Quality Selector */}
               <div className="relative z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); setShowSubtitleMenu(false); }}
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
                         <button
                           key={q}
                           onClick={() => handleQualityChange(q)}
                           className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${currentQuality === q ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
                         >
                           {q}
                         </button>
                       ))}
                     </div>
                  )}
               </div>

               {/* Speed Selector */}
               <div className="relative z-50">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); setShowSubtitleMenu(false); setShowQualityMenu(false); }}
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
                         <button
                           key={rate}
                           onClick={() => handleSpeedChange(rate)}
                           className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-800 transition-colors ${playbackRate === rate ? 'text-blue-400 font-bold' : 'text-gray-300'}`}
                         >
                           {rate}x
                         </button>
                       ))}
                     </div>
                  )}
               </div>

               {/* PiP Button */}
               {document.pictureInPictureEnabled && (
                 <button 
                   onClick={togglePiP} 
                   className={`transition-colors hidden sm:block ${isPipActive ? 'text-blue-500 hover:text-blue-400' : 'text-white hover:text-blue-400'}`}
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
      </div>
    </div>
  );
};

export default VideoPlayer;