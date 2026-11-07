import React, { useRef, useEffect } from 'react';
import { GlassCard } from '../layout/GlassCard';
import { AlertCircle } from 'lucide-react';
import { RoomAvailability } from '../../types/room';
import { isPastBangkokDate } from '../../utils/date';

interface AvailabilityMatrixProps {
  selectedDate: string;
  onDateChange?: (date: string) => void;
  availability: RoomAvailability[];
  isLoading?: boolean;
  error?: string | null;
  onSelectSlot?: (roomId: string, slotIndex: number) => void;
}

export const AvailabilityMatrix: React.FC<AvailabilityMatrixProps> = ({
  selectedDate,
  availability,
  isLoading = false,
  error = null,
  onSelectSlot
}) => {
  // Check if selected date is in the past using Asia/Bangkok calendar
  const isPastDate = isPastBangkokDate(selectedDate);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Enable direct two-finger trackpad horizontal scrolling while preventing window overscroll bounce
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If user swipes horizontally on trackpad or shift+scroll
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0) {
        el.scrollLeft += e.deltaX;
        e.preventDefault();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="space-y-4">
      {/* Minimal Header Controls & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Live Room Schedule</h3>
            <span className="rounded-full bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-950 border border-pink-200/60 shadow-2xs">
              Open 10:00 – 24:00
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Real-time Availability Matrix • Select any open slot to reserve your suite instantly
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Legend (Aligned with In-Scope Green / Red / Gray in Pastel Palette) */}
          <div className="flex items-center gap-3.5 text-xs font-medium bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-pink-100/80 shadow-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] border border-emerald-200" />
              <span className="text-slate-700 font-semibold">Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)] border border-rose-200" />
              <span className="text-slate-700 font-semibold">Occupied</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 shadow-[0_0_6px_rgba(148,163,184,0.5)] border border-slate-200" />
              <span className="text-slate-500">Closed (Past)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Warning banner when inspecting a past date */}
      {isPastDate && (
        <div className="flex items-center gap-2.5 rounded-xl border border-purple-200 bg-purple-50/80 px-4 py-2.5 text-xs text-purple-900 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-purple-600" />
          <span>
            <strong>Past Date Selected:</strong> Dates prior to today cannot be reserved per business rule BR-04. All slots are marked as Closed.
          </span>
        </div>
      )}

      {/* Error State Banner */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>
            <strong>Error Loading Availability:</strong> {error}
          </span>
        </div>
      )}

      {/* Mobile Swipe Guidance Banner */}
      <div className="flex lg:hidden items-center justify-between text-[11px] font-semibold text-slate-500 px-1 bg-white/70 py-1.5 rounded-xl border border-pink-100/70">
        <span>14 Slots (10:00 – 24:00)</span>
        <span className="flex items-center gap-1 text-purple-700 font-bold">
          <span>Swipe to explore hours</span>
          <span>→</span>
        </span>
      </div>

      {/* Matrix Table */}
      <GlassCard className="p-3 sm:p-5 min-h-[380px] flex flex-col justify-center">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-purple-400 animate-pulse font-medium">
            Calculating room and slot availability for {selectedDate}...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-rose-600 font-medium">
            {error}
          </div>
        ) : availability.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No active rooms found.
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className="w-full overflow-x-auto pb-2 overscroll-x-contain touch-pan-x"
          >
            <div className="min-w-[760px] lg:min-w-0">
              {/* Slot Header Row */}
              <div className="grid grid-cols-[64px_repeat(14,minmax(50px,1fr))] lg:grid-cols-[55px_repeat(14,minmax(0,1fr))] gap-1 sm:gap-1.5 pb-2.5 border-b border-pink-100 text-center text-[11px] font-semibold text-slate-500">
                <div className="text-left pl-1 font-bold text-slate-700">Room</div>
                {Array.from({ length: 14 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-center py-0.5">
                    <span className="text-[11px] text-slate-700 font-bold">{10 + idx}:00</span>
                  </div>
                ))}
              </div>

              {/* Room Rows */}
              <div className="divide-y divide-pink-50 pt-1.5">
                {availability.map((room) => (
                  <div key={room.id} className="grid grid-cols-[64px_repeat(14,minmax(50px,1fr))] lg:grid-cols-[55px_repeat(14,minmax(0,1fr))] gap-1 sm:gap-1.5 py-2 items-center">
                    {/* Room Label */}
                    <div className="flex items-center gap-1.5 pl-1">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">{room.roomNumber}</span>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-mono font-bold ${
                          room.type === 'SMALL'
                            ? 'text-sky-500'
                            : room.type === 'MEDIUM'
                            ? 'text-purple-500'
                            : 'text-amber-600'
                        }`}
                      >
                        {room.type[0]}
                      </span>
                    </div>

                    {/* 14 Slots */}
                  {room.slots.map((slot) => {
                    const isClosed = slot.isPast ?? isPastDate;
                    const isOccupied = slot.isOccupied ?? (!slot.isAvailable && !isClosed);
                    const isOpen = !isClosed && !isOccupied;

                    return (
                      <div
                        key={slot.slotIndex}
                        onClick={() => {
                          if (isOpen && onSelectSlot) {
                            onSelectSlot(room.id, slot.slotIndex);
                          }
                        }}
                        title={`${room.roomNumber} • Slot ${slot.slotIndex} (${slot.timeRange}): ${
                          isClosed
                            ? 'Closed (Time has elapsed / past)'
                            : isOccupied
                            ? 'Occupied / Booked'
                            : 'Open (Click to book this slot)'
                        }`}
                        className={`group relative flex h-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                          isClosed
                            ? 'border-slate-200/80 bg-slate-100/70 text-slate-400 cursor-not-allowed'
                            : isOccupied
                            ? 'border-rose-200 bg-rose-50/90 text-rose-700 cursor-not-allowed shadow-xs'
                            : 'border-emerald-200/90 bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/90 hover:border-emerald-400 shadow-xs cursor-pointer active:scale-95'
                        }`}
                      >
                        {isClosed ? (
                          <span className="text-[10px] text-slate-400 font-medium">Closed</span>
                        ) : isOccupied ? (
                          <span className="text-[11px] font-semibold text-rose-700">Busy</span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800">Open</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </GlassCard>
    </div>
  );
};
