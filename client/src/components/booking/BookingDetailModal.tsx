import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Sparkles, Phone, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';

interface BookingSlot {
  id: string;
  slotIndex: number;
}

interface BookingDetail {
  id: string;
  bookingCode: string;
  userId: string;
  bookingDate: string;
  startSlot: number;
  durationHours: number;
  timeRange?: string;
  partySize: number;
  customerName: string;
  customerPhone?: string | null;
  channel: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  room: {
    id: string;
    roomNumber: string;
    type: 'SMALL' | 'MEDIUM' | 'LARGE';
    capacity: number;
    description?: string | null;
  };
  slots: BookingSlot[];
}

interface BookingDetailModalProps {
  bookingId: string | null;
  token: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const TIER_THEME: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SMALL: { label: 'Small Suite', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  MEDIUM: { label: 'Medium Party', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  LARGE: { label: 'VIP Luxury', bg: 'bg-amber-50/80', text: 'text-amber-800', border: 'border-amber-200' }
};

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  bookingId,
  token,
  isOpen,
  onClose
}) => {
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch booking details (GET /api/bookings/:id, FR-05, AC-05b)
  useEffect(() => {
    if (!isOpen || !bookingId || !token) {
      setBooking(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchDetail = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        if (!isMounted) return;

        if (res.ok && data.success && data.booking) {
          setBooking(data.booking);
        } else {
          setError(data.error?.message || 'Failed to load reservation details.');
        }
      } catch (err) {
        if (isMounted) {
          setError('Network error while connecting to server.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [isOpen, bookingId, token]);

  if (!isOpen) return null;

  const roomTier = booking?.room?.type || 'SMALL';
  const tierConfig = TIER_THEME[roomTier] || TIER_THEME.SMALL;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white/95 rounded-3xl border border-pink-100 shadow-2xl shadow-purple-200/50 backdrop-blur-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header with Action Close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-pink-100/70 bg-white/90">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200/60">
              <Sparkles className="h-3 w-3 text-purple-500" />
              Reservation Detail
            </span>
            {booking && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {booking.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-purple-300 border-t-purple-600" />
              <p className="text-xs font-semibold">Loading reservation details...</p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Access Denied or Not Found</h4>
                <p className="text-xs mt-1 text-rose-600">{error}</p>
              </div>
            </div>
          ) : booking ? (
            <>
              {/* Highlight Card: Booking Code & Room Number */}
              <GlassCard className="p-4 border-purple-100/80 bg-gradient-to-r from-pink-50/50 via-purple-50/40 to-sky-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Booking Reference</span>
                    <h3 className="text-lg font-black tracking-wider text-purple-950">{booking.bookingCode}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Suite</span>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-base font-black text-slate-800">{booking.room.roomNumber}</span>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold border ${tierConfig.bg} ${tierConfig.text} ${tierConfig.border}`}>
                        {tierConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Schedule Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Date</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-800">{booking.bookingDate}</div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                    <Clock className="h-3.5 w-3.5 text-sky-500" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Time Window</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-800">
                    {booking.timeRange || `${booking.startSlot + 10}:00 - ${booking.startSlot + booking.durationHours + 10}:00`}
                  </div>
                  <div className="text-[10px] font-semibold text-purple-600 mt-0.5">{booking.durationHours} hrs reserved</div>
                </div>
              </div>

              {/* Guest & Customer Details */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Guest Information</span>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Customer</div>
                      <div className="text-xs font-bold text-slate-800">{booking.customerName}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-pink-50 text-pink-600">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Party Size</div>
                      <div className="text-xs font-bold text-slate-800">{booking.partySize} Guests</div>
                    </div>
                  </div>
                </div>

                {booking.customerPhone && (
                  <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Contact Phone</div>
                      <div className="text-xs font-bold text-slate-800">{booking.customerPhone}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Discrete Reserved Slots Pill Breakdown */}
              <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reserved Hourly Slots</span>
                  <span className="text-[11px] font-bold text-purple-600">{booking.slots.length} Slots</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {booking.slots.map((slot) => {
                    const startH = 10 + slot.slotIndex;
                    const endH = startH + 1;
                    return (
                      <span
                        key={slot.id || slot.slotIndex}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-purple-100 bg-purple-50/70 px-3 py-1 text-xs font-bold text-purple-900"
                      >
                        Slot #{slot.slotIndex} ({startH}:00 – {endH}:00)
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer with Close Button */}
        <div className="px-6 py-4 border-t border-pink-100/70 bg-white/90 text-right">
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-xl bg-slate-100 px-6 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

