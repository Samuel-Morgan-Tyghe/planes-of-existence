import { map } from 'nanostores';

export type LootType = 'coin' | 'heart' | 'shield';

export interface LootItem {
  id: string;
  type: LootType;
  position: [number, number, number];
  value: number; // Amount for coin, heal amount for heart, etc.
}

// Map of Loot ID -> Loot Data
export const $activeLoot = map<Record<string, LootItem>>({});

// Set of Coordinate strings "x,y" (or unique IDs) that have been destroyed
// This ensures crates don't reappear if we revisit a room (though simple tile clearing in GridMap works too)
// For now, simpler: GridMap will check this store to skip rendering broken crates.
export const $brokenCrates = map<Record<string, boolean>>({});

export const spawnLoot = (position: [number, number, number], type?: LootType) => {
  const id = Math.random().toString(36).substr(2, 9);
  
  // Randomize type if not provided
  if (!type) {
    const r = Math.random();
    if (r < 0.6) type = 'coin';
    else if (r < 0.9) type = 'heart';
    else type = 'shield';
  }

  let value = 1;
  if (type === 'coin') value = 10;
  if (type === 'heart') value = 1; // 1 HP
  if (type === 'shield') value = 10000; // Time based?

  const item: LootItem = { id, type, position, value };
  
  $activeLoot.setKey(id, item);
};

export const collectLoot = (id: string) => {
  const item = $activeLoot.get()[id];
  if (!item) return;

  // Effects will be handled by the collector (Player.tsx) reading the item type
  // Here we just remove it from the world
  const current = { ...$activeLoot.get() };
  delete current[id];
  $activeLoot.set(current);
  
  return item;
};

export const breakCrate = (id: string) => {
    $brokenCrates.setKey(id, true);
}

export const clearLoot = () => {
    $activeLoot.set({});
    $brokenCrates.set({});
}
