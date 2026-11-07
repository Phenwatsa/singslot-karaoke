import React, { useState, useEffect } from 'react';
import { Sparkles, MicVocal } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  durationMs = 2400
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fading out slightly before completion
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, durationMs - 500);

    // Call onComplete when transition finishes
    const finishTimer = setTimeout(() => {
      onComplete();
    }, durationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-[#ffffff] via-[#fff5f8] via-[#f7f8ff] to-[#f0fbf9] transition-opacity duration-500 cursor-pointer select-none overflow-hidden ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="SingSlot Cinematic Splash Screen"
    >
      {/* Background Soft Glow Orbs */}
      <div className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-pink-300/30 via-purple-300/25 to-sky-200/25 blur-3xl animate-pulse" />
      <div
        className="pointer-events-none absolute h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-200/20 via-pink-200/20 to-teal-100/20 blur-3xl"
        style={{ animation: 'pulseGlow 3s ease-in-out infinite' }}
      />

      {/* Central Brand Intro Box */}
      <div
        className="relative flex flex-col items-center text-center px-6"
        style={{ animation: 'introZoom 2.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
      >
        {/* Glowing App Icon (Microphone Squircle) */}
        <div className="relative mb-6">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-pink-400/40 via-purple-400/40 to-sky-400/40 blur-xl opacity-80" />
          <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-pink-200 via-purple-200 to-sky-200 shadow-xl shadow-purple-200/50 border-2 border-white/90">
            <MicVocal className="h-10 w-10 sm:h-12 sm:w-12 text-purple-900 drop-shadow-md" />
          </div>
        </div>

        {/* Brand Name Typography with Shimmer */}
        <div className="relative overflow-hidden py-1">
          <div className="flex items-center justify-center gap-2">
            <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-sky-500 bg-clip-text text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-transparent drop-shadow-sm">
              SingSlot
            </h1>
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-pink-400 animate-spin" style={{ animationDuration: '4s' }} />
          </div>

          {/* Shimmer Light Bar Sweeping Across Letters (Netflix Style) */}
          <div
            className="pointer-events-none absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ animation: 'shimmerSweep 1.6s ease-in-out infinite' }}
          />
        </div>

        {/* Subtitle / System Tagline */}
        <p className="mt-2 text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] text-slate-500">
          Karaoke Room Reservation & Management
        </p>

        {/* Soundwave / Sparkle Dots */}
        <div className="mt-5 flex items-center gap-1.5 opacity-80">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-400 animate-ping" />
          <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-sky-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
        </div>
      </div>

      {/* Skip Prompt in bottom-right */}
      <div className="absolute bottom-6 right-6 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
        Click anywhere to skip
      </div>
    </div>
  );
};

