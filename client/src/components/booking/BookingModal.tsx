import React, { useState, useEffect } from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Room } from '../../types/room';
import { User } from '../../types/auth';
import { isPastBangkokDate, isPastBangkokSlot, getBangkokTodayString } from '../../utils/date';
import { DatePicker } from '../common/DatePicker';
import {
  X,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogIn,
  Mic2,
  ChevronDown
} from 'lucide-react';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  selectedRoomId?: string;
  selectedDate: string;
  selectedSlot?: number;
  token: string | null;
  user: User | null;
  onBookingSuccess: (booking: any) => void;
  onRequestLogin: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  selectedRoomId,
  selectedDate,
  selectedSlot = 0,
  token,
  user,
  onBookingSuccess,
  onRequestLogin
}) => {
  const [roomId, setRoomId] = useState<string>(selectedRoomId || '');
  const [bookingDate, setBookingDate] = useState<string>(selectedDate);
  const [startSlot, setStartSlot] = useState<number>(selectedSlot);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [partySize, setPartySize] = useState<number>(2);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Sync state when props change
  useEffect(() => {
    if (selectedRoomId) setRoomId(selectedRoomId);
    else if (rooms.length > 0 && !roomId) setRoomId(rooms[0].id);
  }, [selectedRoomId, rooms]);

  useEffect(() => {
    if (selectedDate) setBookingDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (selectedSlot !== undefined) {
      setStartSlot(selectedSlot);
      // Auto-clamp duration when slot changes so default duration never exceeds 24:00 closing time
      const maxAllowed = Math.min(5, Math.max(1, 14 - selectedSlot));
      setDurationHours((prev) => Math.min(prev, maxAllowed));
    }
  }, [selectedSlot]);

  // Ensure durationHours is automatically clamped when startSlot is modified by user
  useEffect(() => {
    const maxAllowed = Math.min(5, Math.max(1, 14 - startSlot));
    if (durationHours > maxAllowed) {
      setDurationHours(maxAllowed);
    }
  }, [startSlot, durationHours]);

  const currentRoom = rooms.find((r) => r.id === roomId) || rooms[0];
  const maxCapacity = currentRoom ? currentRoom.capacity : 4;

  // Auto-clamp partySize if selected room capacity changes
  useEffect(() => {
    if (currentRoom && partySize > currentRoom.capacity) {
      setPartySize(currentRoom.capacity);
    }
  }, [roomId, currentRoom?.capacity]);

  useEffect(() => {
    // Reset transient states on open and lock body scroll to prevent background jitter/clicks
    if (isOpen) {
      setError(null);
      setConfirmedBooking(null);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate start and end hours for preview
  const startHour = 10 + startSlot;
  const endHour = startHour + durationHours;
  const timeRangePreview = `${String(startHour).padStart(2, '0')}:00 - ${String(endHour).padStart(2, '0')}:00`;
  const isPastDate = isPastBangkokDate(bookingDate);
  const isSelectedSlotPast = isPastBangkokSlot(bookingDate, startSlot);
  const exceedsOperatingHours = startSlot + durationHours - 1 > 13;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Authentication required. Please sign in to submit a booking.');
      return;
    }

    if (isPastDate) {
      setError('Cannot book reservations for past calendar dates (BR-04).');
      return;
    }

    if (isSelectedSlotPast) {
      setError('Selected start slot has already elapsed today in Asia/Bangkok time (BR-04). Please choose an upcoming open slot.');
      return;
    }

    if (exceedsOperatingHours) {
      setError('Booking duration extends past midnight closing time (24:00). Please shorten duration or select an earlier start slot.');
      return;
    }

    if (partySize > maxCapacity) {
      setError(`Party size (${partySize}) exceeds room capacity (${maxCapacity} guests).`);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/bookings/online', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: currentRoom?.id,
          bookingDate,
          startSlot,
          durationHours,
          partySize
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error?.message || `Booking request failed (HTTP ${res.status}).`);
        return;
      }

      setConfirmedBooking(data.booking);
      onBookingSuccess(data.booking);
    } catch (err: any) {
      setError('Failed to connect to reservation service. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="border-pink-200/90 bg-white/98 shadow-2xl p-4 sm:p-6 relative max-h-[88vh] flex flex-col">
          {/* Header Bar: Badge on left, Close Button X on right (Always visible at top of card) */}
          <div className="flex items-center justify-between pb-3 border-b border-pink-100/70 shrink-0">
            {/* Feature F-04: Online Customer Reservation Engine */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 px-3 py-1 text-[11px] font-extrabold text-purple-950 border border-pink-200/60 shadow-2xs">
              <Sparkles className="h-3 w-3 text-purple-600" />
              <span>Online Reservation</span>
            </span>

            {/* Close Button at Top-Right of Card Header */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
              aria-label="Close booking modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success Confirmation View */}
          {confirmedBooking ? (
            <div className="flex-1 overflow-y-auto space-y-5 text-center py-3 pr-1">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-inner">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  Reservation Confirmed
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  You're Booked for SingSlot!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Your reservation is locked in PostgreSQL with zero-conflict guarantee.
                </p>
              </div>

              {/* Booking Details Card */}
              <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-pink-100/60">
                  <span className="text-slate-500 font-medium">Booking Code</span>
                  <span className="font-mono font-bold text-purple-700 text-sm">
                    {confirmedBooking.bookingCode}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-pink-100/60">
                  <span className="text-slate-500 font-medium">Room</span>
                  <span className="font-bold text-slate-800">
                    Room {confirmedBooking.roomNumber} ({currentRoom?.type})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-pink-100/60">
                  <span className="text-slate-500 font-medium">Date</span>
                  <span className="font-bold text-slate-800">{confirmedBooking.bookingDate}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-pink-100/60">
                  <span className="text-slate-500 font-medium">Time Window</span>
                  <span className="font-bold text-emerald-700">
                    {confirmedBooking.timeRange} ({confirmedBooking.durationHours} hrs)
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Party Size</span>
                  <span className="font-bold text-slate-800">{confirmedBooking.partySize} guests</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 py-3 text-sm font-extrabold text-purple-950 shadow-sm shadow-purple-100 hover:brightness-105 active:scale-95 border border-pink-200/50 transition-all cursor-pointer"
              >
                Done & Return to Schedule
              </button>
            </div>
          ) : (
            /* Booking Input Form */
            <form noValidate onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 pt-2">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {/* Modal Title & User Account Badge (Broken cleanly across lines) */}
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Reserve a Karaoke Room
                    </h3>
                    {user && (
                      <div className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span>Booking as: <strong className="text-slate-800">{user.fullName}</strong></span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Select 1 to 5 contiguous hours within operating window (10:00 – 24:00).
                  </p>
                </div>

                {/* Unauthenticated Alert */}
                {!token && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span className="font-medium">Please sign in as a customer to submit reservations.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onRequestLogin();
                      }}
                      className="flex items-center gap-1.5 shrink-0 rounded-full bg-amber-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors cursor-pointer shadow-xs"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In</span>
                    </button>
                  </div>
                )}

                {/* Error Alert */}
                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs text-rose-800 flex items-start gap-2.5 shadow-2xs">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

              {/* Row 1: Room Selector & Date Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Mic2 className="h-3.5 w-3.5 text-pink-500" />
                    <span>Select Karaoke Suite</span>
                  </label>
                  <div className="relative">
                    <select
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      className="w-full h-11 appearance-none rounded-xl border border-pink-200/80 bg-white pl-3.5 pr-10 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200/60 focus:border-purple-400 shadow-2xs cursor-pointer transition-all"
                    >
                      {rooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.roomNumber} ({r.type} • max {r.capacity} pax)
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <ChevronDown className="h-4 w-4 stroke-[2.2]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                    <span>Booking Date</span>
                  </label>
                  <DatePicker
                    value={bookingDate}
                    onChange={(date) => setBookingDate(date)}
                    onClear={() => setBookingDate(getBangkokTodayString())}
                    minDate={getBangkokTodayString()}
                    label=""
                    className="w-full"
                    triggerClassName="w-full h-11 px-3.5 bg-white border-pink-200/80 hover:border-pink-300 focus:border-purple-400"
                  />
                </div>
              </div>

              {/* Row 2: Start Slot & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-sky-500" />
                    <span>Start Time Slot</span>
                  </label>
                  <div className="relative">
                    <select
                      value={startSlot}
                      onChange={(e) => setStartSlot(Number(e.target.value))}
                      className="w-full h-11 appearance-none rounded-xl border border-pink-200/80 bg-white pl-3.5 pr-10 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200/60 focus:border-purple-400 shadow-2xs cursor-pointer transition-all"
                    >
                      {Array.from({ length: 14 }).map((_, idx) => {
                        const isSlotPast = isPastBangkokSlot(bookingDate, idx);
                        return (
                          <option key={idx} value={idx} disabled={isSlotPast}>
                            Slot #{idx} ({10 + idx}:00 – {11 + idx}:00) {isSlotPast ? '(Elapsed)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <ChevronDown className="h-4 w-4 stroke-[2.2]" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-purple-500" />
                    <span>Duration (1–5 Hours)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={durationHours}
                      onChange={(e) => setDurationHours(Number(e.target.value))}
                      className="w-full h-11 appearance-none rounded-xl border border-pink-200/80 bg-white pl-3.5 pr-10 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200/60 focus:border-purple-400 shadow-2xs cursor-pointer transition-all"
                    >
                      {[1, 2, 3, 4, 5].map((d) => (
                        <option
                          key={d}
                          value={d}
                          disabled={startSlot + d - 1 > 13}
                        >
                          {d} Hour{d > 1 ? 's' : ''} {startSlot + d - 1 > 13 ? '(Exceeds 24:00)' : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <ChevronDown className="h-4 w-4 stroke-[2.2]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Modern Minimal Party Size Stepper & Harmonized Time Range Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-pink-500" />
                    <span>Party Size (Guests)</span>
                  </label>
                  {/* Minimal Stepper */}
                  <div className="flex h-11 items-center justify-between rounded-xl border border-pink-200/80 bg-white px-2.5 shadow-2xs hover:border-pink-300 transition-colors">
                    <button
                      type="button"
                      disabled={partySize <= 1}
                      onClick={() => setPartySize((p) => Math.max(1, p - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-purple-900 hover:bg-purple-50 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-base select-none"
                      title="Decrease guests"
                    >
                      −
                    </button>
                    <div className="flex items-center gap-1.5 select-none">
                      <span className="text-sm font-black text-slate-900">
                        {partySize}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {partySize === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={partySize >= maxCapacity}
                      onClick={() => setPartySize((p) => Math.min(maxCapacity, p + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-purple-900 hover:bg-purple-50 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-bold text-base select-none"
                      title="Increase guests"
                    >
                      +
                    </button>
                    {/* Hidden input ensuring test contract & form payload binding */}
                    <input type="hidden" name="partySize" value={partySize} />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium mt-1.5 block">
                    Room capacity: up to {maxCapacity} guests
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-purple-900 mb-2 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-purple-600" />
                    <span>Calculated Time Window</span>
                  </label>
                  <div className="h-11 flex items-center justify-between rounded-xl border border-purple-200/80 bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-sky-50/60 px-3.5 shadow-2xs">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      {timeRangePreview}
                    </span>
                    <span className="text-[11px] font-extrabold text-purple-900 bg-white/95 px-2.5 py-0.5 rounded-full border border-pink-200/60 shadow-2xs">
                      {durationHours} hr{durationHours > 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-[11px] text-purple-600 font-semibold mt-1.5 block">
                    {durationHours} contiguous hour{durationHours > 1 ? 's' : ''} reserved
                  </span>
                </div>
                </div>
              </div>

              {/* Submit Button (Pinned at bottom of modal card) */}
              <div className="pt-3.5 mt-2 border-t border-pink-100/70 shrink-0 bg-white/98">
                <button
                  type="submit"
                  disabled={isLoading || !token || exceedsOperatingHours || isPastDate || isSelectedSlotPast}
                  className={`w-full h-11 sm:h-12 rounded-full text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all border ${
                    isLoading || !token || exceedsOperatingHours || isPastDate || isSelectedSlotPast
                      ? 'bg-slate-200 text-slate-400 border-slate-200 shadow-none cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 text-purple-950 border-pink-200/50 shadow-sm shadow-purple-100 hover:brightness-105 active:scale-95 cursor-pointer'
                  }`}
                >
                  {isLoading
                    ? 'Locking In Reservation...'
                    : !token
                    ? 'Sign In Required to Book'
                    : exceedsOperatingHours
                    ? 'Exceeds Operating Hours'
                    : isPastDate
                    ? 'Cannot Book Past Date'
                    : isSelectedSlotPast
                    ? 'Selected Slot Already Elapsed'
                    : `Confirm Reservation (${timeRangePreview})`}
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
