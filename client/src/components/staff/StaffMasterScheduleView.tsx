import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShieldCheck, Clock, Users, User, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { PageHeader } from '../layout/PageHeader';
import { DatePicker } from '../common/DatePicker';
import { getBangkokTodayString } from '../../utils/date';

interface MasterBooking {
  id: string;
  bookingCode: string;
  userId: string;
  roomId: string;
  bookingDate: string;
  startSlot: number;
  durationHours: number;
  timeRange?: string;
  partySize: number;
  customerName: string;
  customerPhone?: string | null;
  channel: string;
  status: 'CONFIRMED' | 'CANCELLED';
  room: {
    id: string;
    roomNumber: string;
    type: 'SMALL' | 'MEDIUM' | 'LARGE';
    capacity: number;
    description?: string | null;
  };
  slots: Array<{ id?: string; slotIndex: number }>;
}

interface StaffMasterScheduleViewProps {
  token: string | null;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSelectBooking: (bookingId: string) => void;
}

const ROOM_LIST = [
  { roomNumber: 'S01', type: 'SMALL', capacity: 4 },
  { roomNumber: 'S02', type: 'SMALL', capacity: 4 },
  { roomNumber: 'S03', type: 'SMALL', capacity: 4 },
  { roomNumber: 'M01', type: 'MEDIUM', capacity: 8 },
  { roomNumber: 'M02', type: 'MEDIUM', capacity: 8 },
  { roomNumber: 'M03', type: 'MEDIUM', capacity: 8 },
  { roomNumber: 'L01', type: 'LARGE', capacity: 12 },
  { roomNumber: 'L02', type: 'LARGE', capacity: 12 },
  { roomNumber: 'L03', type: 'LARGE', capacity: 12 }
] as const;

const TIER_THEME: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SMALL: { label: 'Small', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  LARGE: { label: 'Large', bg: 'bg-amber-50/80', text: 'text-amber-800', border: 'border-amber-200' }
};

export const StaffMasterScheduleView: React.FC<StaffMasterScheduleViewProps> = ({
  token,
  selectedDate,
  onDateChange,
  onSelectBooking
}) => {
  const [bookings, setBookings] = useState<MasterBooking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Natural trackpad gesture listener for horizontal table swipe
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        el.scrollLeft += e.deltaX;
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Fetch schedule with AbortController to eliminate stale-response race conditions
  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    const fetchSchedule = async () => {
      if (!token) {
        setError('Staff authentication required.');
        setIsLoading(false);
        return;
      }

      if (!selectedDate) {
        setError('Please select a valid date.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/bookings/master?date=${selectedDate}`, {
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await res.json();
        if (isCurrent) {
          if (res.ok && data.success && Array.isArray(data.bookings)) {
            setBookings(data.bookings);
          } else {
            setError(data.error?.message || 'Failed to fetch master schedule.');
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        if (isCurrent) {
          setError('Network connection error while fetching master schedule.');
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    };

    fetchSchedule();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [token, selectedDate, refreshTrigger]);

  // Pre-index bookings by room and slotIndex for O(1) matrix lookup
  const occupancyMap = useMemo(() => {
    const map = new Map<
      string,
      {
        booking: MasterBooking;
        isFirstSlot: boolean;
        isLastSlot: boolean;
        spanIndex: number;
      }
    >();

    for (const b of bookings) {
      const roomNum = b.room.roomNumber;
      const sortedSlots = [...b.slots].sort((a, b) => a.slotIndex - b.slotIndex);
      const firstSlot = sortedSlots[0]?.slotIndex;
      const lastSlot = sortedSlots[sortedSlots.length - 1]?.slotIndex;

      sortedSlots.forEach((slot, idx) => {
        map.set(`${roomNum}_${slot.slotIndex}`, {
          booking: b,
          isFirstSlot: slot.slotIndex === firstSlot,
          isLastSlot: slot.slotIndex === lastSlot,
          spanIndex: idx
        });
      });
    }
    return map;
  }, [bookings]);

  // Group bookings by roomNumber for list overview
  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, MasterBooking[]>();
    for (const b of bookings) {
      const roomNum = b.room.roomNumber;
      if (!map.has(roomNum)) {
        map.set(roomNum, []);
      }
      map.get(roomNum)!.push(b);
    }
    return map;
  }, [bookings]);

  const totalReservedHours = useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.durationHours, 0);
  }, [bookings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header with Staff Badge & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            Staff Cashier Console
          </div>
          <PageHeader
            title="Master Schedule"
            subtitle="Global visual schedule matrix across all 9 karaoke suites (10:00 – 24:00)"
          />
        </div>

        {/* Date Selector & Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <DatePicker
            value={selectedDate}
            onChange={onDateChange}
            minDate={getBangkokTodayString()}
            placeholder="Select Schedule Date"
            label="Schedule Date:"
          />

          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-full border border-pink-200/80 bg-white/80 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-xs hover:bg-white hover:shadow-sm transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
            title="Refresh schedule"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <GlassCard className="p-4 bg-gradient-to-tr from-pink-50/60 to-purple-50/60">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Bookings</span>
          <div className="text-xl font-black text-purple-950 mt-1">{bookings.length} reservations</div>
        </GlassCard>

        <GlassCard className="p-4 bg-gradient-to-tr from-purple-50/60 to-sky-50/60">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Hours Reserved</span>
          <div className="text-xl font-black text-purple-950 mt-1">{totalReservedHours} hours</div>
        </GlassCard>

        <GlassCard className="col-span-2 sm:col-span-1 p-4 bg-gradient-to-tr from-sky-50/60 to-pink-50/60">
          <span className="text-[10px] uppercase font-bold text-slate-400">Operating Fleet</span>
          <div className="text-xl font-black text-purple-950 mt-1">9 Suites (10:00–24:00)</div>
        </GlassCard>
      </div>

      {/* Global Calendar Grid Matrix (F-06, AC-06, BR-08) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight">Global Schedule Matrix</h3>
            <span className="text-xs font-medium text-slate-500">• {selectedDate}</span>
          </div>

          {/* Schedule Legend */}
          <div className="flex items-center gap-3 text-xs bg-white/80 px-3 py-1.5 rounded-xl border border-pink-100 shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-100 border border-slate-300" />
              <span>No Confirmed Booking</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-purple-900 font-bold">
              <span className="h-2.5 w-2.5 rounded-sm bg-purple-500 border border-purple-600 shadow-xs" />
              <span>Confirmed Booking (Click to Inspect)</span>
            </span>
          </div>
        </div>

        {/* Matrix Card */}
        <GlassCard className="p-3 sm:p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <div className="h-9 w-9 animate-spin rounded-full border-3 border-purple-300 border-t-purple-600" />
              <p className="text-xs font-semibold">Loading global schedule matrix for {selectedDate}...</p>
            </div>
          ) : error ? (
            <div className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold">Unable to load master schedule</h4>
                <p className="text-xs mt-1 text-rose-600">{error}</p>
              </div>
              <button
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-200 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div
              ref={scrollContainerRef}
              className="w-full overflow-x-auto pb-2 overscroll-x-contain touch-pan-x"
            >
              <div className="min-w-[800px] lg:min-w-0">
                {/* Slot Header Row */}
                <div className="grid grid-cols-[70px_repeat(14,minmax(50px,1fr))] lg:grid-cols-[60px_repeat(14,minmax(0,1fr))] gap-1 sm:gap-1.5 pb-2.5 border-b border-pink-100 text-center text-[11px] font-semibold text-slate-500">
                  <div className="text-left pl-1 font-bold text-slate-700">Suite</div>
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <div key={idx} className="flex items-center justify-center py-0.5">
                      <span className="text-[11px] text-slate-700 font-bold">{10 + idx}:00</span>
                    </div>
                  ))}
                </div>

                {/* 9 Room Rows */}
                <div className="divide-y divide-pink-50/80 pt-1.5">
                  {ROOM_LIST.map((room) => {
                    const tier = TIER_THEME[room.type] || TIER_THEME.SMALL;

                    return (
                      <div
                        key={room.roomNumber}
                        className="grid grid-cols-[70px_repeat(14,minmax(50px,1fr))] lg:grid-cols-[60px_repeat(14,minmax(0,1fr))] gap-1 sm:gap-1.5 py-1.5 items-center"
                      >
                        {/* Room Code Badge */}
                        <div className="flex items-center gap-1.5 pl-1">
                          <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                            {room.roomNumber}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-extrabold border ${tier.bg} ${tier.text} ${tier.border}`}
                          >
                            {room.type[0]}
                          </span>
                        </div>

                        {/* 14 Hourly Slot Cells */}
                        {Array.from({ length: 14 }).map((_, slotIdx) => {
                          const occ = occupancyMap.get(`${room.roomNumber}_${slotIdx}`);
                          const isOccupied = Boolean(occ);

                          if (isOccupied && occ) {
                            const b = occ.booking;
                            const isFirst = occ.isFirstSlot;
                            const isLast = occ.isLastSlot;

                            return (
                              <button
                                key={slotIdx}
                                type="button"
                                onClick={() => onSelectBooking(b.id)}
                                title={`${b.bookingCode} • ${b.customerName} (${b.partySize} guests) • ${b.timeRange || ''} • Click to inspect details`}
                                className={`group relative flex h-9 items-center justify-center border text-[11px] font-extrabold transition-all cursor-pointer shadow-xs ${
                                  isFirst && isLast
                                    ? 'rounded-xl'
                                    : isFirst
                                    ? 'rounded-l-xl rounded-r-none border-r-0'
                                    : isLast
                                    ? 'rounded-r-xl rounded-l-none border-l-0'
                                    : 'rounded-none border-x-0'
                                } border-purple-300 bg-gradient-to-r from-purple-200/90 via-purple-100/90 to-pink-100/90 text-purple-950 hover:brightness-105 active:scale-95`}
                              >
                                {isFirst ? (
                                  <span className="truncate px-1 text-[10px] tracking-tight text-purple-900">
                                    {b.bookingCode.slice(-4)}
                                  </span>
                                ) : (
                                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 group-hover:scale-125 transition-transform" />
                                )}
                              </button>
                            );
                          }

                          // Empty / No Confirmed Booking Slot
                          return (
                            <div
                              key={slotIdx}
                              title={`${room.roomNumber} • ${10 + slotIdx}:00 – ${11 + slotIdx}:00: No confirmed booking recorded`}
                              className="flex h-9 items-center justify-center rounded-xl border border-slate-200/70 bg-slate-50/70 text-[11px] text-slate-400"
                            >
                              <span className="text-[10px] font-bold">—</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Suite Detail Summary List (Accuracy Guaranteed: 'No confirmed bookings') */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-extrabold text-slate-800 tracking-tight px-1">
          Confirmed Reservations Breakdown by Suite
        </h4>

        <div className="space-y-3">
          {ROOM_LIST.map((room) => {
            const roomBookings = bookingsByRoom.get(room.roomNumber) || [];
            const tierConfig = TIER_THEME[room.type] || TIER_THEME.SMALL;

            return (
              <GlassCard key={room.roomNumber} className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-pink-100/60 gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-black text-slate-800">{room.roomNumber}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold border ${tierConfig.bg} ${tierConfig.text} ${tierConfig.border}`}
                    >
                      {tierConfig.label} • max {room.capacity} pax
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-500">
                    {roomBookings.length === 0 ? (
                      <span className="text-slate-400 font-medium">No confirmed bookings</span>
                    ) : (
                      <span className="text-purple-700 font-bold">
                        {roomBookings.length} booking{roomBookings.length > 1 ? 's' : ''} confirmed
                      </span>
                    )}
                  </div>
                </div>

                {/* Bookings within this room */}
                <div className="pt-3">
                  {roomBookings.length === 0 ? (
                    <div className="py-2 text-center text-xs text-slate-400 italic">
                      No confirmed bookings recorded for {room.roomNumber} on this date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {roomBookings.map((b) => {
                        const timeDisplay =
                          b.timeRange ||
                          `${b.startSlot + 10}:00 - ${b.startSlot + b.durationHours + 10}:00`;

                        return (
                          <div
                            key={b.id}
                            className="flex flex-col justify-between rounded-2xl border border-purple-100/90 bg-white p-3.5 shadow-xs hover:border-purple-300 transition-all"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-extrabold text-purple-900">
                                  {b.bookingCode}
                                </span>
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                                  {b.status}
                                </span>
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                                  <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                  <span>{timeDisplay}</span>
                                  <span className="text-[10px] text-purple-600 font-semibold">
                                    ({b.durationHours}h)
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <User className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                  <span className="truncate">{b.customerName}</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-slate-600">
                                  <Users className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                                  <span>{b.partySize} guests</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onSelectBooking(b.id)}
                              className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-xl bg-purple-50 hover:bg-purple-100 py-1.5 text-xs font-bold text-purple-700 transition-colors cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Inspect Booking</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </div>
  );
};
