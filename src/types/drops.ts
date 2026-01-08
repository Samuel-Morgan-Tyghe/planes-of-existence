export type DropType = 'key' | 'bomb' | 'chest' | 'enemy_spawn' | 'coin' | 'item' | 'health' | 'shield';

export interface Drop {
  id: number;
  type: DropType;
  position: [number, number, number];
  roomId: number;
}

export interface DropRollResult {
  type: DropType;
  spawnCount?: number; // For enemy spawns
  chestVariety?: number; // For chests (how many items)
  itemId?: string; // For items
}

/**
 * Roll for a drop from an enemy death
 */
export function rollDrop(): DropRollResult | null {
  const roll = Math.random();

  if (roll < 0.05) return { type: 'health' }; 
  if (roll < 0.20) return { type: 'shield' }; // 15% Chance for Shield!
  if (roll < 0.30) return { type: 'coin' };
  if (roll < 0.35) return { type: 'key' };
  if (roll < 0.40) return { type: 'bomb' };
  if (roll < 0.27) return { type: 'chest', chestVariety: 1 };
  if (roll < 0.30) return { type: 'enemy_spawn', spawnCount: 1 };

  return null;
}

/**
 * Roll for room clear loot
 */
export function rollRoomClearLoot(roomType: string): DropRollResult | null {
  if (roomType === 'treasure') {
    // Updated with new themed items
    const itemIds = [
      'gladiators_heart', 'berserker_drive', 'executioner_chip',
      'railgun_accelerator', 'sniper_scope', 'guerrilla_tactics',
      'void_prism', 'arcane_battery', 'chaos_engine',
      'titan_plating', 'reactive_shield',
      'assassin_dagger', 'smoke_bomb',
      'noir_detective', 'neon_demon', 'retro_glitch',
      'dead_pixel', 'rgb_split', 'double_jump',
      'dull_prism', 'cosine_calibrator', 'vector_field'
    ];
    const randomId = itemIds[Math.floor(Math.random() * itemIds.length)];
    return { type: 'item', itemId: randomId };
  }

  const lootRoll = Math.random();
  if (lootRoll < 0.4) return { type: 'chest', chestVariety: Math.floor(Math.random() * 3) + 1 };
  if (lootRoll < 0.7) return { type: 'key' };
  return { type: 'bomb' };
}
