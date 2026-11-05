import React, { useState } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { PageHeader } from './components/layout/PageHeader';
import { GlassCard } from './components/layout/GlassCard';
import { Mic2, Calendar, ShieldCheck, Music, Info, AlertCircle } from 'lucide-react';

type NavRoute = 'booking' | 'my-bookings' | 'staff-schedule' | 'login';

export const App: React.FC = () => {
  const [activeNav, setActiveNav] = useState<NavRoute>('booking');
  const [notice, setNotice] = useState<string | null>(null);

  const handleNavigate = (route: NavRoute) => {
    setActiveNav(route);
    switch (route) {
      case 'login':
        setNotice('Notice: Authentication modal & JWT login will be activated in Issue #2 (feat/issue-2-auth-jwt-roles).');
        break;
      case 'booking':
        setNotice('Notice: Interactive Room & Slot availability grid will be activated in Issue #3.');
        break;
      case 'my-bookings':
        setNotice('Notice: Customer booking history view will be activated in Issue #5.');
        break;
      case 'staff-schedule':
        setNotice('Notice: Staff master schedule grid will be activated in Issue #6.');
        break;
      default:
        setNotice(null);
    }
  };

  const handleLogout = () => {
    setNotice('Notice: Session termination and token cleanup will be activated in Issue #2.');
  };

  return (
    <AppLayout
      activeNav={activeNav}
      userRole={null}
      userName={null}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      <PageHeader
        badge="Issue #1 Baseline Shell (Unauthenticated)"
        title="SingSlot Karaoke System"
        subtitle="Shared layout shell and architectural foundation. Authentication and interactive booking will be activated in subsequent issues."
      />

      {/* Interactive Navigation / Placeholder Feedback Banner */}
      {notice && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-pink-500/30 bg-pink-500/10 p-4 text-pink-300">
          <Info className="h-5 w-5 shrink-0 mt-0.5 text-pink-400" />
          <div className="flex-1 text-sm font-medium">{notice}</div>
          <button
            onClick={() => setNotice(null)}
            className="text-xs text-pink-400/80 hover:text-pink-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Explicit Scaffold Notice */}
      <div className="mb-8 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-300/90">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
        <span>
          <strong>Scaffold Mode:</strong> User authentication is not active in Issue #1. Click &quot;Sign In&quot; or navigation buttons to preview routing dispatch for Issue #2+.
        </span>
      </div>

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
            <h3 className="text-lg font-bold text-slate-100">Role Isolation</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Dedicated Customer and Staff workflows with server-enforced JWT route protection and data privacy.
          </p>
        </GlassCard>
      </div>

      <div className="mt-8">
        <GlassCard className="border-pink-500/20 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-indigo-500/5">
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-pink-400 animate-pulse" />
            <span className="text-sm font-medium text-slate-300">
              System baseline and shared layout shell initialized successfully. Ready for Issue #2 (Auth) and Issue #3 (Availability).
            </span>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
};

export default App;
