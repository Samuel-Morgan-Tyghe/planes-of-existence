export type DropType = 'key' | 'bomb' | 'chest' | 'enemy_spawn';

export interface Drop {
  id: number;
  type: DropType;
  position: [number, number, number];
}

export interface DropRollResult {
  type: DropType;
  spawnCount?: number; // For enemy spawns
  chestVariety?: number; // For chests (how many items)
}

/**
 * Roll dice to determine what drops when an enemy is killed
 */
export function rollDrop(): DropRollResult | null {
  const roll = Math.random();

  // 40% chance of no drop
  if (roll < 0.4) {
    return null;
  }

  // 60% chance of drop, distributed as:
  // - 20% key (locked door)
  // - 15% bomb (destroy wall)
  // - 15% chest (random variety 1-5)
  // - 10% enemy spawn (1-3 enemies)

  const dropRoll = Math.random();

  if (dropRoll < 0.33) {
    // 20% of 60% = Key
    return { type: 'key' };
  } else if (dropRoll < 0.58) {
    // 15% of 60% = Bomb
    return { type: 'bomb' };
  } else if (dropRoll < 0.83) {
    // 15% of 60% = Chest with random variety
    return {
      type: 'chest',
      chestVariety: Math.floor(Math.random() * 5) + 1 // 1-5 items
    };
  } else {
    // 10% of 60% = Enemy spawn
    return {
      type: 'enemy_spawn',
      spawnCount: Math.floor(Math.random() * 3) + 1 // 1-3 enemies
    };
  }
}
