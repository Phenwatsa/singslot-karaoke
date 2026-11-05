import React from 'react';
import { GlassCard } from '../layout/GlassCard';
import { Users, Mic2 } from 'lucide-react';
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
          <GlassCard key={n} className="animate-pulse py-8 text-center text-slate-400">
            Loading room catalog...
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Room Fleet Catalog</h3>
        <span className="text-xs font-medium text-slate-500">{rooms.length} Rooms Configured</span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => {
          const typeBadgeColor =
            room.type === 'LARGE'
              ? 'bg-purple-100 text-purple-700 border-purple-200'
              : room.type === 'MEDIUM'
              ? 'bg-pink-100 text-pink-700 border-pink-200'
              : 'bg-indigo-100 text-indigo-700 border-indigo-200';

          return (
            <GlassCard key={room.id} className="relative transition-all hover:border-pink-400 hover:shadow-xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-pink-600 border border-pink-100 shadow-sm">
                    <Mic2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-lg tracking-tight">{room.roomNumber}</h4>
                    <p className="text-xs text-slate-500">
                      {room.description || `${room.type} Private Karaoke Room`}
                    </p>
                  </div>
                </div>

                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${typeBadgeColor}`}>
                  {room.type}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />
                <span>Max Capacity: <strong className="text-slate-800">{room.capacity} Pax</strong></span>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
};
