import { atom } from 'nanostores';

type DamageEvent = {
  enemyId: number;
  damage: number;
  timestamp: number;
};

type DropEvent = {
  position: [number, number, number];
  roomId: number;
  timestamp: number;
  forcedType?: any;
  forcedItem?: string;
};

// Simple event bus using Nanostores atoms
// We use a timestamp to ensure every event is unique and triggers effects
export const $damageEvents = atom<DamageEvent | null>(null);
export const $dropEvents = atom<DropEvent | null>(null);

export const emitDamage = (enemyId: number, damage: number) => {
  $damageEvents.set({ enemyId, damage, timestamp: Date.now() });
};

export const emitDrop = (position: [number, number, number], roomId: number, forcedType?: any, forcedItem?: string) => {
  $dropEvents.set({ position, roomId, timestamp: Date.now(), forcedType, forcedItem });
};

type RoomClearEvent = {
  position: [number, number, number];
  roomId: number;
  roomType: string;
  timestamp: number;
};

type KnockbackEvent = {
  direction: [number, number, number];
  force: number;
  timestamp: number;
};

export const $roomClearEvents = atom<RoomClearEvent | null>(null);
export const $knockbackEvents = atom<KnockbackEvent | null>(null);

export const emitRoomClearLoot = (position: [number, number, number], roomId: number, roomType: string) => {
  $roomClearEvents.set({ position, roomId, roomType, timestamp: Date.now() });
};

export const emitKnockback = (direction: [number, number, number], force: number) => {
  $knockbackEvents.set({ direction, force, timestamp: Date.now() });
};

type CorruptionEvent = {
  targetId: number;
  timestamp: number;
};

export const $corruptionEvents = atom<CorruptionEvent | null>(null);

export const emitCorruption = (targetId: number) => {
  $corruptionEvents.set({ targetId, timestamp: Date.now() });
};
