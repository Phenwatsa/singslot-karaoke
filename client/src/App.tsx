import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { PageHeader } from './components/layout/PageHeader';
import { GlassCard } from './components/layout/GlassCard';
import { Mic2, Calendar, ShieldCheck, Music } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <AppLayout activeNav="booking" userRole="CUSTOMER" userName="Alice Customer">
      <PageHeader
        badge="Sprint 1 Scaffolding"
        title="SingSlot Karaoke System"
        subtitle="Exclusive private karaoke room reservation platform with real-time conflict prevention"
      />

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
