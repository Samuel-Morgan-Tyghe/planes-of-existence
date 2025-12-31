import { atom, map } from 'nanostores';
import { Drop } from '../types/drops';
import type { EnemyState } from '../types/enemies';
import type { PlaneType, PlayerStats } from '../types/game';
import { ITEM_DEFINITIONS } from '../types/items';
import type { FloorData } from '../types/room';

export const $drops = atom<Drop[]>([]);

// Current active plane/view
export const $plane = atom<PlaneType>('ISO');

// Player stats (artistic attributes)
export const $stats = map<PlayerStats>({
  sharpness: 0.5,
  saturation: 1.0,
  contrast: 0.5,
  brightness: 1.0,
  resolution: 1.0,
  // Base Combat Stats
  range: 2.0,           // 2 seconds lifetime
  fireRate: 5.0,        // 5 shots per second
  projectileSize: 1.0,  // 1x scale
  damage: 1.0,          // 1x damage multiplier
  projectileSpeed: 10.0, // 10 units per second
  // Artistic Gameplay Modifiers
  critChance: 0.05,      // 5% base crit
  armorPen: 0,
  pierce: 0,
  trueDamage: false,
  dodgeChance: 0,
  stealthMultiplier: 1.0,
  lootRarityBonus: 0,
  incomingDamageMultiplier: 1.0,
});

// Inventory (itemId -> count/level)
export const $inventory = map<Record<string, number>>({});
export const $coins = atom<number>(0);

// Floor system
export const $currentFloor = atom<number>(0); // Which floor (level)
export const $currentRoomId = atom<number>(0); // Which room within the floor
export const $floorData = atom<FloorData | null>(null); // Current floor layout
export const $visitedRooms = atom<Set<number>>(new Set([0])); // Track which rooms have been visited/revealed
export const $clearedRooms = atom<Set<number>>(new Set()); // Track which rooms have been cleared (all enemies defeated)

// Enemies alive in current room
export const $enemiesAlive = atom<number>(0);

// Enemy state for current room
export const $enemies = atom<EnemyState[]>([]); // Store enemy state globally
export const $enemyPositions = atom<Record<number, [number, number, number]>>({}); // Real-time positions for projectiles

// Room cleared status (all enemies defeated)
export const $roomCleared = atom<boolean>(false);

// Pause state
export const $isPaused = atom<boolean>(false);

// HUD Visibility
export const $showCombatStats = atom<boolean>(false);

// Camera shake trigger (intensity)
export const $cameraShake = atom<number>(0);

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

  // Apply stat modifiers if it's a defined item
  const itemDef = ITEM_DEFINITIONS[itemId];
  if (itemDef?.statModifiers) {
    const currentStats = $stats.get();
    const newStats = { ...currentStats };

    Object.entries(itemDef.statModifiers).forEach(([stat, mod]) => {
      const key = stat as keyof PlayerStats;
      if (typeof currentStats[key] === 'number') {
        // Most combat stats are multipliers or additive boosts
        // For combat stats, we'll treat them as additive to the base multiplier
        (newStats[key] as any) += mod;
      } else if (typeof currentStats[key] === 'boolean') {
        (newStats[key] as any) = mod;
      }
    });

    $stats.set(newStats);
    console.log(`📈 Stats updated after picking up ${itemDef.name}:`, newStats);
  }
};

export const togglePause = () => {
  $isPaused.set(!$isPaused.get());
};

export const toggleCombatStats = () => {
  $showCombatStats.set(!$showCombatStats.get());
};
