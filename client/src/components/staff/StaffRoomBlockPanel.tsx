import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wrench,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
  ChevronDown,
  X
} from 'lucide-react';
import { GlassCard } from '../layout/GlassCard';
import { DatePicker } from '../common/DatePicker';
import { Room, RoomAvailability, AvailabilityResponse } from '../../types/room';
import { getBangkokTodayString } from '../../utils/date';

interface RoomBlockItem {
  id: string;
  roomId: string;
  roomNumber: string;
  roomType?: string;
  blockDate: string;
  slotIndex: number;
  reason?: string | null;
}

interface StaffRoomBlockPanelProps {
  token: string | null;
  rooms: Room[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onBlocksChanged: () => void;
}

export const StaffRoomBlockPanel: React.FC<StaffRoomBlockPanelProps> = ({
  token,
  rooms,
  selectedDate,
  onDateChange,
  onBlocksChanged
}) => {
  const [roomId, setRoomId] = useState<string>(rooms[0]?.id || '');
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [reason, setReason] = useState<string>('');
  const [blocks, setBlocks] = useState<RoomBlockItem[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const activeRoomId = roomId || rooms[0]?.id || '';

  const fetchBlocksAndAvailability = useCallback(async () => {
    if (!token || !selectedDate) return;
    setIsLoading(true);
    try {
      const [blocksRes, availRes] = await Promise.all([
        fetch(`/api/room-blocks?date=${selectedDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/availability?date=${selectedDate}`)
      ]);

      const blocksData = await blocksRes.json();
      if (blocksRes.ok && blocksData.success && Array.isArray(blocksData.blocks)) {
        setBlocks(blocksData.blocks);
      } else {
        setError(blocksData.error?.message || 'Failed to fetch maintenance blocks.');
      }

      if (availRes.ok) {
        const availData: AvailabilityResponse = await availRes.json();
        if (availData.success && Array.isArray(availData.rooms)) {
          setAvailability(availData.rooms);
        }
      }
    } catch {
      setError('Network error while loading maintenance blocks.');
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedDate]);

  useEffect(() => {
    fetchBlocksAndAvailability();
  }, [fetchBlocksAndAvailability]);

  // Reset selected slots whenever room or date changes to avoid stale slot selections
  useEffect(() => {
    setSelectedSlots([]);
  }, [activeRoomId, selectedDate]);

  // Compute slot states for the currently selected room on selectedDate
  const slotStatusByIndex = useMemo(() => {
    const blockedSet = new Set(
      blocks.filter((b) => b.roomId === activeRoomId).map((b) => b.slotIndex)
    );
    const roomAvail = availability.find((r) => r.id === activeRoomId);
    const map = new Map<number, 'open' | 'past' | 'booked' | 'blocked'>();

    for (let idx = 0; idx < 14; idx++) {
      const slotInfo = roomAvail?.slots.find((s) => s.slotIndex === idx);
      const isBlocked = blockedSet.has(idx);
      const isPast = Boolean(slotInfo?.isPast);
      const isBooked = Boolean(slotInfo?.isOccupied) && !isBlocked;

      if (isBooked) {
        map.set(idx, 'booked');
      } else if (isBlocked) {
        map.set(idx, 'blocked');
      } else if (isPast) {
        map.set(idx, 'past');
      } else {
        map.set(idx, 'open');
      }
    }
    return map;
  }, [availability, blocks, activeRoomId]);

  const toggleSlot = (slotIdx: number) => {
    const state = slotStatusByIndex.get(slotIdx) || 'open';
    if (state !== 'open') return;
    setSelectedSlots((prev) =>
      prev.includes(slotIdx)
        ? prev.filter((s) => s !== slotIdx)
        : [...prev, slotIdx].sort((a, b) => a - b)
    );
  };

  const handleCreateBlocks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeRoomId) return;
    if (selectedSlots.length === 0) {
      setError('Please select at least one open hourly slot to block.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/room-blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: activeRoomId,
          blockDate: selectedDate,
          slotIndices: selectedSlots,
          reason: reason.trim() || 'Maintenance block'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const msg = `Blocked ${selectedSlots.length} slot(s) on ${selectedDate} successfully.`;
        setSuccessMsg(msg);
        setSelectedSlots([]);
        setReason('');
        await fetchBlocksAndAvailability();
        onBlocksChanged();
      } else {
        setError(data.error?.message || 'Unable to create maintenance block.');
      }
    } catch {
      setError('Network error while creating maintenance block.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!token) return;
    setDeletingId(blockId);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/room-blocks/${blockId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const msg = 'Maintenance block removed and slot restored to availability.';
        setSuccessMsg(msg);
        await fetchBlocksAndAvailability();
        onBlocksChanged();
      } else {
        setError(data.error?.message || 'Failed to delete maintenance block.');
      }
    } catch {
      setError('Network error while deleting maintenance block.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Maintenance Block Card */}
      <GlassCard className="p-6 sm:p-7 space-y-6">
        <div className="flex items-center justify-between gap-2 pb-4 border-b border-pink-100/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 via-pink-100 to-purple-100 text-amber-800 border border-amber-200/70 shrink-0">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Room Maintenance &amp; Blockout</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Block open slots for maintenance (BR-10 automatically protects confirmed bookings)
              </p>
            </div>
          </div>
        </div>

        {/* Clean non-overlapping alerts with dismiss button */}
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

        {successMsg && (
          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-sm text-emerald-900 shadow-2xs">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <span className="flex-1 font-semibold">{successMsg}</span>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="text-emerald-500 hover:text-emerald-800 cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleCreateBlocks} className="space-y-5">
          {/* Evenly aligned 3-column controls (all h-11, w-full, text-sm) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Target Suite
              </label>
              <div className="relative">
                <select
                  value={activeRoomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border border-pink-200/90 bg-white pl-3.5 pr-9 text-sm font-bold text-slate-800 shadow-2xs focus:border-purple-400 focus:outline-none cursor-pointer"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} ({r.type})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none h-4 w-4 text-slate-400 absolute right-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Block Date
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

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Speaker calibration"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-11 w-full rounded-xl border border-pink-200/90 bg-white px-3.5 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal shadow-2xs focus:border-purple-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Slot Picker + Color Legend */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Select Hourly Slots to Block ({selectedSlots.length} selected)
              </label>

              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
                  Open
                </span>
                <span className="inline-flex items-center gap-1.5 text-amber-800">
                  <span className="h-3 w-3 rounded border border-amber-400 bg-amber-100" />
                  Selected / Blocked
                </span>
                <span className="inline-flex items-center gap-1.5 text-rose-700">
                  <span className="h-3 w-3 rounded border border-rose-300 bg-rose-100" />
                  Booked
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-400">
                  <span className="h-3 w-3 rounded border border-slate-300 bg-slate-200" />
                  Past
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {Array.from({ length: 14 }, (_, idx) => {
                const state = slotStatusByIndex.get(idx) || 'open';
                const isSelected = selectedSlots.includes(idx);
                const disabled = state !== 'open';

                let btnClasses =
                  'bg-white border-slate-200 text-slate-700 hover:border-purple-400 hover:bg-purple-50/40 cursor-pointer';
                let subLabel = 'Open';

                if (state === 'past') {
                  btnClasses =
                    'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-85';
                  subLabel = 'Past';
                } else if (state === 'booked') {
                  btnClasses =
                    'bg-rose-50 border-rose-300 text-rose-700 cursor-not-allowed';
                  subLabel = 'Booked';
                } else if (state === 'blocked') {
                  btnClasses =
                    'bg-amber-100/90 border-amber-300 text-amber-900 cursor-not-allowed';
                  subLabel = 'Blocked';
                } else if (isSelected) {
                  btnClasses =
                    'bg-amber-200/90 border-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-300/60 cursor-pointer';
                  subLabel = 'Selected';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleSlot(idx)}
                    className={`flex flex-col items-center justify-center rounded-xl h-14 px-2 border transition-all ${btnClasses}`}
                  >
                    <span className={`text-sm font-extrabold ${state === 'past' ? 'line-through' : ''}`}>
                      {10 + idx}:00
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                      {subLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting || selectedSlots.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-200 via-pink-200 to-purple-200 px-6 py-3 text-sm font-black text-purple-950 shadow-sm hover:brightness-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Lock className="h-4 w-4" />
              <span>{isSubmitting ? 'Blocking...' : 'Create Maintenance Block'}</span>
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Active Blocks List */}
      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-black text-slate-900">
              Active Blocks for {selectedDate}
            </h4>
            <p className="text-xs sm:text-sm text-slate-500">{blocks.length} slot(s) currently blocked</p>
          </div>
          <button
            type="button"
            onClick={fetchBlocksAndAvailability}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-full border border-pink-200 bg-white px-3.5 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {blocks.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400 italic">
            No maintenance blocks scheduled for {selectedDate}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {blocks.map((blk) => (
              <div
                key={blk.id}
                className="flex items-center justify-between rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-800">{blk.roomNumber}</span>
                    <span className="rounded-md bg-white px-2.5 py-0.5 text-xs font-mono font-bold text-amber-900 border border-amber-200">
                      {String(10 + blk.slotIndex).padStart(2, '0')}:00 – {String(11 + blk.slotIndex).padStart(2, '0')}:00
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 truncate font-medium">
                    {blk.reason || 'Maintenance block'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteBlock(blk.id)}
                  disabled={deletingId === blk.id}
                  className="ml-2 rounded-xl bg-rose-50 hover:bg-rose-100 p-2.5 text-rose-600 border border-rose-200 transition-colors cursor-pointer disabled:opacity-50"
                  title="Remove block"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
