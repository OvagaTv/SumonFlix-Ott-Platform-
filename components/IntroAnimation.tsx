import React, { useState, useEffect } from 'react';
import { SkipForward, Volume2, VolumeX, Play } from 'lucide-react';

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const [canSkip, setCanSkip] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // Use a reliable placeholder video for the intro. 
  // Updated to HTTPS to avoid "The element has no supported sources" error due to mixed content blocking.
  const introVideoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

  useEffect(() => {
    // Allow skipping after 2 seconds
    const timer = setTimeout(() => setCanSkip(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
      <video
        className="w-full h-full object-cover opacity-60"
        src={introVideoUrl}
        autoPlay
        muted={isMuted}
        playsInline
        onEnded={onComplete}
      />
      
      {/* Branding Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-fade-in">
         {/* Logo Icon */}
         <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/50 transform transition-transform duration-1000 hover:scale-110">
            <Play size={48} fill="white" className="text-white ml-2 md:w-16 md:h-16" />
         </div>
         
         {/* Logo Text */}
         <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
           sumonflix<span className="text-blue-500">.net</span>
         </h1>
         <p className="text-slate-300 mt-4 text-sm md:text-lg tracking-widest uppercase font-medium drop-shadow-lg">
            Next Generation Streaming
         </p>
      </div>

      <div className="absolute bottom-8 right-8 flex items-center gap-4 z-20">
        <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all border border-white/10"
        >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {canSkip && (
          <button
            onClick={onComplete}
            className="group flex items-center gap-2 px-6 py-3 bg-blue-600/80 hover:bg-blue-600 backdrop-blur-md border border-blue-400/30 rounded-full text-white font-bold transition-all hover:pr-5 shadow-lg shadow-blue-900/40"
          >
            Skip Intro 
            <SkipForward size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
};

export default IntroAnimation;