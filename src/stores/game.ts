import { atom, map } from 'nanostores';
import { Drop } from '../types/drops';
import type { EnemyState } from '../types/enemies';
import { ENEMY_DEFINITIONS } from '../types/enemies';
import type { PlaneType, PlayerStats, ThrownBomb } from '../types/game';
import { ITEM_DEFINITIONS } from '../types/items';
import type { FloorData } from '../types/room';

export const $drops = atom<Drop[]>([]);

// Current active plane/view
export const $plane = atom<PlaneType>('ISO');
export const $playerYaw = atom<number>(0);

// Hovered item for UI preview
export const $hoveredItem = atom<string | null>(null);

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
  knockback: 1.0,
  knockbackResistance: 1.0,
  // Movement
  maxJumps: 1, // Number of jumps allowed (1 = single jump, 2 = double jump)
});

// Inventory (itemId -> count/level)
export const $inventory = map<Record<string, number>>({
  'bomb': 5, // Start with some bombs for testing
});
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

// Boss enemy state (separate from regular enemies)
export const $bossEnemy = atom<EnemyState | null>(null);
export const $bossAlive = atom<boolean>(false);

// Room cleared status (all enemies defeated)
export const $roomCleared = atom<boolean>(false);

// Pause state
export const $isPaused = atom<boolean>(false);

// Random Seed for Procedural Generation
export const $runSeed = atom<number>(Math.floor(Math.random() * 1000000));

// HUD Visibility
export const $showCombatStats = atom<boolean>(false);

// Camera shake trigger (intensity)
export const $cameraShake = atom<number>(0);

// Thrown bombs in the world
export const $thrownBombs = map<Record<number, ThrownBomb>>({});

// Broken walls: roomId -> Set of "x,y" coordinates
export const $brokenWalls = map<Record<number, Set<string>>>({});

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
  
  // Special handling for double_jump item
  if (itemId === 'double_jump') {
    $stats.setKey('maxJumps', 2);
    console.log('🦘 Double jump unlocked!');
  }
};

export const togglePause = () => {
  $isPaused.set(!$isPaused.get());
};

export const toggleCombatStats = () => {
  $showCombatStats.set(!$showCombatStats.get());
};

let bombIdCounter = 0;

export const spawnThrownBomb = (position: [number, number, number], direction: [number, number, number], initialVelocity: [number, number, number], fuse: number = 3.0) => {
  const id = bombIdCounter++;
  const newBomb: ThrownBomb = {
    id,
    position,
    direction,
    initialVelocity,
    exploded: false,
    fuse,
  };
  
  $thrownBombs.setKey(id, newBomb);
  console.log('💣 Bomb spawned:', newBomb);
  return id;
};

export const useBomb = (position: [number, number, number], direction: [number, number, number], playerVelocity?: [number, number, number], standstill?: boolean) => {
  const inventory = $inventory.get();
  const bombCount = inventory['bomb'] || 0;

  if (bombCount > 0) {
    $inventory.setKey('bomb', bombCount - 1);
    
    let initialVelocity: [number, number, number];
    
    if (standstill) {
      // Drop bomb with no force, just gravity
      initialVelocity = [0, 0, 0];
    } else {
      const throwForce = 10;
      initialVelocity = [
        direction[0] * throwForce + (playerVelocity?.[0] || 0),
        3 + (playerVelocity?.[1] || 0),
        direction[2] * throwForce + (playerVelocity?.[2] || 0)
      ];
    }

    spawnThrownBomb(position, direction, initialVelocity);
    return true;
  }
  
  console.log('❌ No bombs left!');
  return false;
};

export const enemyUseBomb = (position: [number, number, number], direction: [number, number, number], enemyVelocity?: [number, number, number]) => {
  const throwForce = 8; // Slightly weaker than player throw
  const initialVelocity: [number, number, number] = [
    direction[0] * throwForce + (enemyVelocity?.[0] || 0),
    4 + (enemyVelocity?.[1] || 0), // Higher arc
    direction[2] * throwForce + (enemyVelocity?.[2] || 0)
  ];

  spawnThrownBomb(position, direction, initialVelocity);
  return true;
};

export const updateThrownBomb = (id: number, data: Partial<ThrownBomb>) => {
  const bomb = $thrownBombs.get()[id];
  if (bomb) {
    $thrownBombs.setKey(id, { ...bomb, ...data });
  }
};

export const removeThrownBomb = (id: number) => {
  const bombs = { ...$thrownBombs.get() };
  delete bombs[id];
  $thrownBombs.set(bombs);
};

export const breakWall = (roomId: number, x: number, y: number) => {
  const current = $brokenWalls.get()[roomId] || new Set<string>();
  const next = new Set(current);
  next.add(`${x},${y}`);
  $brokenWalls.setKey(roomId, next);
  console.log(`🧱 Wall broken at room ${roomId}, pos ${x},${y}`);
};

export const spawnEnemy = (definitionId: string, position: [number, number, number]) => {
  const definition = ENEMY_DEFINITIONS[definitionId];
  if (!definition) return;

  const currentEnemies = $enemies.get();
  const newId = Math.max(0, ...currentEnemies.map(e => e.id)) + 1;
  
  const currentRoomId = $currentRoomId.get();
  const newEnemy: EnemyState = {
    id: newId,
    roomId: currentRoomId,
    definition,
    health: definition.health,
    position,
    isDead: false,
    spawnTime: Date.now(),
  };

  // Glitchers have a chance to hold a random item
  if (definition.id === 'glitch_basic') {
    const itemIds = Object.keys(ITEM_DEFINITIONS);
    newEnemy.heldItem = itemIds[Math.floor(Math.random() * itemIds.length)];
  }

  console.log(`👹 Manually spawning enemy: ${definition.name} (ID: ${newId}) in Room: ${currentRoomId} at [${position.join(', ')}]`);
  $enemies.set([...currentEnemies, newEnemy]);
  $enemiesAlive.set($enemiesAlive.get() + 1);
};
// ... (previous code)

export const debugRerollEnemies = () => {
  const roomId = $currentRoomId.get();
  const floorData = $floorData.get();
  if (!floorData) return;
  
  const room = floorData.rooms.find(r => r.id === roomId);
  if (!room || room.type === 'start') return; // Don't spawn in start room
  
  // 1. Filter out existing enemies for this room
  const allEnemies = $enemies.get();
  const otherEnemies = allEnemies.filter(e => e.roomId !== roomId);
  
  // 2. Generate new enemies for this room using existing spawn points
  const newEnemies: EnemyState[] = [];
  const enemyTypes = Object.values(ENEMY_DEFINITIONS).filter(e => e.id !== 'boss'); // No double bosses
  
  // We need to re-generate layout to get world positions if they aren't stored on the room
  // room.enemySpawnPoints contains [gridX, gridY]
  
  // To get world coordinates, we need the room's world offset.
  // We can re-calculate it or use the utility.
  // room.gridX * ROOM_WORLD_SIZE
  // let's import getRoomWorldSize from floorGen? Or just replicate simple math.
  // floorGen.ts: ROOM_WORLD_SIZE = 40.
  
  const ROOM_WORLD_SIZE = 60;
  const worldOffset: [number, number, number] = [
    room.gridX * ROOM_WORLD_SIZE,
    0,
    room.gridY * ROOM_WORLD_SIZE,
  ];
  
  // Helper to convert grid to world (replicated from floorGen/GridMap logic)
  const gridToWorldLocal = (gx: number, gy: number) => {
    const ROOM_SIZE = 30;
    const tileSize = ROOM_WORLD_SIZE / ROOM_SIZE;
    const offset = -ROOM_WORLD_SIZE / 2 + tileSize / 2;
    return [
      worldOffset[0] + offset + gx * tileSize,
      0.5, // Default height
      worldOffset[2] + offset + gy * tileSize
    ] as [number, number, number];
  };

  room.enemySpawnPoints.forEach(point => {
    const [gridX, gridY] = point;
    const pos = gridToWorldLocal(gridX, gridY);
    
    const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
     // Glitchers have a chance to hold a random item
    let heldItem: string | undefined;
    if (randomEnemy.id === 'glitch_basic') {
      const itemIds = Object.keys(ITEM_DEFINITIONS);
      heldItem = itemIds[Math.floor(Math.random() * itemIds.length)];
    }

    // Generate a temporary ID. 
    // Ideally we should use a counter that doesn't conflict.
    // The previous max ID + 1 + index
    const maxId = Math.max(0, ...otherEnemies.map(e => e.id), ...newEnemies.map(e => e.id));
    
    newEnemies.push({
      id: maxId + 1,
      roomId: roomId,
      definition: randomEnemy,
      health: randomEnemy.health,
      position: pos,
      isDead: false,
      heldItem,
      spawnTime: Date.now(),
    });
  });
  
  $enemies.set([...otherEnemies, ...newEnemies]);
  $enemiesAlive.set([...otherEnemies, ...newEnemies].length);
  $roomCleared.set(false);
  
  console.log(`🎲 Rerolled ${newEnemies.length} enemies for room ${roomId}`);
};
