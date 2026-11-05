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

export interface RoomCatalogResponse {
  success: boolean;
  rooms: Room[];
}

export interface AvailabilityResponse {
  success: boolean;
  date: string;
  rooms: RoomAvailability[];
}
