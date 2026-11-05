import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Calendar, AlertCircle } from 'lucide-react';
import { RoomAvailability } from '../../types/room';

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
  // Today's date string in YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);
  const isPastDate = selectedDate < todayStr;

  return (
    <div className="space-y-4">
      {/* Minimal Header Controls & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">14-Slot Availability Matrix</h3>
          <p className="text-xs text-slate-500">Server-calculated slot vacancy (10:00–24:00 daily)</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Status Legend */}
          <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span>Available</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span>Occupied</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shadow-sm" />
              <span>Closed (Past)</span>
            </span>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm">
            <Calendar className="h-4 w-4 text-pink-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Warning banner when inspecting a past date */}
      {isPastDate && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Past Date Selected:</strong> Dates prior to today cannot be reserved per business rule BR-04. All slots are marked as Closed.
          </span>
        </div>
      )}

      {/* Matrix Table */}
      <GlassCard className="overflow-x-auto p-4">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse font-medium">
            Calculating room and slot availability for {selectedDate}...
          </div>
        ) : availability.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 font-medium">
            No active rooms found.
          </div>
        ) : (
          <div className="min-w-[850px]">
            {/* Slot Header Row */}
            <div className="grid grid-cols-[70px_repeat(14,minmax(0,1fr))] gap-1.5 pb-3 border-b border-slate-200 text-center text-[11px] font-semibold text-slate-500">
              <div className="text-left pl-2 font-bold text-slate-700">Room</div>
              {Array.from({ length: 14 }).map((_, idx) => (
                <div key={idx} className="flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-mono">#{idx}</span>
                  <span className="text-[11px] text-slate-700 font-medium">{10 + idx}:00</span>
                </div>
              ))}
            </div>

            {/* Room Rows */}
            <div className="divide-y divide-slate-100 pt-2">
              {availability.map((room) => (
                <div key={room.id} className="grid grid-cols-[70px_repeat(14,minmax(0,1fr))] gap-1.5 py-2.5 items-center">
                  {/* Room Label */}
                  <div className="flex items-center gap-2 pl-2">
                    <span className="font-extrabold text-slate-900 text-sm">{room.roomNumber}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
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
                            : 'Open (Available for reservation)'
                        }`}
                        className={`group relative flex h-9 items-center justify-center rounded-lg border text-xs font-semibold transition-all ${
                          isClosed
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isOccupied
                            ? 'border-rose-200 bg-rose-50 text-rose-600 cursor-not-allowed'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 cursor-pointer shadow-sm'
                        }`}
                      >
                        {isClosed ? (
                          <span className="text-[10px] text-slate-400 font-medium">Closed</span>
                        ) : isOccupied ? (
                          <span className="text-[11px] font-medium text-rose-600">Busy</span>
                        ) : (
                          <span className="text-[11px] font-bold">Open</span>
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
