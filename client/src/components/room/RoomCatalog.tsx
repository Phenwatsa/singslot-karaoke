import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Users, Mic2, Sparkles } from 'lucide-react';
import { Room, RoomType } from '../../types/room';

interface RoomCatalogProps {
  rooms: Room[];
  isLoading?: boolean;
  onBookRoom?: (roomId: string) => void;
}

const TIER_CONFIG: Array<{
  type: RoomType;
  title: string;
  capacityText: string;
  badgeStyle: string;
  tagColor: string;
}> = [
  {
    type: 'SMALL',
    title: 'Small Rooms',
    capacityText: '4 Pax Capacity',
    badgeStyle: 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs',
    tagColor: 'text-sky-700'
  },
  {
    type: 'MEDIUM',
    title: 'Medium Rooms',
    capacityText: '8 Pax Capacity',
    badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200/80 shadow-2xs',
    tagColor: 'text-purple-700'
  },
  {
    type: 'LARGE',
    title: 'Large Rooms',
    capacityText: '12 Pax Capacity',
    badgeStyle: 'bg-amber-50/80 text-amber-800 border-amber-200/80 shadow-2xs',
    tagColor: 'text-amber-700'
  }
];

export const RoomCatalog: React.FC<RoomCatalogProps> = ({ rooms, isLoading = false, onBookRoom }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((tierIdx) => (
          <div key={tierIdx} className="space-y-3">
            <div className="h-6 w-48 rounded-lg bg-pink-100/60 animate-pulse" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <GlassCard key={n} className="animate-pulse py-8 text-center text-purple-400 font-medium">
                  Loading room fleet...
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Catalog Overall Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-100/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Private Karaoke Suites</h3>
            <span className="rounded-full bg-gradient-to-r from-pink-100 via-purple-100 to-sky-100 px-3 py-0.5 text-[10px] font-extrabold text-purple-950 border border-pink-200/60 shadow-2xs">
              Room Fleet Catalog
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Soundproof luxury suites equipped with studio audio, wireless mics, and ambient mood lighting
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-slate-600 bg-white/90 px-3.5 py-1.5 rounded-full border border-pink-200/70 shadow-2xs backdrop-blur-xs">
          <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
          <span>{rooms.length} Suites • 3 Room Sizes</span>
        </div>
      </div>

      {/* Grouped by Capacity Tier (Small: 4, Medium: 8, Large: 12) per In-Scope */}
      {TIER_CONFIG.map((tier) => {
        const tierRooms = rooms.filter((r) => r.type === tier.type);
        if (tierRooms.length === 0) return null;

        return (
          <div key={tier.type} className="space-y-3">
            {/* Tier Group Section Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-400 to-sky-400" />
                <h4 className="text-sm font-extrabold text-slate-800 tracking-tight">{tier.title}</h4>
                <span className="text-xs text-slate-400 font-medium">({tierRooms.length} Rooms)</span>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${tier.badgeStyle}`}>
                {tier.capacityText}
              </span>
            </div>

            {/* Room Cards for this Tier */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tierRooms.map((room) => (
                <GlassCard
                  key={room.id}
                  className="relative transition-all hover:border-pink-300 hover:shadow-md hover:shadow-pink-100/50 p-4 sm:p-5 flex flex-col justify-between"
                >
                  {/* Top Section: Left Icon Avatar + Right Content Area (Title, Badge, and Full-Width Description) */}
                  <div className="flex items-start gap-3.5">
                    {/* Left Icon: Dedicated Squircle Badge */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-sky-100 text-purple-700 border border-pink-200/80 shadow-xs">
                      <Mic2 className="h-5 w-5" />
                    </div>

                    {/* Right Column: Row 1 = Room Code + Badge, Row 2 = Full-Width Description */}
                    <div className="flex-1 min-w-0">
                      {/* Row 1: Room Number & Tier Size Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="font-black text-slate-900 text-lg tracking-tight leading-none">
                          {room.roomNumber}
                        </h5>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider uppercase shrink-0 ${tier.badgeStyle}`}
                        >
                          <Sparkles className="h-2.5 w-2.5 opacity-80" />
                          {room.type}
                        </span>
                      </div>

                      {/* Row 2: Description spanning full width of right area without badge squeeze */}
                      <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">
                        {room.description || `${room.type} Private Room`}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Row: Max Capacity & Action Button */}
                  <div className="mt-4 flex items-center justify-between border-t border-pink-100/70 pt-3 text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-purple-500 shrink-0" />
                      <span>
                        Max Capacity: <strong className="text-slate-900 font-bold">{room.capacity} Pax</strong>
                      </span>
                    </div>
                    {onBookRoom && (
                      <button
                        onClick={() => onBookRoom(room.id)}
                        className="rounded-full bg-gradient-to-r from-pink-300 via-purple-300 to-sky-300 px-4 py-1.5 text-xs font-extrabold text-purple-950 shadow-xs shadow-purple-100/50 hover:brightness-105 active:scale-95 border border-pink-200/60 transition-all cursor-pointer"
                      >
                        Book Room
                      </button>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
