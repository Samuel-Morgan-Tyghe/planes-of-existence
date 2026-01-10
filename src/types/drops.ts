export type DropType = 'key' | 'bomb' | 'chest' | 'enemy_spawn' | 'coin' | 'item' | 'health' | 'shield';

export interface Drop {
  id: number;
  type: DropType;
  position: [number, number, number];
  roomId: number;
  value?: number; // For coins
  chestType?: 'gray' | 'gold';
}

export interface DropRollResult {
  type: DropType;
  spawnCount?: number; // For enemy spawns
  chestVariety?: number; // For chests (how many items)
  itemId?: string; // For items
  value?: number; // For coins
  chestType?: 'gray' | 'gold';
}


