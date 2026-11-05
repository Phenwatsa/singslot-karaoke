import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Users, Mic2, Sparkles } from 'lucide-react';
import { Room } from '../../types/room';

interface RoomCatalogProps {
  rooms: Room[];
  isLoading?: boolean;
}

export const RoomCatalog: React.FC<RoomCatalogProps> = ({ rooms, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <GlassCard key={n} className="animate-pulse py-8 text-center text-purple-400 font-medium">
            Loading room fleet catalog...
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-900">Room Fleet Catalog</h3>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
            F-02 Seeded Fleet
          </span>
        </div>
        <span className="text-xs font-semibold text-slate-500">{rooms.length} Rooms Ready</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const typeBadgeColor =
            room.type === 'LARGE'
              ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm shadow-purple-100/50'
              : room.type === 'MEDIUM'
              ? 'bg-pink-100 text-pink-700 border-pink-200 shadow-sm shadow-pink-100/50'
              : 'bg-teal-100 text-teal-700 border-teal-200 shadow-sm shadow-teal-100/50';

          return (
            <GlassCard key={room.id} className="relative transition-all hover:border-pink-300 hover:shadow-xl hover:shadow-pink-100/60">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 text-pink-600 border border-pink-200 shadow-sm">
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-lg tracking-tight">{room.roomNumber}</h4>
                    <p className="text-xs text-slate-500">
                      {room.description || `${room.type} Private Room`}
                    </p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${typeBadgeColor}`}>
                  <Sparkles className="h-2.5 w-2.5 opacity-70" />
                  {room.type}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-pink-100/60 pt-3 text-xs text-slate-600">
                <Users className="h-4 w-4 text-purple-400" />
                <span>Max Capacity: <strong className="text-slate-900 font-bold">{room.capacity} Pax</strong></span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
