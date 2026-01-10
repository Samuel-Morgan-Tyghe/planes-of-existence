
import { $inventory } from '../stores/game';
import { DropRollResult } from '../types/drops';

import { ITEM_DEFINITIONS } from '../types/items';

/**
 * Returns a list of item IDs from the provided pool (or all items) 
 * that are NOT currently in the player's inventory.
 */
export function getAvailableUniqueItems(pool: string[] = Object.keys(ITEM_DEFINITIONS)): string[] {
  const inventory = $inventory.get();
  return pool.filter(id => !inventory[id]);
}

/**
 * Helper to pick random item excluding owned ones
 */
function pickRandomItem(pool: string[]): string | null {
  const available = getAvailableUniqueItems(pool);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Helper to roll coin value (weighted)
 */
function rollCoinValue(): number {
  const r = Math.random();
  if (r < 0.70) return 1; // Copper (Common)
  if (r < 0.95) return 5; // Silver (Uncommon)
  return 10; // Gold (Rare)
}

/**
 * Roll for room clear loot
 */
export function rollRoomClearLoot(roomType: string): DropRollResult | null {
  if (roomType === 'treasure') {
    // Updated with new themed items
    // Removed 'double_jump'
    const itemIds = [
      'gladiators_heart', 'berserker_drive', 'executioner_chip',
      'railgun_accelerator', 'sniper_scope', 'guerrilla_tactics',
      'void_prism', 'arcane_battery', 'chaos_engine',
      'titan_plating', 'reactive_shield',
      'assassin_dagger', 'smoke_bomb',
      'noir_detective', 'neon_demon', 'retro_glitch',
      'dead_pixel', 'rgb_split',
      'dull_prism', 'cosine_calibrator', 'vector_field'
    ];
    
    // Internalized filtering
    const randomId = pickRandomItem(itemIds);
    if (!randomId) return { type: 'coin', value: 50 }; // Fallback (Mega Coin for Treasure)
    return { type: 'item', itemId: randomId };
  }

  const lootRoll = Math.random();
  if (lootRoll < 0.4) {
    const isGold = Math.random() < 0.3; // 30% chance for Gold Chest
    return { 
      type: 'chest', 
      chestVariety: isGold ? Math.floor(Math.random() * 2) + 2 : 1, // Gold: 2-3 items, Gray: 1 item
      chestType: isGold ? 'gold' : 'gray' 
    };
  }
  if (lootRoll < 0.7) return { type: 'key' };
  return { type: 'bomb' };
}

/**
 * Roll for rare item drops from destructible objects (5% chance)
 */
export function rollDestructibleLoot(source: 'rock' | 'wall' | 'crate' | 'chest'): DropRollResult | null {
  if (Math.random() > 0.05) return null; // 5% chance

  let pool: string[] = [];
  switch (source) {
    case 'rock':
      pool = ['titan_plating', 'dead_pixel', 'dull_prism', 'shield']; // Hard/Heavy
      break;
    case 'wall':
      pool = ['reactive_shield', 'titan_plating', 'vector_field', 'shield']; // Structural
      break;
    case 'crate':
      pool = ['smoke_bomb', 'guerrilla_tactics', 'railgun_accelerator', 'bomb', 'coin']; // Supplies
      break;
    case 'chest':
      pool = ['void_prism', 'chaos_engine', 'arcane_battery', 'gold_coin']; // Treasure (Removed double_jump)
      break;
  }
  
  // Internalized filtering logic...
  const consumables = ['bomb', 'key', 'coin', 'gold_coin', 'shield', 'health'];
  
  // Separate pool into uniques and consumables
  const uniques = pool.filter(id => !consumables.includes(id));
  const poolConsumables = pool.filter(id => consumables.includes(id));
  
  const inventory = $inventory.get();
  const availableUniques = uniques.filter(id => !inventory[id]);
  
  const finalPool = [...availableUniques, ...poolConsumables];
  
  if (finalPool.length === 0) return { type: 'coin', value: rollCoinValue() }; // Fallback

  const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
  
  if (pick === 'shield') return { type: 'shield' };
  if (pick === 'bomb') return { type: 'bomb' };
  if (pick === 'coin') return { type: 'coin', value: rollCoinValue() };
  if (pick === 'gold_coin') return { type: 'coin', value: 10 }; // Guaranteed gold
  
  return { type: 'item', itemId: pick };
}

/**
 * Roll for boss loot (Guaranteed high-tier item)
 */
export function rollBossLoot(): DropRollResult {
  // Removed 'double_jump'
  const bossPool = [
    'rgb_split', 'titan_plating', 'chaos_engine',
    'void_prism', 'executioner_chip', 'railgun_accelerator',
    'berserker_drive', 'gladiators_heart'
  ];
  
  const randomId = pickRandomItem(bossPool);
  if (!randomId) return { type: 'coin', value: 100 }; // Fallback (Huge Coin)
  return { type: 'item', itemId: randomId };
}

/**
 * Roll for a drop from an enemy death
 */
export function rollDrop(): DropRollResult | null {
  const roll = Math.random();

  if (roll < 0.35) return { type: 'key' };
  if (roll < 0.40) return { type: 'bomb' };
  if (roll < 0.27) { // Wait, logic error in original code? 0.27 < 0.40? 
    // The original code had:
    // ... < 0.20 shield
    // ... < 0.30 coin
    // ... < 0.35 key
    // ... < 0.40 bomb
    // ... < 0.27 chest (This is unreachable if checks are sequential!)
    // Yes! `roll < 0.27` is strictly covered by `roll < 0.30`.
    // I should fix this bug explicitly.
    // Let's reorder or adjust probabilities.
    // 0.00-0.05: Health
    // 0.05-0.20: Shield
    // 0.20-0.30: Coin
    // 0.30-0.35: Key
    // 0.35-0.45: Bomb
    // 0.45-0.50: Chest
    // 0.50-0.60: Enemy Spawn?
  }
  // Let's fix the probability chain.
  if (roll < 0.05) return { type: 'health' }; 
  if (roll < 0.15) return { type: 'shield' }; 
  if (roll < 0.35) return { type: 'coin', value: rollCoinValue() };
  if (roll < 0.40) return { type: 'key' };
  if (roll < 0.50) return { type: 'bomb' };
  if (roll < 0.55) {
     const isGold = Math.random() < 0.3;
     return { 
       type: 'chest', 
       chestVariety: isGold ? 2 : 1, 
       chestType: isGold ? 'gold' : 'gray' 
     };
  }
  if (roll < 0.60) return { type: 'enemy_spawn', spawnCount: 1 };

  if (roll < 0.60) return { type: 'enemy_spawn', spawnCount: 1 };

  return null;
}

/**
 * Roll loot for Gold Chests (Powerups + Consumables)
 */
export function rollGoldChestLoot(variety: number): DropRollResult[] {
  const results: DropRollResult[] = [];
  
  // Powerup Pool (Stat boosters / Good utility)
  const powerupPool = [
    'gladiators_heart', 'berserker_drive', 'titan_plating', 
    'reactive_shield', 'void_prism', 'arcane_battery',
    'railgun_accelerator', 'sniper_scope', 'guerrilla_tactics'
  ];

  for (let i = 0; i < variety; i++) {
    const r = Math.random();
    
    // 35% chance for a Powerup Item (Unique)
    if (r < 0.35) {
      const item = pickRandomItem(powerupPool);
      if (item) {
        results.push({ type: 'item', itemId: item });
        continue;
      }
    }
    
    // Otherwise high-tier consumables
    const cr = Math.random();
    if (cr < 0.30) results.push({ type: 'shield' });
    else if (cr < 0.60) results.push({ type: 'coin', value: 10 }); // Gold Coin
    else if (cr < 0.80) results.push({ type: 'key' });
    else results.push({ type: 'bomb' });
  }
  
  return results;
}

/**
 * Roll loot for Standard Gray Chests (Basic Consumables)
 */
export function rollGrayChestLoot(variety: number): DropRollResult[] {
  const results: DropRollResult[] = [];
  const pool = ['health', 'shield', 'key', 'bomb', 'coin'];
  
  for (let i = 0; i < variety; i++) {
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick === 'coin') results.push({ type: 'coin', value: rollCoinValue() });
    else results.push({ type: pick } as DropRollResult);
  }
  
  return results;
}
