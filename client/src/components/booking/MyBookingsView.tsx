import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  Sparkles,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  MicVocal,
  History
} from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { PageHeader } from '../layout/PageHeader';

/**
 * Checks if a reservation's end time has already elapsed in Asia/Bangkok (UTC+7).
 */
const isBookingElapsed = (bookingDate: string, startSlot: number, durationHours: number): boolean => {
  const endHour = 10 + startSlot + durationHours;
  let endMs: number;
  if (endHour >= 24) {
    const startMs = new Date(`${bookingDate}T00:00:00+07:00`).getTime();
    endMs = startMs + endHour * 60 * 60 * 1000;
  } else {
    endMs = new Date(`${bookingDate}T${String(endHour).padStart(2, '0')}:00:00+07:00`).getTime();
  }
  return Date.now() >= endMs;
};

interface BookingSummary {
  id: string;
  bookingCode: string;
  bookingDate: string;
  startSlot: number;
  durationHours: number;
  timeRange?: string;
  partySize: number;
  totalPrice?: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  room: {
    id: string;
    roomNumber: string;
    type: 'SMALL' | 'MEDIUM' | 'LARGE';
    capacity: number;
    hourlyRate?: number;
    description?: string | null;
  };
}

interface MyBookingsViewProps {
  token: string | null;
  onSelectBooking: (bookingId: string) => void;
  onBookNewRoom: () => void;
  refreshTrigger?: number;
}

const TIER_THEME: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SMALL: { label: 'Small', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  LARGE: { label: 'Large', bg: 'bg-amber-50/80', text: 'text-amber-800', border: 'border-amber-200' }
};

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  token,
  onSelectBooking,
  onBookNewRoom,
  refreshTrigger = 0
}) => {
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyBookings = async () => {
    if (!token) {
      setError('Please sign in to view your reservations.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings/my', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setError(data.error?.message || 'Failed to fetch personal reservations.');
      }
    } catch (err) {
      setError('Network connection error while fetching reservations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [token, refreshTrigger]);

  const { activeBookings, historyBookings } = useMemo(() => {
    const active: BookingSummary[] = [];
    const history: BookingSummary[] = [];
    for (const b of bookings) {
      const elapsed = isBookingElapsed(b.bookingDate, b.startSlot, b.durationHours);
      if (b.status === 'CONFIRMED' && !elapsed) {
        active.push(b);
      } else {
        history.push(b);
      }
    }
    return { activeBookings: active, historyBookings: history };
  }, [bookings]);

  const renderBookingCard = (booking: BookingSummary, isHistory: boolean) => {
    const roomTier = booking.room.type || 'SMALL';
    const tierConfig = TIER_THEME[roomTier] || TIER_THEME.SMALL;
    const elapsed = isBookingElapsed(booking.bookingDate, booking.startSlot, booking.durationHours);
    const timeDisplay =
      booking.timeRange ||
      `${booking.startSlot + 10}:00 - ${booking.startSlot + booking.durationHours + 10}:00`;

    return (
      <GlassCard
        key={booking.id}
        className={`p-5 flex flex-col justify-between transition-all group ${
          isHistory
            ? 'bg-slate-50/85 border-slate-200/90 opacity-85 hover:opacity-100 hover:border-slate-300'
            : 'hover:border-purple-200 hover:shadow-md'
        }`}
      >
        <div className="space-y-3.5">
          {/* Top Row: Booking Code & Status */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`font-mono text-xs font-black tracking-wider ${
                isHistory ? 'text-slate-600' : 'text-purple-950'
              }`}
            >
              {booking.bookingCode}
            </span>
            <div className="flex items-center gap-1.5">
              {booking.status === 'CANCELLED' ? (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-rose-50 text-rose-700 border-rose-200">
                  CANCELLED
                </span>
              ) : elapsed ? (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-slate-200/80 text-slate-600 border-slate-300">
                  PAST
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                  CONFIRMED
                </span>
              )}
            </div>
          </div>

          {/* Suite Identity Row */}
          <div
            className={`flex items-center justify-between pb-2 border-b ${
              isHistory ? 'border-slate-200/70' : 'border-pink-100/60'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Karaoke Suite</span>
              <div className={`text-sm font-black ${isHistory ? 'text-slate-600' : 'text-slate-800'}`}>
                {booking.room.roomNumber}
              </div>
            </div>
            <span
              className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold border ${
                isHistory
                  ? 'bg-slate-100 text-slate-500 border-slate-200'
                  : `${tierConfig.bg} ${tierConfig.text} ${tierConfig.border}`
              }`}
            >
              {tierConfig.label}
            </span>
          </div>

          {/* Date & Time Metadata */}
          <div className="space-y-2 text-xs">
            <div className={`flex items-center gap-2 ${isHistory ? 'text-slate-500' : 'text-slate-600'}`}>
              <Calendar className={`h-3.5 w-3.5 shrink-0 ${isHistory ? 'text-slate-400' : 'text-purple-500'}`} />
              <span className="font-bold">{booking.bookingDate}</span>
            </div>

            <div className={`flex items-center gap-2 ${isHistory ? 'text-slate-500' : 'text-slate-600'}`}>
              <Clock className={`h-3.5 w-3.5 shrink-0 ${isHistory ? 'text-slate-400' : 'text-sky-500'}`} />
              <span className="font-semibold">{timeDisplay}</span>
              <span className={`text-[10px] font-bold ${isHistory ? 'text-slate-400' : 'text-purple-600'}`}>
                ({booking.durationHours}h)
              </span>
            </div>

            <div className={`flex items-center justify-between ${isHistory ? 'text-slate-500' : 'text-slate-600'}`}>
              <div className="flex items-center gap-2">
                <Users className={`h-3.5 w-3.5 shrink-0 ${isHistory ? 'text-slate-400' : 'text-pink-500'}`} />
                <span className="font-semibold">{booking.partySize} Guests</span>
              </div>
              {typeof booking.totalPrice === 'number' && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold border ${
                    isHistory
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-gradient-to-r from-cyan-100/90 via-sky-50 to-yellow-100/90 text-sky-900 border-cyan-200/80'
                  }`}
                >
                  ฿{booking.totalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onSelectBooking(booking.id)}
          className={`mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-bold transition-all focus:outline-none cursor-pointer ${
            isHistory
              ? 'border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
              : 'border-purple-200/80 bg-purple-50/50 text-purple-800 hover:bg-purple-100/70 hover:border-purple-300'
          }`}
        >
          <span>{isHistory ? 'View Details' : 'View / Manage Booking'}</span>
          <ChevronRight
            className={`h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform ${
              isHistory ? 'text-slate-400' : 'text-purple-500'
            }`}
          />
        </button>
      </GlassCard>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header with Action to Book a Suite */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="My Reservations"
          subtitle="Your personal karaoke suite reservations and check-in codes"
        />

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchMyBookings}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-full border border-pink-200/80 bg-white/80 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-xs hover:bg-white hover:shadow-sm transition-all focus:outline-none disabled:opacity-50"
            title="Refresh bookings"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onBookNewRoom}
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 px-4 py-2 text-xs font-black text-purple-950 shadow-md shadow-pink-200/50 hover:brightness-105 active:scale-95 transition-all focus:outline-none"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Book New Room</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-purple-300 border-t-purple-600" />
          <p className="text-xs font-semibold">Retrieving your bookings...</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Unable to load reservations</h4>
            <p className="text-xs mt-1 text-rose-600">{error}</p>
          </div>
          <button
            onClick={fetchMyBookings}
            className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : bookings.length === 0 ? (
        /* Empty State */
        <GlassCard className="p-10 text-center space-y-4 border-dashed border-pink-200/80 bg-white/70">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-100 via-purple-100 to-sky-100 text-purple-600 shadow-xs">
            <MicVocal className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-800">No Reservations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't reserved any karaoke suites yet. Choose an open slot in our availability matrix to start singing!
            </p>
          </div>
          <button
            onClick={onBookNewRoom}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 px-5 py-2.5 text-xs font-black text-purple-950 shadow-md shadow-pink-200/40 hover:brightness-105 active:scale-95 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Explore Rooms & Book</span>
          </button>
        </GlassCard>
      ) : (
        /* Split Sections: Upcoming/Active vs Past/Cancelled History */
        <div className="space-y-8">
          {/* Section 1: Current / Upcoming Reservations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900 tracking-tight">
                  Upcoming &amp; Active Reservations
                </h3>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-extrabold text-purple-800">
                  {activeBookings.length}
                </span>
              </div>
            </div>

            {activeBookings.length === 0 ? (
              <GlassCard className="p-6 text-center space-y-2 border-dashed border-pink-200/80 bg-white/75">
                <p className="text-xs font-bold text-slate-600">
                  No upcoming active reservations right now.
                </p>
                <button
                  onClick={onBookNewRoom}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 px-4 py-1.5 text-xs font-black text-purple-950 hover:brightness-105 cursor-pointer"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Book a Suite</span>
                </button>
              </GlassCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeBookings.map((booking) => renderBookingCard(booking, false))}
              </div>
            )}
          </div>

          {/* Section 2: Past & Cancelled History */}
          {historyBookings.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200/70">
              <div className="flex items-center gap-2 px-1">
                <History className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-black text-slate-600 tracking-tight">
                  Past &amp; Cancelled History
                </h3>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[11px] font-extrabold text-slate-600">
                  {historyBookings.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {historyBookings.map((booking) => renderBookingCard(booking, true))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

