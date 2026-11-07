import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Users, User, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { PageHeader } from '../layout/PageHeader';
import { DatePicker } from '../common/DatePicker';

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
];

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

  const fetchMasterSchedule = async () => {
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
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setError(data.error?.message || 'Failed to fetch master schedule.');
      }
    } catch (err) {
      setError('Network connection error while fetching master schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterSchedule();
  }, [token, selectedDate]);

  // Group bookings by roomNumber for fast lookups
  const bookingsByRoom = React.useMemo(() => {
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

  const totalReservedHours = React.useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.durationHours, 0);
  }, [bookings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header with Staff Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 border border-sky-200 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            Staff Cashier Console
          </div>
          <PageHeader
            title="Master Schedule"
            subtitle="Real-time occupancy and reservation overview across all 9 karaoke suites"
          />
        </div>

        {/* Date Selector & Action Controls */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <DatePicker
            value={selectedDate}
            onChange={onDateChange}
            minDate={new Date().toISOString().split('T')[0]}
            placeholder="Select Schedule Date"
            label="Schedule Date:"
          />

          <button
            onClick={fetchMasterSchedule}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-full border border-pink-200/80 bg-white/80 px-3.5 py-2 text-xs font-bold text-purple-700 shadow-xs hover:bg-white hover:shadow-sm transition-all focus:outline-none disabled:opacity-50"
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

      {/* Main Schedule Container */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
          <div className="h-9 w-9 animate-spin rounded-full border-3 border-purple-300 border-t-purple-600" />
          <p className="text-xs font-semibold">Loading master schedule for {selectedDate}...</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Unable to load master schedule</h4>
            <p className="text-xs mt-1 text-rose-600">{error}</p>
          </div>
          <button
            onClick={fetchMasterSchedule}
            className="rounded-lg bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 hover:bg-rose-200 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Suite by Suite Schedule Cards */
        <div className="space-y-4">
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
                      <span className="text-emerald-600 font-bold">All 14 slots open</span>
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
                    <div className="py-3 text-center text-xs text-slate-400 italic">
                      No reservations booked for {room.roomNumber} on this date.
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

                              <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
                                <Clock className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                <span>{timeDisplay}</span>
                                <span className="text-[10px] text-purple-600">({b.durationHours}h)</span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
                                <div className="flex items-center gap-1.5 truncate">
                                  <User className="h-3 w-3 text-purple-400 shrink-0" />
                                  <span className="truncate font-medium">{b.customerName}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-semibold shrink-0">
                                  <Users className="h-3 w-3 text-pink-400" />
                                  <span>{b.partySize}p</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => onSelectBooking(b.id)}
                              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-50 py-1.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition-colors"
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
      )}
    </div>
  );
};
