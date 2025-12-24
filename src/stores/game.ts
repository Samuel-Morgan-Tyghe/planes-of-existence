import { atom, map } from 'nanostores';
import type { PlaneType, PlayerStats } from '../types/game';

// Current active plane/view
export const $plane = atom<PlaneType>('2D');

// Player stats (artistic attributes)
export const $stats = map<PlayerStats>({
  sharpness: 0.5,
  saturation: 1.0,
  contrast: 0.5,
  resolution: 1.0,
});

// Inventory (itemId -> count/level)
export const $inventory = map<Record<string, number>>({});

// Current room/level
export const $currentRoom = atom<number>(0);

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

