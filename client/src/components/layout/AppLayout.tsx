import React from 'react';
import { Mic2, Calendar, User, ShieldCheck, LogOut } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: 'booking' | 'my-bookings' | 'staff-schedule' | 'login';
  userRole?: 'CUSTOMER' | 'STAFF' | null;
  userName?: string | null;
  onLogout?: () => void;
  onNavigate?: (route: 'booking' | 'my-bookings' | 'staff-schedule' | 'login') => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeNav = 'booking',
  userRole = null,
  userName = null,
  onLogout,
  onNavigate,
}) => {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-pink-500 selection:text-white">
      {/* Background Soft Pastel Ambient Glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-pink-400/15 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-96 w-96 rounded-full bg-purple-400/15 blur-3xl" />
        <div className="absolute bottom-10 left-1/3 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-md shadow-pink-500/25">
              <Mic2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-xl font-black tracking-wider text-transparent">
                SingSlot
              </span>
              <span className="ml-2 hidden text-xs font-semibold uppercase tracking-widest text-slate-400 sm:inline">
                Karaoke System
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate?.('booking')}
              title="Rooms & Slots catalog (Active in Issue #3)"
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                activeNav === 'booking'
                  ? 'bg-pink-50 text-pink-600 font-semibold shadow-sm border border-pink-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Rooms & Slots</span>
            </button>

            {userRole === 'CUSTOMER' && (
              <button
                onClick={() => onNavigate?.('my-bookings')}
                title="Customer booking history (Active in Issue #5)"
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeNav === 'my-bookings'
                    ? 'bg-pink-50 text-pink-600 font-semibold shadow-sm border border-pink-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <User className="h-4 w-4" />
                <span>My Bookings</span>
              </button>
            )}

            {userRole === 'STAFF' && (
              <button
                onClick={() => onNavigate?.('staff-schedule')}
                title="Staff master schedule (Active in Issue #6)"
                className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  activeNav === 'staff-schedule'
                    ? 'bg-purple-50 text-purple-700 font-semibold shadow-sm border border-purple-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Master Schedule</span>
              </button>
            )}
          </nav>

          {/* User Profile / Auth State */}
          <div className="flex items-center gap-3">
            {userName ? (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <div className="text-sm font-semibold text-slate-800">{userName}</div>
                  <div className="text-xs text-pink-600 font-medium">{userRole}</div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate?.('login')}
                title="User sign in (Active in Issue #2)"
                className="rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md shadow-pink-500/20 hover:brightness-105 active:brightness-95 transition-all"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/60 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4">
          <p>© 2026 SingSlot — Karaoke Room Reservation & Management System | CPE 334 Project</p>
          <p className="mt-1 text-slate-400">Built with React, Vite, Tailwind CSS, Node.js, Express & PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
};
