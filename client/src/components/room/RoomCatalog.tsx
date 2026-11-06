import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Users, Mic2, Sparkles } from 'lucide-react';
import { Room, RoomType } from '../../types/room';

interface RoomCatalogProps {
  rooms: Room[];
  isLoading?: boolean;
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
    badgeStyle: 'bg-teal-100 text-teal-800 border-teal-200 shadow-xs shadow-teal-100/50',
    tagColor: 'text-teal-700'
  },
  {
    type: 'MEDIUM',
    title: 'Medium Rooms',
    capacityText: '8 Pax Capacity',
    badgeStyle: 'bg-pink-100 text-pink-800 border-pink-200 shadow-xs shadow-pink-100/50',
    tagColor: 'text-pink-700'
  },
  {
    type: 'LARGE',
    title: 'Large Rooms',
    capacityText: '12 Pax Capacity',
    badgeStyle: 'bg-purple-100 text-purple-800 border-purple-200 shadow-xs shadow-purple-100/50',
    tagColor: 'text-purple-700'
  }
];

export const RoomCatalog: React.FC<RoomCatalogProps> = ({ rooms, isLoading = false }) => {
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
      <div className="flex items-center justify-between border-b border-pink-100/80 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">Room Fleet Catalog</h3>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
            F-02 Seeded Fleet
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500">{rooms.length} Rooms Configured across 3 Tiers</span>
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
                <span className="h-2 w-2 rounded-full bg-purple-400" />
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
                <GlassCard key={room.id} className="relative transition-all hover:border-pink-300 hover:shadow-md hover:shadow-pink-100/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 text-purple-700 border border-pink-200/80 shadow-xs">
                        <Mic2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-lg tracking-tight">{room.roomNumber}</h5>
                        <p className="text-xs text-slate-500 font-medium">
                          {room.description || `${room.type} Private Room`}
                        </p>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${tier.badgeStyle}`}>
                      <Sparkles className="h-2.5 w-2.5 opacity-70" />
                      {room.type}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-2 border-t border-pink-100/60 pt-3 text-xs text-slate-600 font-medium">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span>Max Capacity: <strong className="text-slate-900 font-bold">{room.capacity} Pax</strong></span>
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
