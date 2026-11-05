import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Calendar, AlertCircle } from 'lucide-react';
import { RoomAvailability } from '../../types/room';
import { isPastBangkokDate } from '../../utils/date';

interface AvailabilityMatrixProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  availability: RoomAvailability[];
  isLoading?: boolean;
}

export const AvailabilityMatrix: React.FC<AvailabilityMatrixProps> = ({
  selectedDate,
  onDateChange,
  availability,
  isLoading = false
}) => {
  // Check if selected date is in the past using Asia/Bangkok calendar
  const isPastDate = isPastBangkokDate(selectedDate);

  return (
    <div className="space-y-4">
      {/* Minimal Header Controls & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">14-Slot Availability Matrix</h3>
            <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-bold text-pink-600 border border-pink-200">
              10:00–24:00
            </span>
          </div>
          <p className="text-xs text-slate-500">Real-time slot vacancy calculated by server</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Legend (Pastel Cosmic Theme Palette) */}
          <div className="flex items-center gap-3 text-xs font-medium bg-white/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-pink-100 shadow-sm shadow-purple-100/30">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] border border-cyan-200" />
              <span className="text-slate-700 font-semibold">Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.7)] border border-pink-200" />
              <span className="text-slate-700 font-semibold">Occupied</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-300 shadow-[0_0_6px_rgba(192,132,252,0.6)] border border-purple-200" />
              <span className="text-slate-500">Closed (Past)</span>
            </span>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-pink-200 bg-white/90 px-3 py-1.5 text-xs text-slate-700 shadow-sm hover:border-pink-300 transition-colors">
            <Calendar className="h-4 w-4 text-pink-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            />
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

      {/* Matrix Table */}
      <GlassCard className="overflow-x-auto p-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-purple-400 animate-pulse font-medium">
            Calculating room and slot availability for {selectedDate}...
          </div>
        ) : availability.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No active rooms found.
          </div>
        ) : (
          <div className="min-w-[850px]">
            {/* Slot Header Row */}
            <div className="grid grid-cols-[70px_repeat(14,minmax(0,1fr))] gap-1.5 pb-3 border-b border-pink-100 text-center text-[11px] font-semibold text-slate-500">
              <div className="text-left pl-2 font-bold text-slate-700">Room</div>
              {Array.from({ length: 14 }).map((_, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-purple-400 font-mono">#{idx}</span>
                  <span className="text-[11px] text-slate-700 font-semibold">{10 + idx}:00</span>
                </div>
              ))}
            </div>

            {/* Room Rows */}
            <div className="divide-y divide-pink-50 pt-2">
              {availability.map((room) => (
                <div key={room.id} className="grid grid-cols-[70px_repeat(14,minmax(0,1fr))] gap-1.5 py-2.5 items-center">
                  {/* Room Label */}
                  <div className="flex items-center gap-2 pl-2">
                    <span className="font-extrabold text-slate-900 text-sm">{room.roomNumber}</span>
                    <span className="text-[10px] text-pink-400 uppercase tracking-wider font-mono font-bold">
                      {room.type[0]}
                    </span>
                  </div>

                  {/* 14 Slots */}
                  {room.slots.map((slot) => {
                    const isClosed = slot.isPast ?? isPastDate;
                    const isOccupied = slot.isOccupied ?? (!slot.isAvailable && !isClosed);

                    return (
                      <div
                        key={slot.slotIndex}
                        title={`${room.roomNumber} • Slot ${slot.slotIndex} (${slot.timeRange}): ${
                          isClosed
                            ? 'Closed (Time has elapsed / past)'
                            : isOccupied
                            ? 'Occupied / Booked'
                            : 'Open (Available • Booking engine activates in Issue #4)'
                        }`}
                        className={`group relative flex h-9 items-center justify-center rounded-xl border text-xs font-semibold transition-all ${
                          isClosed
                            ? 'border-purple-100/80 bg-purple-50/40 text-purple-400/80 cursor-not-allowed'
                            : isOccupied
                            ? 'border-pink-200 bg-pink-50/90 text-pink-700 cursor-not-allowed shadow-sm shadow-pink-100/30'
                            : 'border-cyan-200/90 bg-cyan-50/80 text-cyan-800 hover:bg-cyan-100/80 hover:border-cyan-300 shadow-xs cursor-default'
                        }`}
                      >
                        {isClosed ? (
                          <span className="text-[10px] text-purple-400/80 font-medium">Closed</span>
                        ) : isOccupied ? (
                          <span className="text-[11px] font-semibold text-pink-700">Busy</span>
                        ) : (
                          <span className="text-[11px] font-bold text-cyan-800">Open</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
