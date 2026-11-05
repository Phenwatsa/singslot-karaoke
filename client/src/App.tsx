import React, { useState, useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { PageHeader } from './components/layout/PageHeader';
import { GlassCard } from './components/layout/GlassCard';
import { LoginModal } from './components/auth/LoginModal';
import { User } from './types/auth';
import {
  saveClientSession,
  clearClientSession,
  validateAndRestoreSession
} from './utils/session';
import {
  Mic2,
  Calendar,
  ShieldCheck,
  Info,
  CheckCircle2,
  User as UserIcon,
  Sparkles
} from 'lucide-react';

type NavRoute = 'booking' | 'my-bookings' | 'staff-schedule' | 'login';

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavRoute>('booking');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'info' | 'success';
    message: string;
  } | null>(null);

  // Load saved session from localStorage and validate active token with /api/auth/me
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { token: validatedToken, user: validatedUser } = await validateAndRestoreSession();
        if (validatedToken && validatedUser) {
          setToken(validatedToken);
          setUser(validatedUser);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed to restore or validate session from localStorage', err);
      }
    };

    restoreSession();
  }, []);

  const handleNavigate = (route: NavRoute) => {
    setActiveNav(route);
    switch (route) {
      case 'login':
        setIsLoginOpen(true);
        break;
      case 'booking':
        setNotice({
          type: 'info',
          message: 'Notice: Interactive Room & Slot availability grid will be activated in Issue #3.'
        });
        break;
      case 'my-bookings':
        setNotice({
          type: 'info',
          message: 'Notice: Customer booking history view will be activated in Issue #5.'
        });
        break;
      case 'staff-schedule':
        setNotice({
          type: 'info',
          message: 'Notice: Staff master schedule grid will be activated in Issue #6.'
        });
        break;
      default:
        setNotice(null);
    }
  };

  const handleLoginSuccess = (authenticatedUser: User, receivedToken: string) => {
    setUser(authenticatedUser);
    setToken(receivedToken);
    saveClientSession(receivedToken, authenticatedUser);
    setNotice({
      type: 'success',
      message: `Signed in successfully as ${authenticatedUser.fullName} (${authenticatedUser.role})!`
    });
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (err) {
        console.warn('Logout request failed or timed out', err);
      }
    }

    clearClientSession();
    setUser(null);
    setToken(null);
    setActiveNav('booking');
    setNotice({
      type: 'info',
      message: 'You have been logged out successfully. Local token cleared.'
    });
  };

  return (
    <AppLayout
      activeNav={activeNav}
      userRole={user?.role || null}
      userName={user?.fullName || null}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <PageHeader
        badge={user ? `Authenticated as ${user.role}` : 'Issue #2 Active: Seeded Auth & RBAC'}
        title="SingSlot Karaoke System"
        subtitle={
          user
            ? `Welcome back, ${user.fullName}! Your session is active with role ${user.role}.`
            : 'Sign in using seeded staff or customer demo accounts to explore authenticated workflows.'
        }
      />

      {/* Interactive Navigation / Feedback Banner */}
      {notice && (
        <div
          className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-pink-500/30 bg-pink-500/10 text-pink-300'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <Info className="h-5 w-5 shrink-0 mt-0.5 text-pink-400" />
          )}
          <div className="flex-1 text-sm font-medium">{notice.message}</div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Session Card if Logged In */}
      {user && (
        <div className="mb-8">
          <GlassCard className="border-pink-500/30 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-base">{user.fullName}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${
                        user.role === 'STAFF'
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30'
                          : 'bg-pink-500/30 text-pink-300 border border-pink-400/30'
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/10 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 transition-colors"
                >
                  Terminate Session
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Feature Architecture Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-pink-400">
            <Mic2 className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-100">Seeded Fleet</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            9 private rooms across Small (4 pax), Medium (8 pax), and Large (12 pax) tiers operating 10:00 to 24:00 daily.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-purple-400">
            <Calendar className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-100">14 Hourly Slots</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Discrete 0-indexed hourly slots (0..13) allowing 1 to 5 contiguous hours with strict zero-overlap locks.
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-3 mb-4 text-indigo-400">
            <ShieldCheck className="h-6 w-6" />
            <h3 className="text-lg font-bold text-slate-100">Role Isolation (RBAC)</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            JWT verification with 8-hour lifetime enforcing CUSTOMER vs. STAFF role boundaries and data privacy.
          </p>
        </GlassCard>
      </div>

      <div className="mt-8">
        <GlassCard className="border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-indigo-500/5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-pink-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-300">
              Issue #2 Authentication active. Click &quot;Sign In&quot; to test quick-fill demo logins.
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </AppLayout>
  );
};

export default App;
