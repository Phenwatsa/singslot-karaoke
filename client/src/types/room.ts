export type RoomType = 'SMALL' | 'MEDIUM' | 'LARGE';

export interface Room {
  id: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  description?: string | null;
  isActive?: boolean;
}

export interface SlotAvailability {
  slotIndex: number;
  timeRange: string;
  isAvailable: boolean;
  isPast?: boolean;
  isOccupied?: boolean;
}

export interface RoomAvailability {
  id: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  description?: string | null;
  slots: SlotAvailability[];
}

export interface RoomTierGroup {
  tier: RoomType;
  displayName: string;
  capacity: number;
  rooms: Room[];
}

export interface RoomCatalogResponse {
  success: boolean;
  rooms: Room[];
  tiers?: {
    SMALL: RoomTierGroup;
    MEDIUM: RoomTierGroup;
    LARGE: RoomTierGroup;
  };
}

export interface AvailabilityResponse {
  success: boolean;
  date: string;
  rooms: RoomAvailability[];
}
