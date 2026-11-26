import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShieldCheck,
  Clock,
  Users,
  User,
  AlertCircle,
  RefreshCw,
  Eye,
  Search,
  UserPlus,
  Wrench,
  CalendarRange,
  RotateCcw,
  Phone,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { PageHeader } from '../layout/PageHeader';
import { DatePicker } from '../common/DatePicker';
import { StaffWalkInPanel } from './StaffWalkInPanel';
import { StaffRoomBlockPanel } from './StaffRoomBlockPanel';
import { Room } from '../../types/room';
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
  totalPrice?: number;
  customerName: string;
  customerPhone?: string | null;
  channel: string;
  status: 'CONFIRMED' | 'CANCELLED';
  room: {
    id: string;
    roomNumber: string;
    type: 'SMALL' | 'MEDIUM' | 'LARGE';
    capacity: number;
    hourlyRate?: number;
    description?: string | null;
  };
  slots: Array<{ id?: string; slotIndex: number }>;
}

interface StaffMasterScheduleViewProps {
  token: string | null;
  rooms?: Room[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onSelectBooking: (bookingId: string) => void;
  onDataChanged?: () => void;
  externalRefreshTrigger?: number;
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
  rooms = [],
  selectedDate,
  onDateChange,
  onSelectBooking,
  onDataChanged,
  externalRefreshTrigger = 0
}) => {
  const [staffTab, setStaffTab] = useState<'schedule' | 'walk-in' | 'blocks'>('schedule');
  const [bookings, setBookings] = useState<MasterBooking[]>([]);
  const [roomBlocks, setRoomBlocks] = useState<
    Array<{ id: string; roomNumber: string; slotIndex: number; reason?: string | null }>
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sprint 2 F-10 Multi-Criteria Search & Filter state
  const [useDateRange, setUseDateRange] = useState<boolean>(false);
  const [startDateFilter, setStartDateFilter] = useState<string>(selectedDate);
  const [endDateFilter, setEndDateFilter] = useState<string>(selectedDate);
  const [phoneFilter, setPhoneFilter] = useState<string>('');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

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

      if (!useDateRange && !selectedDate) {
        setError('Please select a valid date.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (useDateRange) {
          if (startDateFilter) params.set('startDate', startDateFilter);
          if (endDateFilter) params.set('endDate', endDateFilter);
        }
        if (phoneFilter.trim()) params.set('phone', phoneFilter.trim());
        if (roomTypeFilter) params.set('roomType', roomTypeFilter);
        if (statusFilter) params.set('status', statusFilter);

        const querySuffix = params.toString();
        const url = useDateRange
          ? `/api/bookings/master${querySuffix ? `?${querySuffix}` : ''}`
          : `/api/bookings/master?date=${selectedDate}${querySuffix ? `&${querySuffix}` : ''}`;

        const res = await fetch(url, {
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

        // Also fetch active maintenance blocks for single-date schedule matrix visibility (F-09)
        if (!useDateRange && selectedDate) {
          const blkRes = await fetch(`/api/room-blocks?date=${selectedDate}`, {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          if (blkRes.ok) {
            const blkData = await blkRes.json();
            if (isCurrent && blkData.success && Array.isArray(blkData.blocks)) {
              setRoomBlocks(blkData.blocks);
            }
          }
        } else if (isCurrent) {
          setRoomBlocks([]);
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
  }, [
    token,
    selectedDate,
    useDateRange,
    startDateFilter,
    endDateFilter,
    phoneFilter,
    roomTypeFilter,
    statusFilter,
    refreshTrigger,
    externalRefreshTrigger
  ]);

  const handleResetFilters = () => {
    setUseDateRange(false);
    setStartDateFilter(selectedDate);
    setEndDateFilter(selectedDate);
    setPhoneFilter('');
    setRoomTypeFilter('');
    setStatusFilter('');
  };

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

  // Pre-index maintenance blocks by roomNumber and slotIndex for Global Schedule Matrix
  const blockMap = useMemo(() => {
    const map = new Map<string, { id: string; roomNumber: string; slotIndex: number; reason?: string | null }>();
    for (const blk of roomBlocks) {
      map.set(`${blk.roomNumber}_${blk.slotIndex}`, blk);
    }
    return map;
  }, [roomBlocks]);

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

  const hasActiveFilter = Boolean(
    useDateRange || phoneFilter.trim() || roomTypeFilter || statusFilter
  );

  // When search/filter is active, trim unrelated rooms from matrix and breakdown
  const visibleRooms = useMemo(() => {
    if (!hasActiveFilter) {
      return [...ROOM_LIST];
    }
    const matchedRoomNumbers = new Set(bookings.map((b) => b.room.roomNumber));
    const hasBookingSpecificFilter = Boolean(
      phoneFilter.trim() || statusFilter || useDateRange
    );

    return ROOM_LIST.filter((room) => {
      if (roomTypeFilter && room.type !== roomTypeFilter) {
        return false;
      }
      if (hasBookingSpecificFilter) {
        return matchedRoomNumbers.has(room.roomNumber);
      }
      return true;
    });
  }, [hasActiveFilter, bookings, roomTypeFilter, phoneFilter, statusFilter, useDateRange]);

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

      {/* Staff Operations Tab Switcher (F-06/F-10 Schedule & Search, F-07 Walk-in, F-09 RoomBlock) */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl bg-white/85 p-1 border border-pink-100/90 shadow-xs backdrop-blur-md">
        <button
          type="button"
          onClick={() => setStaffTab('schedule')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            staffTab === 'schedule'
              ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 text-purple-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>Schedule & Search</span>
        </button>
        <button
          type="button"
          onClick={() => setStaffTab('walk-in')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            staffTab === 'walk-in'
              ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 text-purple-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Walk-in Counter</span>
        </button>
        <button
          type="button"
          onClick={() => setStaffTab('blocks')}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
            staffTab === 'blocks'
              ? 'bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 text-purple-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Maintenance Blocks</span>
        </button>
      </div>

      {/* F-07 Walk-in Counter Tab */}
      {staffTab === 'walk-in' && (
        <StaffWalkInPanel
          token={token}
          rooms={rooms}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          onWalkInCreated={() => {
            setRefreshTrigger((prev) => prev + 1);
            onDataChanged?.();
          }}
        />
      )}

      {/* F-09 Room Maintenance Blockout Tab */}
      {staffTab === 'blocks' && (
        <StaffRoomBlockPanel
          token={token}
          rooms={rooms}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          onBlocksChanged={() => {
            setRefreshTrigger((prev) => prev + 1);
            onDataChanged?.();
          }}
        />
      )}

      {/* F-06 & F-10 Master Schedule & Multi-Criteria Search Tab */}
      {staffTab === 'schedule' && (
      <>
      {/* F-10 Search & Multi-Criteria Filter Bar */}
      <GlassCard className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
            <Search className="h-4 w-4 text-purple-600" />
            <span>Multi-Criteria Booking Search &amp; Filter</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUseDateRange((prev) => !prev);
                setStartDateFilter(selectedDate);
                setEndDateFilter(selectedDate);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors cursor-pointer ${
                useDateRange
                  ? 'bg-purple-100 border-purple-300 text-purple-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-purple-200'
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>{useDateRange ? 'Date Range Active' : 'Switch to Date Range'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Phone Search */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Customer Phone
            </label>
            <div className="relative">
              <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search phone..."
                value={phoneFilter}
                onChange={(e) => setPhoneFilter(e.target.value)}
                className="h-11 w-full rounded-xl border border-pink-200/90 bg-white pl-10 pr-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-2xs focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Room Tier Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Room Tier
            </label>
            <div className="relative">
              <select
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-pink-200/90 bg-white pl-3.5 pr-9 text-sm font-bold text-slate-800 shadow-2xs focus:border-purple-400 focus:outline-none cursor-pointer"
              >
                <option value="">All Tiers</option>
                <option value="SMALL">Small (4 pax)</option>
                <option value="MEDIUM">Medium (8 pax)</option>
                <option value="LARGE">Large (12 pax)</option>
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Booking Status
            </label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-pink-200/90 bg-white pl-3.5 pr-9 text-sm font-bold text-slate-800 shadow-2xs focus:border-purple-400 focus:outline-none cursor-pointer"
              >
                <option value="">Default (Confirmed / All Filtered)</option>
                <option value="CONFIRMED">Confirmed Only</option>
                <option value="CANCELLED">Cancelled Only</option>
              </select>
              <ChevronDown className="pointer-events-none h-4 w-4 text-slate-400 absolute right-3 top-3.5" />
            </div>
          </div>

          {/* Date Range Pickers or Active Summary */}
          {useDateRange ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-pink-200/90 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-2xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="h-11 w-full rounded-xl border border-pink-200/90 bg-white px-2.5 text-xs font-bold text-slate-800 shadow-2xs"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Active Scope
              </label>
              <div className="h-11 flex items-center justify-center rounded-xl bg-purple-50/90 border border-purple-200/80 px-3.5 text-sm font-semibold text-purple-900">
                <span>
                  {selectedDate}{' '}
                  <span className="font-extrabold">
                    ({bookings.length} {bookings.length === 1 ? 'match' : 'matches'})
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Overview Stat Cards (Distinct Light-Yellow Pastel Contrast) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-4 sm:p-5 bg-amber-50/95 border-amber-200/90 shadow-sm">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-800/80">
            Total Bookings
          </span>
          <div className="text-xl font-black text-purple-950 mt-1">
            {bookings.length} {bookings.length === 1 ? 'reservation' : 'reservations'}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 bg-amber-50/95 border-amber-200/90 shadow-sm">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-800/80">
            Total Hours Reserved
          </span>
          <div className="text-xl font-black text-purple-950 mt-1">
            {totalReservedHours} {totalReservedHours === 1 ? 'hour' : 'hours'}
          </div>
        </GlassCard>

        <GlassCard className="p-4 sm:p-5 bg-amber-50/95 border-amber-200/90 shadow-sm">
          <span className="text-xs uppercase font-bold tracking-wider text-amber-800/80">
            {hasActiveFilter ? 'Matching Suites' : 'Operating Fleet'}
          </span>
          <div className="text-xl font-black text-purple-950 mt-1">
            {hasActiveFilter
              ? `${visibleRooms.length} of 9 Suites`
              : '9 Suites (10:00–24:00)'}
          </div>
        </GlassCard>
      </div>

      {/* Global Calendar Grid Matrix (Single-Date mode; filtered to relevant suites when searching) */}
      {!useDateRange && (
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {hasActiveFilter ? 'Filtered Schedule Matrix' : 'Global Schedule Matrix'}
            </h3>
            <span className="text-xs font-medium text-slate-500">• {selectedDate}</span>
          </div>

          {/* Schedule Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-white/80 px-3 py-1.5 rounded-xl border border-pink-100 shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-500">
              <span className="h-2.5 w-2.5 rounded-sm bg-slate-100 border border-slate-300" />
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-purple-900">
              <span className="h-2.5 w-2.5 rounded-sm bg-purple-500 border border-purple-600 shadow-xs" />
              <span>Confirmed Booking</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-800">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-200 border border-amber-400 shadow-xs" />
              <span>Maintenance Block</span>
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
          ) : visibleRooms.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm font-bold text-slate-500">
                No matching suites or reservations found for the current filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-4 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-200 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
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

                {/* Visible Room Rows */}
                <div className="divide-y divide-pink-50/80 pt-1.5">
                  {visibleRooms.map((room) => {
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

                          const blk = blockMap.get(`${room.roomNumber}_${slotIdx}`);
                          if (blk) {
                            return (
                              <button
                                key={slotIdx}
                                type="button"
                                onClick={() => setStaffTab('blocks')}
                                title={`${room.roomNumber} • ${10 + slotIdx}:00 – ${11 + slotIdx}:00 • Maintenance Block: ${blk.reason || 'Maintenance block'} (Click to manage)`}
                                className="flex h-9 items-center justify-center rounded-xl border border-amber-300 bg-amber-100/90 text-amber-800 hover:bg-amber-200/80 transition-all cursor-pointer shadow-2xs"
                              >
                                <Wrench className="h-3.5 w-3.5" />
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
      )}

      {/* Suite Detail Summary List (Filtered to matching suites when searching) */}
      <div className="space-y-3 pt-2">
        <h4 className="text-sm font-extrabold text-slate-800 tracking-tight px-1">
          {hasActiveFilter
            ? `Matching Reservations (${bookings.length})`
            : 'Confirmed Reservations Breakdown by Suite'}
        </h4>

        {visibleRooms.length === 0 ? (
          <GlassCard className="p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-500">
              No reservations match your active search filters.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-4 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Show All Suites</span>
            </button>
          </GlassCard>
        ) : (
        <div className="space-y-3">
          {visibleRooms.map((room) => {
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
                        {roomBookings.length} booking{roomBookings.length > 1 ? 's' : ''} matched
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
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="font-mono text-xs font-extrabold text-purple-900">
                                  {b.bookingCode}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                                      b.channel === 'WALK_IN'
                                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                                        : 'bg-purple-50 text-purple-700 border-purple-200'
                                    }`}
                                  >
                                    {b.channel}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                                      b.status === 'CONFIRMED'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border-slate-200'
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-1 text-xs">
                                {useDateRange && (
                                  <div className="flex items-center gap-1.5 text-purple-800 font-bold">
                                    <Calendar className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                    <span>{b.bookingDate}</span>
                                  </div>
                                )}

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

                                {b.customerPhone && (
                                  <div className="flex items-center gap-1.5 text-slate-600">
                                    <Phone className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                    <span className="truncate font-mono text-[11px]">{b.customerPhone}</span>
                                  </div>
                                )}

                                <div className="flex items-center justify-between text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                                    <span>{b.partySize} guests</span>
                                  </div>
                                  {typeof b.totalPrice === 'number' && (
                                    <span className="rounded-full bg-gradient-to-r from-cyan-100/90 via-sky-50 to-yellow-100/90 px-2 py-0.5 text-[10px] font-extrabold text-sky-900 border border-cyan-200/80">
                                      ฿{b.totalPrice.toLocaleString()}
                                    </span>
                                  )}
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
        )}
      </div>
      </>
      )}
    </div>
  );
};
