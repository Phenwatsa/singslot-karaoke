import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Phone,
  User as UserIcon,
  ChevronDown,
  X
} from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { DatePicker } from '../common/DatePicker';
import { Room, RoomAvailability, AvailabilityResponse } from '../../types/room';
import { getBangkokTodayString } from '../../utils/date';

interface StaffWalkInPanelProps {
  token: string | null;
  rooms: Room[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onWalkInCreated: () => void;
}

const SLOT_OPTIONS = Array.from({ length: 14 }, (_, idx) => ({
  slotIndex: idx,
  label: `${String(10 + idx).padStart(2, '0')}:00 – ${String(11 + idx).padStart(2, '0')}:00`
}));

export const StaffWalkInPanel: React.FC<StaffWalkInPanelProps> = ({
  token,
  rooms,
  selectedDate,
  onDateChange,
  onWalkInCreated
}) => {
  const [roomId, setRoomId] = useState<string>(rooms[0]?.id || '');
  const [startSlot, setStartSlot] = useState<number>(0);
  const [durationHours, setDurationHours] = useState<number>(2);
  const [partySize, setPartySize] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{
    bookingCode: string;
    roomNumber: string;
    timeRange: string;
    totalPrice: number;
  } | null>(null);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === roomId) || rooms[0] || null,
    [rooms, roomId]
  );

  // Fetch live slot status so past & occupied slots are clearly labeled and prevented
  useEffect(() => {
    if (!selectedDate) return;
    let isCurrent = true;
    const loadAvail = async () => {
      try {
        const res = await fetch(`/api/availability?date=${selectedDate}`);
        if (res.ok) {
          const data: AvailabilityResponse = await res.json();
          if (isCurrent && data.success && Array.isArray(data.rooms)) {
            setAvailability(data.rooms);
          }
        }
      } catch {
        // Non-fatal UI enhancement; backend still enforces authoritative rules
      }
    };
    loadAvail();
    return () => {
      isCurrent = false;
    };
  }, [selectedDate, successInfo]);

  const activeRoomSlots = useMemo(() => {
    if (!activeRoom) return [];
    const found = availability.find((r) => r.id === activeRoom.id);
    return found?.slots || [];
  }, [availability, activeRoom]);

  // Auto-select first open non-past slot when date or room changes
  useEffect(() => {
    if (activeRoomSlots.length === 0) return;
    const currentInfo = activeRoomSlots.find((s) => s.slotIndex === startSlot);
    if (!currentInfo || currentInfo.isPast || currentInfo.isOccupied) {
      const firstOpen = activeRoomSlots.find((s) => !s.isPast && !s.isOccupied);
      if (firstOpen) {
        setStartSlot(firstOpen.slotIndex);
      }
    }
  }, [activeRoomSlots, activeRoom?.id, selectedDate]);

  const maxDurationForSlot = Math.min(5, 14 - startSlot);
  const effectiveDuration = Math.min(durationHours, maxDurationForSlot);
  const estimatedTotal = (activeRoom?.hourlyRate ?? 0) * effectiveDuration;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Staff authentication required.');
      return;
    }
    if (!activeRoom) {
      setError('Please select a karaoke room.');
      return;
    }
    if (!customerName.trim()) {
      setError('Guest name is required for walk-in reservations.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Contact phone number is required so staff can reach the guest.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/bookings/walk-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: activeRoom.id,
          bookingDate: selectedDate,
          startSlot,
          durationHours: effectiveDuration,
          partySize,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success && data.booking) {
        setSuccessInfo({
          bookingCode: data.booking.bookingCode,
          roomNumber: data.booking.roomNumber,
          timeRange: data.booking.timeRange,
          totalPrice: data.booking.totalPrice
        });
        setCustomerName('');
        setCustomerPhone('');
        onWalkInCreated();
      } else {
        setError(data.error?.message || 'Failed to create walk-in booking.');
      }
    } catch {
      setError('Network error while submitting walk-in booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard className="p-6 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-pink-100/80">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-purple-100 to-pink-100 text-purple-700 border border-purple-200/60 shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Walk-in Booking Counter</h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              On-premise staff counter reservations (1–5 hrs, exempt from online 60-min cutoff &amp; Peak cap)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3.5 text-sm text-rose-800 shadow-2xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <span className="flex-1 font-semibold">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-700 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successInfo && (
        <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-sm text-emerald-900 shadow-2xs">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="font-extrabold">Walk-in Confirmed: {successInfo.bookingCode}</div>
            <div className="text-xs sm:text-sm font-medium text-emerald-700">
              Room {successInfo.roomNumber} • {successInfo.timeRange} • Total ฿{successInfo.totalPrice.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSuccessInfo(null)}
            className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
            aria-label="Dismiss confirmation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Room Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Karaoke Suite
            </label>
            <div className="relative">
              <select
                value={activeRoom?.id || ''}
                onChange={(e) => {
                  const nextId = e.target.value;
                  setRoomId(nextId);
                  const nextRoom = rooms.find((r) => r.id === nextId);
                  if (nextRoom && partySize > nextRoom.capacity) {
                    setPartySize(nextRoom.capacity);
                  }
                }}
                className="h-11 w-full appearance-none rounded-xl border border-pink-200/90 bg-white pl-3.5 pr-9 text-sm font-bold text-slate-800 shadow-2xs focus:border-purple-400 focus:outline-none cursor-pointer"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} ({r.type} • max {r.capacity} pax • ฿{r.hourlyRate ?? 0}/hr)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Booking Date
            </label>
            <DatePicker
              value={selectedDate}
              onChange={onDateChange}
              minDate={getBangkokTodayString()}
              label=""
              align="left"
              className="w-full"
              triggerClassName="h-11 text-sm"
              placeholder="Select Date"
            />
          </div>

          {/* Start Slot */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-sky-500" />
                Start Slot
              </span>
            </label>
            <div className="relative">
              <select
                value={startSlot}
                onChange={(e) => {
                  const nextStart = Number(e.target.value);
                  setStartSlot(nextStart);
                  const nextMax = Math.min(5, 14 - nextStart);
                  if (durationHours > nextMax) setDurationHours(nextMax);
                }}
                className="h-11 w-full appearance-none rounded-xl border border-pink-200/90 bg-white pl-3.5 pr-9 text-sm font-bold text-slate-800 shadow-2xs focus:border-purple-400 focus:outline-none cursor-pointer"
              >
                {SLOT_OPTIONS.map((slot) => {
                  const live = activeRoomSlots.find((s) => s.slotIndex === slot.slotIndex);
                  const isPast = Boolean(live?.isPast);
                  const isOccupied = Boolean(live?.isOccupied);
                  const statusLabel = isPast ? ' — Past' : isOccupied ? ' — Booked/Blocked' : '';
                  return (
                    <option
                      key={slot.slotIndex}
                      value={slot.slotIndex}
                      disabled={isPast || isOccupied}
                    >
                      Slot {slot.slotIndex} ({slot.label}){statusLabel}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Duration (1–{maxDurationForSlot} hrs)
            </label>
            <div className="flex items-center gap-1.5 h-11">
              {[1, 2, 3, 4, 5].map((hrs) => {
                const disabled = hrs > maxDurationForSlot;
                const active = effectiveDuration === hrs;
                return (
                  <button
                    key={hrs}
                    type="button"
                    disabled={disabled}
                    onClick={() => setDurationHours(hrs)}
                    className={`flex-1 h-11 rounded-xl text-sm font-extrabold border transition-all ${
                      disabled
                        ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                        : active
                        ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 text-purple-950 border-purple-300 shadow-xs cursor-pointer'
                        : 'bg-white text-slate-700 border-pink-200/80 hover:border-purple-300 cursor-pointer'
                    }`}
                  >
                    {hrs}h
                  </button>
                );
              })}
            </div>
          </div>

          {/* Party Size */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-pink-500" />
                Party Size (max {activeRoom?.capacity ?? 12})
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={activeRoom?.capacity ?? 12}
              value={partySize}
              onChange={(e) => setPartySize(Math.max(1, Number(e.target.value)))}
              className="h-11 w-full rounded-xl border border-pink-200/90 bg-white px-3.5 text-sm font-bold text-slate-800 shadow-2xs focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-purple-500" />
                Guest Name *
              </span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Walk-in Guest"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="h-11 w-full rounded-xl border border-pink-200/90 bg-white px-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-2xs focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* Contact Phone (Required in Staff UI) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-sky-500" />
                Contact Phone *
              </span>
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 081-234-5678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="h-11 w-full rounded-xl border border-pink-200/90 bg-white px-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-2xs focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* Total Fare Summary */}
          <div className="flex flex-col justify-center rounded-2xl bg-amber-50/90 border border-amber-200/90 px-4 py-2.5 h-[68px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800/80">
              Walk-in Total Fare
            </span>
            <span className="text-lg font-black text-purple-950">
              ฿{estimatedTotal.toLocaleString()}
              <span className="text-xs font-semibold text-slate-500 ml-1.5">
                ({effectiveDuration}h × ฿{activeRoom?.hourlyRate ?? 0})
              </span>
            </span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !activeRoom}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 px-6 py-3 text-sm font-black text-purple-950 shadow-md shadow-pink-200/50 hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isSubmitting ? 'Creating Walk-in...' : 'Confirm Walk-in Booking'}</span>
          </button>
        </div>
      </form>
    </GlassCard>
  );
};
