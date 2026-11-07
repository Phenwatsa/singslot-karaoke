import React, { useState, useRef, useEffect } from 'react';
import { MicVocal, Calendar, User, ShieldCheck, LogOut, Sparkles, ChevronDown } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: 'booking' | 'my-bookings' | 'staff-schedule' | 'login';
  userRole?: 'CUSTOMER' | 'STAFF' | null;
  userName?: string | null;
  userEmail?: string | null;
  onLogout?: () => void;
  onNavigate?: (route: 'booking' | 'my-bookings' | 'staff-schedule' | 'login') => void;
}

// Cute Pastel Rounded Star from reference aesthetic
const PuffyStar: React.FC<{ className?: string; size?: number; fill?: string; opacity?: number }> = ({
  className = '',
  size = 28,
  fill = '#fde68a',
  opacity = 0.85
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ opacity }}
    className={`filter drop-shadow-[0_2px_10px_rgba(244,114,182,0.4)] ${className}`}
  >
    <path
      d="M12 2.5C12.4 2.5 12.8 2.7 13 3.1L15.4 7.8C15.6 8.2 16 8.5 16.5 8.6L21.7 9.4C22.2 9.5 22.6 9.8 22.7 10.3C22.8 10.7 22.7 11.2 22.3 11.5L18.6 15.2C18.2 15.6 18.1 16.1 18.2 16.6L19 21.8C19.1 22.3 18.9 22.7 18.5 23C18.1 23.3 17.6 23.3 17.2 23L12.5 20.6C12.1 20.4 11.6 20.4 11.2 20.6L6.5 23C6.1 23.3 5.6 23.3 5.2 23C4.8 22.7 4.6 22.3 4.7 21.8L5.5 16.6C5.6 16.1 5.5 15.6 5.1 15.2L1.4 11.5C1 11.2 0.9 10.7 1 10.3C1.1 9.8 1.5 9.5 2 9.4L7.2 8.6C7.7 8.5 8.1 8.2 8.3 7.8L10.7 3.1C10.9 2.7 11.3 2.5 11.7 2.5H12Z"
      fill={fill}
      stroke="#fbcfe8"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  </svg>
);

// Sparkle Burst (✦) accent
const SparkleBurst: React.FC<{ className?: string; size?: number; fill?: string }> = ({
  className = '',
  size = 18,
  fill = '#c084fc'
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    className={`filter drop-shadow-[0_1px_8px_rgba(192,132,252,0.45)] ${className}`}
  >
    <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
  </svg>
);

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeNav = 'booking',
  userRole = null,
  userName = null,
  userEmail = null,
  onLogout,
  onNavigate,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col bg-transparent text-slate-800 selection:bg-pink-300 selection:text-purple-900">
      {/* Background Pastel Galaxy Swirls, Bokeh Orbs & Decorative Stars */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Lighter, Softer Glowing Pastel Ambient Orbs */}
        <div className="absolute -left-20 -top-20 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-pink-200/18 to-rose-100/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute right-0 top-1/4 h-[520px] w-[520px] rounded-full bg-gradient-to-bl from-purple-200/15 via-indigo-100/10 to-sky-100/15 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 h-[420px] w-[420px] rounded-full bg-gradient-to-tr from-sky-100/15 via-teal-50/15 to-pink-100/10 blur-3xl" />
        <div className="absolute -bottom-20 right-10 h-[380px] w-[380px] rounded-full bg-pink-100/15 blur-3xl" />

        {/* Floating Pastel Rounded Stars & Sparkles (Matching user aesthetic reference) */}
        <div className="absolute left-[8%] top-[12%]">
          <PuffyStar size={34} fill="#fff1f2" />
        </div>
        <div className="absolute right-[12%] top-[18%]">
          <PuffyStar size={40} fill="#fef9c3" />
        </div>
        <div className="absolute left-[15%] top-[55%]">
          <PuffyStar size={24} fill="#fce7f3" />
        </div>
        <div className="absolute right-[8%] top-[65%] animate-pulse" style={{ animationDuration: '4s' }}>
          <PuffyStar size={36} fill="#ede9fe" />
        </div>
        <div className="absolute left-[6%] bottom-[15%]">
          <PuffyStar size={30} fill="#fef3c7" />
        </div>
        <div className="absolute right-[22%] bottom-[10%]">
          <PuffyStar size={26} fill="#fff1f2" />
        </div>

        {/* Sparkle Bursts (✦) */}
        <div className="absolute left-[24%] top-[16%]">
          <SparkleBurst size={18} fill="#f472b6" />
        </div>
        <div className="absolute right-[28%] top-[24%]">
          <SparkleBurst size={22} fill="#c084fc" />
        </div>
        <div className="absolute left-[38%] top-[70%]">
          <SparkleBurst size={16} fill="#7dd3fc" />
        </div>
        <div className="absolute right-[15%] bottom-[32%]">
          <SparkleBurst size={20} fill="#f472b6" />
        </div>

        {/* Glowing Stardust Dots (จุดฟุ้งๆ) */}
        <div className="absolute left-[18%] top-[28%] h-2 w-2 rounded-full bg-pink-200 shadow-[0_0_8px_rgba(244,114,182,0.6)]" />
        <div className="absolute left-[45%] top-[15%] h-1.5 w-1.5 rounded-full bg-purple-200 shadow-[0_0_6px_rgba(192,132,252,0.6)]" />
        <div className="absolute right-[35%] top-[40%] h-2.5 w-2.5 rounded-full bg-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.6)]" />
        <div className="absolute right-[18%] top-[50%] h-2 w-2 rounded-full bg-amber-100 shadow-[0_0_8px_rgba(253,230,138,0.7)]" />
        <div className="absolute left-[30%] bottom-[25%] h-2 w-2 rounded-full bg-rose-200 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
        <div className="absolute right-[42%] bottom-[18%] h-1.5 w-1.5 rounded-full bg-teal-100 shadow-[0_0_6px_rgba(94,234,212,0.6)]" />
      </div>

      {/* Top Navbar (Fixed firmly at top of viewport so it NEVER drifts or jitters) */}
      <header className="fixed top-0 left-0 right-0 z-40 w-full border-b border-pink-100/70 bg-white/85 backdrop-blur-md shadow-xs shadow-purple-100/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand (Clickable to Home / Rooms & Slots) */}
          <div
            onClick={() => onNavigate?.('booking')}
            className="flex items-center gap-3 cursor-pointer select-none transition-transform active:scale-95"
            title="SingSlot Home"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-300 via-purple-300 to-sky-300 shadow-sm shadow-purple-200/40 border border-white/60">
              <MicVocal className="h-5 w-5 text-purple-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-sky-500 bg-clip-text text-xl font-black tracking-wider text-transparent">
                  SingSlot
                </span>
                <Sparkles className="h-3.5 w-3.5 text-pink-400" />
              </div>
              <span className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:inline">
                Karaoke System
              </span>
            </div>
          </div>

          {/* Navigation Links (Visible when authenticated to navigate views) */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {userRole && (
              <button
                onClick={() => onNavigate?.('booking')}
                title="Rooms & Slots catalog"
                className={`flex items-center gap-2 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                  activeNav === 'booking'
                    ? 'bg-white/80 text-purple-800 shadow-xs border border-purple-200/70'
                    : 'text-slate-500 hover:bg-white/50 hover:text-purple-800'
                }`}
              >
                <Calendar className="h-4 w-4 text-purple-500 shrink-0" />
                <span className="hidden sm:inline">Rooms & Slots</span>
              </button>
            )}

            {userRole === 'CUSTOMER' && (
              <button
                onClick={() => onNavigate?.('my-bookings')}
                title="Customer booking history (Active in Issue #5)"
                className={`flex items-center gap-2 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                  activeNav === 'my-bookings'
                    ? 'bg-white/80 text-purple-800 shadow-xs border border-purple-200/70'
                    : 'text-slate-500 hover:bg-white/50 hover:text-purple-800'
                }`}
              >
                <User className="h-4 w-4 text-pink-400 shrink-0" />
                <span className="hidden sm:inline">My Bookings</span>
              </button>
            )}

            {userRole === 'STAFF' && (
              <button
                onClick={() => onNavigate?.('staff-schedule')}
                title="Staff master schedule (Active in Issue #6)"
                className={`flex items-center gap-2 rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all ${
                  activeNav === 'staff-schedule'
                    ? 'bg-white/80 text-purple-800 shadow-xs border border-purple-200/70'
                    : 'text-slate-500 hover:bg-white/50 hover:text-purple-800'
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0" />
                <span className="hidden sm:inline">Master Schedule</span>
              </button>
            )}
          </nav>

          {/* User Profile / Auth State (Nexa-inspired Avatar Pill & Dropdown) */}
          <div className="flex items-center gap-3">
            {userName ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2.5 rounded-full border border-pink-100/90 bg-white/85 pl-1.5 pr-3 py-1 shadow-xs hover:bg-white hover:border-pink-200 hover:shadow-sm transition-all focus:outline-none"
                  aria-label="User profile menu"
                  aria-expanded={isProfileOpen}
                >
                  {/* Circular Avatar with Initials */}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-pink-200 via-purple-200 to-sky-200 text-[11px] font-black text-purple-900 border border-white/90 shadow-xs">
                    {getInitials(userName)}
                  </div>
                  {/* Name & Role Text */}
                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">{userName}</span>
                    <span className="text-[10px] font-semibold text-purple-600">
                      {userRole === 'STAFF' ? 'Staff Manager' : 'Customer'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                      isProfileOpen ? 'rotate-180 text-purple-600' : ''
                    }`}
                  />
                </button>

                {/* Floating Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-pink-100/90 bg-white/95 p-2 shadow-xl shadow-purple-200/30 backdrop-blur-xl z-50 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-sky-50/60 border border-pink-100/60 mb-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-pink-200 via-purple-200 to-sky-200 text-xs font-extrabold text-purple-900 border border-white shadow-xs">
                        {getInitials(userName)}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-xs font-extrabold text-slate-800 truncate">{userName}</div>
                        {userEmail && <div className="text-[11px] text-slate-500 truncate">{userEmail}</div>}
                        <span
                          className={`inline-block mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide ${
                            userRole === 'STAFF'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-pink-100 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {userRole}
                        </span>
                      </div>
                    </div>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        onLogout?.();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                {/* Register Button: Pale Milky Yellow to Baby Pink Gradient (exact star match) */}
                <button
                  onClick={() => onNavigate?.('login')}
                  title="Create new account (Registration)"
                  className="rounded-full bg-gradient-to-r from-[#fef8c6] via-[#fee6e3] to-[#fbcfe8] px-5 py-1.5 text-sm font-extrabold text-purple-900 shadow-sm shadow-pink-100/60 hover:brightness-105 active:scale-95 transition-all border border-[#fbcfe8]/70"
                >
                  Register
                </button>
                {/* Sign In Button: Pink to Purple to Blue Gradient */}
                <button
                  onClick={() => onNavigate?.('login')}
                  title="User sign in (Active in Issue #2)"
                  className="rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 px-5 py-1.5 text-sm font-extrabold text-purple-900 shadow-sm shadow-purple-100 hover:brightness-105 active:scale-95 transition-all border border-pink-200/50"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pt-24 pb-8 sm:px-6 sm:pt-24 sm:pb-8 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-100/80 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© 2026 SingSlot — Karaoke Room Reservation & Management System | CPE 334 Project</p>
          <p className="mt-1 text-slate-400">Pastel Cosmic Light Theme • React, Vite, Tailwind CSS & Express</p>
        </div>
      </footer>
    </div>
  );
};
