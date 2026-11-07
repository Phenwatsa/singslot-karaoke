import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Sparkles, ChevronRight, AlertCircle, RefreshCw, PlusCircle, MicVocal } from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { PageHeader } from '../layout/PageHeader';

interface BookingSummary {
  id: string;
  bookingCode: string;
  bookingDate: string;
  startSlot: number;
  durationHours: number;
  timeRange?: string;
  partySize: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  room: {
    id: string;
    roomNumber: string;
    type: 'SMALL' | 'MEDIUM' | 'LARGE';
    capacity: number;
    description?: string | null;
  };
}

interface MyBookingsViewProps {
  token: string | null;
  onSelectBooking: (bookingId: string) => void;
  onBookNewRoom: () => void;
}

const TIER_THEME: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SMALL: { label: 'Small', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  LARGE: { label: 'Large', bg: 'bg-amber-50/80', text: 'text-amber-800', border: 'border-amber-200' }
};

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  token,
  onSelectBooking,
  onBookNewRoom
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
  }, [token]);

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
        /* Bookings List Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => {
            const roomTier = booking.room.type || 'SMALL';
            const tierConfig = TIER_THEME[roomTier] || TIER_THEME.SMALL;
            const timeDisplay =
              booking.timeRange ||
              `${booking.startSlot + 10}:00 - ${booking.startSlot + booking.durationHours + 10}:00`;

            return (
              <GlassCard
                key={booking.id}
                className="p-5 flex flex-col justify-between hover:border-purple-200 hover:shadow-md transition-all group"
              >
                <div className="space-y-3.5">
                  {/* Top Row: Booking Code & Status */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black tracking-wider text-purple-950">
                      {booking.bookingCode}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      {booking.status}
                    </span>
                  </div>

                  {/* Suite Identity Row */}
                  <div className="flex items-center justify-between pb-2 border-b border-pink-100/60">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Karaoke Suite</span>
                      <div className="text-sm font-black text-slate-800">{booking.room.roomNumber}</div>
                    </div>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold border ${tierConfig.bg} ${tierConfig.text} ${tierConfig.border}`}
                    >
                      {tierConfig.label}
                    </span>
                  </div>

                  {/* Date & Time Metadata */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span className="font-bold">{booking.bookingDate}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span className="font-semibold">{timeDisplay}</span>
                      <span className="text-[10px] text-purple-600 font-bold">({booking.durationHours}h)</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                      <span className="font-semibold">{booking.partySize} Guests</span>
                    </div>
                  </div>
                </div>

                {/* View Details Action Button */}
                <button
                  onClick={() => onSelectBooking(booking.id)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-purple-200/80 bg-purple-50/50 py-2 text-xs font-bold text-purple-800 hover:bg-purple-100/70 hover:border-purple-300 transition-all focus:outline-none"
                >
                  <span>View Details</span>
                  <ChevronRight className="h-3.5 w-3.5 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

