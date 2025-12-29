import { atom } from 'nanostores';

type DamageEvent = {
  enemyId: number;
  damage: number;
  timestamp: number;
};

type DropEvent = {
  position: [number, number, number];
  timestamp: number;
};

// Simple event bus using Nanostores atoms
// We use a timestamp to ensure every event is unique and triggers effects
export const $damageEvents = atom<DamageEvent | null>(null);
export const $dropEvents = atom<DropEvent | null>(null);

export const emitDamage = (enemyId: number, damage: number) => {
  $damageEvents.set({ enemyId, damage, timestamp: Date.now() });
};

export const emitDrop = (position: [number, number, number]) => {
  $dropEvents.set({ position, timestamp: Date.now() });
};
