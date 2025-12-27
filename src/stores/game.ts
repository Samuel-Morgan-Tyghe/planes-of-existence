import { atom, map } from 'nanostores';
import type { PlaneType, PlayerStats } from '../types/game';
import type { FloorData } from '../types/room';

// Current active plane/view
export const $plane = atom<PlaneType>('ISO');

// Player stats (artistic attributes)
export const $stats = map<PlayerStats>({
  sharpness: 0.5,
  saturation: 1.0,
  contrast: 0.5,
  brightness: 1.0,
  resolution: 1.0,
});

// Inventory (itemId -> count/level)
export const $inventory = map<Record<string, number>>({});

// Floor system
export const $currentFloor = atom<number>(0); // Which floor (level)
export const $currentRoomId = atom<number>(0); // Which room within the floor
export const $floorData = atom<FloorData | null>(null); // Current floor layout
export const $visitedRooms = atom<Set<number>>(new Set([0])); // Track which rooms have been visited/revealed
export const $clearedRooms = atom<Set<number>>(new Set()); // Track which rooms have been cleared (all enemies defeated)

// Enemies alive in current room
export const $enemiesAlive = atom<number>(0);

// Room cleared status (all enemies defeated)
export const $roomCleared = atom<boolean>(false);

// Pause state
export const $isPaused = atom<boolean>(false);

// Actions
export const switchPlane = (plane: PlaneType) => {
  $plane.set(plane);
};

export const updateStat = <K extends keyof PlayerStats>(
  stat: K,
  value: PlayerStats[K]
) => {
  $stats.setKey(stat, value);
};

export const addItem = (itemId: string) => {
  const current = $inventory.get()[itemId] || 0;
  $inventory.setKey(itemId, current + 1);
};

export const togglePause = () => {
  $isPaused.set(!$isPaused.get());
};

