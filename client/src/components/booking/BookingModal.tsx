import React, { useState, useEffect } from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Room } from '../../types/room';
import { User } from '../../types/auth';
import { isPastBangkokDate, isPastBangkokSlot } from '../../utils/date';
import {
  X,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogIn,
  Mic2
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

  useEffect(() => {
    // Reset transient states on open
    if (isOpen) {
      setError(null);
      setConfirmedBooking(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentRoom = rooms.find((r) => r.id === roomId) || rooms[0];
  const maxCapacity = currentRoom ? currentRoom.capacity : 4;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg">
        <GlassCard className="border-pink-200/90 bg-white/95 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Success Confirmation View */}
          {confirmedBooking ? (
            <div className="space-y-6 text-center py-4">
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">
                    <Sparkles className="h-4 w-4" />
                    <span>Online Reservation • Feature F-04</span>
                  </div>
                  {user && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Booking as: <strong className="text-slate-700">{user.fullName}</strong>
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Reserve a Karaoke Room
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select 1 to 5 contiguous hours within operating window (10:00 - 24:00).
                </p>
              </div>

              {/* Unauthenticated Alert */}
              {!token && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                    <span>Please sign in as a customer to submit reservations.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestLogin();
                    }}
                    className="flex items-center gap-1.5 shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 font-bold text-white hover:bg-amber-700 transition-colors cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Room Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Mic2 className="h-3.5 w-3.5 text-pink-500" />
                    <span>Room Fleet</span>
                  </label>
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-400 shadow-xs cursor-pointer"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.roomNumber} ({r.type} • max {r.capacity} pax)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                    <span>Booking Date</span>
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-400 shadow-xs cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Slot Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-sky-500" />
                    <span>Start Slot</span>
                  </label>
                  <select
                    value={startSlot}
                    onChange={(e) => setStartSlot(Number(e.target.value))}
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-400 shadow-xs cursor-pointer"
                  >
                    {Array.from({ length: 14 }).map((_, idx) => {
                      const isSlotPast = isPastBangkokSlot(bookingDate, idx);
                      return (
                        <option key={idx} value={idx} disabled={isSlotPast}>
                          Slot #{idx} ({10 + idx}:00 - {11 + idx}:00) {isSlotPast ? '(Elapsed)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Duration Hours Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-purple-500" />
                    <span>Duration (1–5 Hours)</span>
                  </label>
                  <select
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-400 shadow-xs cursor-pointer"
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
                </div>
              </div>

              {/* Party Size & Live Window Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-pink-500" />
                    <span>Party Size (Max {maxCapacity})</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxCapacity}
                    value={partySize}
                    onChange={(e) => setPartySize(Number(e.target.value))}
                    className="w-full rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-purple-400 shadow-xs"
                  />
                </div>

                {/* Time Window Preview Pill */}
                <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-2.5 text-xs">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wide block">
                    Calculated Time Range
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {timeRangePreview}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {durationHours} contiguous hour{durationHours > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !token || exceedsOperatingHours || isPastDate || isSelectedSlotPast}
                  className={`w-full rounded-full py-3 text-xs font-extrabold uppercase tracking-wider transition-all border ${
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
