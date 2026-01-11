import { generateBossRoom } from '../logic/rooms/models/boss';
import { generateNormalRoom } from '../logic/rooms/models/normal';
import { generateTreasureRoom } from '../logic/rooms/models/treasure';
import { getRoomGenerator, registerRoomGenerator } from '../logic/rooms/registry';
import type { FloorData, GridMap, Room, RoomLayoutData } from '../types/room';
import { SeededRandom } from './random'; // Import extracted Random

const ROOM_SIZE = 30; // Each room is 30x30 tiles
const ROOM_WORLD_SIZE = 60; // Each room is 60 units in world space

import { generateShopRoom } from '../logic/rooms/models/shop';

// Register default generators
registerRoomGenerator('boss', generateBossRoom);
registerRoomGenerator('treasure', generateTreasureRoom);
registerRoomGenerator('normal', generateNormalRoom);
registerRoomGenerator('start', generateNormalRoom); // Use normal layout for start room
registerRoomGenerator('shop', generateShopRoom);

export { SeededRandom }; // Re-export for compatibility

/**
 * Generate a floor with multiple connected rooms.
 * Strictly deterministic based on the provided seed.
 */
export function generateFloor(floorNumber: number, seed: number = 12345, scenario?: string): FloorData {
  if (scenario === 'test_chamber') {
    return generateTestFloor(seed, 'normal');
  } else if (scenario === 'boss_fight') {
    return generateTestFloor(seed, 'boss');
  }
  // Combine floor number and master seed for unique floor seeds
  const floorSeed = seed + (floorNumber * 99999);
  const rng = new SeededRandom(floorSeed);

  // Random number of rooms (6-10) to ensure enough space for specials
  const roomCount = rng.nextInt(6, 12);

  const rooms: Room[] = [];
  const roomGrid = new Map<string, number>(); // "x,y" -> roomId

  // Start with first room at origin
  const startRoom: Room = {
    id: 0,
    gridX: 0,
    gridY: 0,
    type: 'start',
    doors: [],
    distanceFromStart: 0,
    enemySpawnPoints: [], // Will be calculated deterministically
    enemyCount: 0,
  };

  rooms.push(startRoom);
  roomGrid.set('0,0', 0);

  // Generate connected rooms using random walk
  const directions = [
    { dx: 0, dy: -1, name: 'north' as const },
    { dx: 0, dy: 1, name: 'south' as const },
    { dx: 1, dy: 0, name: 'east' as const },
    { dx: -1, dy: 0, name: 'west' as const },
  ];

  // Keep track of rooms that can expand
  const expandableRooms = [0];

  for (let i = 1; i < roomCount; i++) {
    if (expandableRooms.length === 0) break;

    // Pick a random room to expand from
    const fromRoomId = expandableRooms[Math.floor(rng.next() * expandableRooms.length)];
    const fromRoom = rooms[fromRoomId];

    // Try random directions until we find an empty spot
    const shuffledDirections = rng.shuffle(directions);
    let placed = false;

    for (const dir of shuffledDirections) {
      const newX = fromRoom.gridX + dir.dx;
      const newY = fromRoom.gridY + dir.dy;
      const key = `${newX},${newY}`;

      if (!roomGrid.has(key)) {
        // Create new room
        const newRoom: Room = {
          id: i,
          gridX: newX,
          gridY: newY,
          type: 'normal',
          doors: [],
          distanceFromStart: 0, // Will calculate later
          enemySpawnPoints: [],
          enemyCount: 0,
        };

        rooms.push(newRoom);
        roomGrid.set(key, i);
        expandableRooms.push(i);

        // Add doors connecting the rooms (always unlocked for guaranteed path)
        const oppositeDir = {
          north: 'south' as const,
          south: 'north' as const,
          east: 'west' as const,
          west: 'east' as const,
        };

        fromRoom.doors.push({ direction: dir.name, locked: false });
        newRoom.doors.push({ direction: oppositeDir[dir.name], locked: false });

        placed = true;
        break;
      }
    }

    // If this room can't expand anymore, remove it from expandable list
    if (!placed) {
      const index = expandableRooms.indexOf(fromRoomId);
      if (index > -1) expandableRooms.splice(index, 1);
      i--; // Try again with different room
    }
  }

  // Calculate distances from start using BFS
  const queue = [0];
  const visited = new Set<number>([0]);
  rooms[0].distanceFromStart = 0;

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = rooms[currentId];

    // Find all connected rooms
    for (const door of current.doors) {
      const dir = directions.find(d => d.name === door.direction)!;
      const neighborKey = `${current.gridX + dir.dx},${current.gridY + dir.dy}`;
      const neighborId = roomGrid.get(neighborKey);

      if (neighborId !== undefined && !visited.has(neighborId)) {
        visited.add(neighborId);
        rooms[neighborId].distanceFromStart = current.distanceFromStart + 1;
        queue.push(neighborId);
      }
    }
  }

  // Find furthest room for exit
  let furthestRoom = rooms[0];
  for (const room of rooms) {
    if (room.distanceFromStart > furthestRoom.distanceFromStart) {
      furthestRoom = room;
    }
  }

  furthestRoom.type = 'boss';

  // Designate one room as a treasure room (not start or boss)
  const potentialSpecialRooms = rooms.filter(r => r.type === 'normal' && r.id !== 0);
  
  // Need at least 2 special rooms ideally (Treasure + Shop)
  // If we have potential rooms, try to assign them
  if (potentialSpecialRooms.length > 0) {
    // 1. Treasure Room
    const treasureIndex = rng.nextInt(0, potentialSpecialRooms.length - 1);
    const treasureRoom = potentialSpecialRooms[treasureIndex];
    treasureRoom.type = 'treasure';
    
    // Remove from potential list for Shop
    potentialSpecialRooms.splice(treasureIndex, 1);
  }

  if (potentialSpecialRooms.length > 0) {
    // 2. Shop Room
    const shopIndex = rng.nextInt(0, potentialSpecialRooms.length - 1);
    const shopRoom = potentialSpecialRooms[shopIndex];
    shopRoom.type = 'shop';
    console.log(`🏪 Shop assigned to Room ${shopRoom.id} at [${shopRoom.gridX}, ${shopRoom.gridY}]`);
  } else {
    console.warn('⚠️ Could not find a room for Shop!');
  }

  // 3. Distribute Tinted Rocks (0-3 per floor)
  // Initialize counts
  rooms.forEach(r => r.tintedRockCount = 0);
  
  const totalTintedRocks = rng.nextInt(0, 3); // 0 to 3
  const rockCandidates = rooms.filter(r => r.type !== 'start' && r.type !== 'boss'); // Any non-start/boss room can have them
  
  // Distribute randomly
  for (let i = 0; i < totalTintedRocks; i++) {
    if (rockCandidates.length > 0) {
      const roomIndex = rng.nextInt(0, rockCandidates.length - 1);
      const targetRoom = rockCandidates[roomIndex];
      targetRoom.tintedRockCount = (targetRoom.tintedRockCount || 0) + 1;
    }
  }
  console.log(`💎 Distributed ${totalTintedRocks} tinted rocks across floor.`);

  // Initialize enemy spawn data
  // We do this by generating the layout for each room to ensure valid spawn points
  for (const room of rooms) {
    // Determine enemy count based on floor and room type
    if (room.type === 'start' || room.type === 'treasure' || room.type === 'shop') {
      room.enemyCount = 0;
    } else {
      room.enemyCount = Math.min(12, 4 + Math.floor(floorNumber * 1.2));
      if (room.type === 'boss') room.enemyCount += 2; // More enemies in boss room
    }

    // Generate layout to calculate spawn points
    // We pass the floorSeed to ensure consistency
    generateRoomLayout(room, floorNumber, false, floorSeed);
  }

  console.log(`🗺️ Floor ${floorNumber} (Seed: ${floorSeed}): Generated ${rooms.length} rooms`);

  return {
    rooms,
    startRoomId: 0,
    exitRoomId: furthestRoom.id,
    roomCount: rooms.length,
    seed: floorSeed, // Store the seed used for this floor
  };
}

/**
 * Generate the actual tile layout for a specific room.
 * Strictly deterministic based on the provided seed.
 */
export function generateRoomLayout(
  room: Room,
  floorNumber: number,
  isPlayerInRoom: boolean,
  floorSeed?: number
): RoomLayoutData {
  // Use the floor seed if provided, otherwise fallback (should always be provided for consistency)
  const baseSeed = floorSeed !== undefined ? floorSeed : (floorNumber * 12345);
  // Unique seed for this room: combine floor seed with room ID
  const roomSeed = baseSeed + (room.id * 777);
  const rng = new SeededRandom(roomSeed);

  const grid: GridMap = Array(ROOM_SIZE)
    .fill(null)
    .map(() => Array(ROOM_SIZE).fill(1)); // Start with all walls

  // Use Strategy Pattern to generate room interior
  const generator = getRoomGenerator(room.type);
  if (generator) {
    generator(rng, room, grid);
  } else {
    // Fallback if no generator found
    console.warn(`No generator found for room type: ${room.type}, using normal`);
    const fallback = getRoomGenerator('normal');
    fallback?.(rng, room, grid);
  }

  // Determine Rock Pattern
  const patternType = rng.nextInt(0, 4); // 0: Random, 1: Ring, 2: Corners, 3: Cluster
  const rockCount = rng.nextInt(6, 12); // Doubled checks

  const centerX = Math.floor(ROOM_SIZE / 2);
  const centerY = Math.floor(ROOM_SIZE / 2);

  const placedRocks: [number, number][] = [];

  const placeRock = (px: number, py: number) => {
      if (px > 1 && px < ROOM_SIZE - 2 && py > 1 && py < ROOM_SIZE - 2) {
          if (grid[py][px] === 0 && (px !== centerX || py !== centerY)) {
              grid[py][px] = 9; // Place Normal Rock
              placedRocks.push([px, py]);
          }
      }
  };

  if (patternType === 0) {
      // Random Scatter (High Density)
      for (let i = 0; i < rockCount; i++) {
        let x, y;
        let attempts = 0;
        do {
          x = rng.nextInt(2, ROOM_SIZE - 3);
          y = rng.nextInt(2, ROOM_SIZE - 3);
          attempts++;
        } while (grid[y][x] !== 0 && attempts < 10);
        placeRock(x, y);
      }
  } else if (patternType === 1) {
      // Ring Pattern
      const radius = rng.nextInt(3, 5);
      const steps = 8;
      for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const x = Math.round(centerX + Math.cos(angle) * radius);
          const y = Math.round(centerY + Math.sin(angle) * radius);
          placeRock(x, y);
      }
  } else if (patternType === 2) {
      // Corners of inner room
      const offset = 4;
      placeRock(centerX - offset, centerY - offset);
      placeRock(centerX + offset, centerY - offset);
      placeRock(centerX - offset, centerY + offset);
      placeRock(centerX + offset, centerY + offset);
      // Add a few random ones too
       for (let i = 0; i < 4; i++) {
           placeRock(rng.nextInt(3, ROOM_SIZE-4), rng.nextInt(3, ROOM_SIZE-4));
       }
  } else {
      // Central Cluster/Cross
      placeRock(centerX + 2, centerY);
      placeRock(centerX - 2, centerY);
      placeRock(centerX, centerY + 2);
      placeRock(centerX, centerY - 2);
      placeRock(centerX + 2, centerY + 2);
      placeRock(centerX - 2, centerY - 2);
      placeRock(centerX + 2, centerY - 2);
      placeRock(centerX + 2, centerY - 2);
      placeRock(centerX - 2, centerY + 2);
  }

  // Upgrade rocks to Tinted Rocks based on room budget
  if (room.tintedRockCount && room.tintedRockCount > 0 && placedRocks.length > 0) {
      // Shuffle candidates (Fisher-Yates via rng not available? `rng.shuffle` exists!)
      // Wait, `rng.shuffle` returns a new array or shuffles in place?
      // `floorGen.ts` line 71: `rng.shuffle(directions)`.
      // Let's assume it works.
      const candidates = rng.shuffle([...placedRocks]);
      const count = Math.min(room.tintedRockCount, candidates.length);
      
      for(let i=0; i<count; i++) {
          const [rx, ry] = candidates[i];
          grid[ry][rx] = 11; // Upgrade to Tinted Rock
      }
  }

  // Place Pillars (Indestructible cover)
  const pillarCount = rng.nextInt(1, 4);
  for (let i = 0; i < pillarCount; i++) {
        let x, y;
        let attempts = 0;
        do {
          x = rng.nextInt(2, ROOM_SIZE - 3);
          y = rng.nextInt(2, ROOM_SIZE - 3);
          attempts++;
        } while (grid[y][x] !== 0 && attempts < 20);

        if (grid[y][x] === 0) {
            grid[y][x] = 13; // Pillar
        }
  }

  // Place Torches (Light sources)
  const torchCount = rng.nextInt(1, 3);
  for (let i = 0; i < torchCount; i++) {
        let x, y;
        let attempts = 0;
        do {
          x = rng.nextInt(2, ROOM_SIZE - 3);
          y = rng.nextInt(2, ROOM_SIZE - 3);
          attempts++;
        } while (grid[y][x] !== 0 && attempts < 20);

        if (grid[y][x] === 0) {
            grid[y][x] = 14; // Torch
        }
  }

  // Place Grass Patches (Decoration)
  // Grass doesn't block movement, but we track it as tile 12. 
  // IMPORTANT: Since grass is walkable, we need to decide if it overwrites 0 or if we render it on top.
  // The current GridMap renders based on tile ID. If tile is 12, it renders Grass. 
  // But GridMap MergedFloor logic treats !8 as floor. So 12 will be floor.
  // RigidBody logic: Wall, Rock, Crate have RigidBody. Grass does not have RigidBody in my implementation?
  // No, Grass component creates a group. It does NOT have a RigidBody in my implementation above. 
  // However, GridMap.tsx calculates floor physics based on `isFloor`. `const isFloor = grid[y][x] !== 8;`.
  // So a tile 12 will generate a floor collider underneath.
  // But we need to make sure we don't spawn enemies on top of grass if we treat grass as occupied?
  // Enemy spawn check: `if (grid[y][x] !== 0) continue;`
  // So if I set tile to 12, enemies won't spawn there. That's fine, maybe preferred.
  
  // Place Grass Patches (Decoration)
  const grassClumps = rng.nextInt(3, 6);
  for (let i = 0; i < grassClumps; i++) {
        // ... (existing grass loop logic)
      const cx = rng.nextInt(2, ROOM_SIZE - 3);
      const cy = rng.nextInt(2, ROOM_SIZE - 3);
      const size = rng.nextInt(2, 5);
      
      for(let j=0; j<size; j++) {
          const ox = rng.nextInt(-1, 2);
          const oy = rng.nextInt(-1, 2);
          const gx = cx + ox;
          const gy = cy + oy;
          if (gx > 1 && gx < ROOM_SIZE - 2 && gy > 1 && gy < ROOM_SIZE - 2) {
              if (grid[gy][gx] === 0) {
                  // 50% chance to place grass
                  if (rng.next() > 0.5) grid[gy][gx] = 12;
              }
          }
      }
  }

  // Place Flowers (Decoration)
  const flowerClumps = rng.nextInt(2, 5);
  for (let i = 0; i < flowerClumps; i++) {
      const cx = rng.nextInt(2, ROOM_SIZE - 3);
      const cy = rng.nextInt(2, ROOM_SIZE - 3);
      const size = rng.nextInt(1, 4);
      
      for(let j=0; j<size; j++) {
          const ox = rng.nextInt(-1, 2);
          const oy = rng.nextInt(-1, 2);
          const fx = cx + ox;
          const fy = cy + oy;
          if (fx > 1 && fx < ROOM_SIZE - 2 && fy > 1 && fy < ROOM_SIZE - 2) {
              if (grid[fy][fx] === 0) {
                   grid[fy][fx] = 15; // Flower
              }
          }
      }
  }

  // Place Mushrooms (Decoration - prefers edges/corners? No, random patches is fine)
  const mushroomClumps = rng.nextInt(2, 4);
  for (let i = 0; i < mushroomClumps; i++) {
      const cx = rng.nextInt(2, ROOM_SIZE - 3);
      const cy = rng.nextInt(2, ROOM_SIZE - 3);
      const size = rng.nextInt(2, 5);
      
      for(let j=0; j<size; j++) {
          const ox = rng.nextInt(-1, 2);
          const oy = rng.nextInt(-1, 2);
          const mx = cx + ox;
          const my = cy + oy;
          if (mx > 1 && mx < ROOM_SIZE - 2 && my > 1 && my < ROOM_SIZE - 2) {
              if (grid[my][mx] === 0) {
                   grid[my][mx] = 16; // Mushroom
              }
          }
      }
  }

  // Place Pebbles (Decoration - scattered)
  const pebbleCount = rng.nextInt(5, 15);
  for (let i = 0; i < pebbleCount; i++) {
      const x = rng.nextInt(2, ROOM_SIZE - 3);
      const y = rng.nextInt(2, ROOM_SIZE - 3);
      if (grid[y][x] === 0) {
          grid[y][x] = 17; // Pebble
      }
  }

  // Place breakable crates
  const crateCount = rng.nextInt(1, 3);
  for (let i = 0; i < crateCount; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = rng.nextInt(2, ROOM_SIZE - 3);
      y = rng.nextInt(2, ROOM_SIZE - 3);
      attempts++;
    } while ((grid[y][x] !== 0 || (x === Math.floor(ROOM_SIZE/2) && y === Math.floor(ROOM_SIZE/2))) && attempts < 20);

    if (grid[y][x] === 0) {
      grid[y][x] = 10; // Crate
    }
  }

  // Add doors - clear walls in a 3-wide corridor from door to center
  for (const door of room.doors) {
    const doorPos = Math.floor(ROOM_SIZE / 2); // Center of edge
    const centerPos = Math.floor(ROOM_SIZE / 2); // Center of room
    const doorTile = door.locked ? 6 : 5;

    if (door.direction === 'north') {
      // Clear corridor from north edge to center (3 tiles wide)
      for (let y = 0; y <= centerPos; y++) {
        grid[y][doorPos - 1] = 0;
        grid[y][doorPos] = (y === 0) ? doorTile : 0;
        grid[y][doorPos + 1] = 0;
      }
    } else if (door.direction === 'south') {
      // Clear corridor from south edge to center (3 tiles wide)
      for (let y = centerPos; y < ROOM_SIZE; y++) {
        grid[y][doorPos - 1] = 0;
        grid[y][doorPos] = (y === ROOM_SIZE - 1) ? doorTile : 0;
        grid[y][doorPos + 1] = 0;
      }
    } else if (door.direction === 'east') {
      // Clear corridor from east edge to center (3 tiles wide)
      for (let x = centerPos; x < ROOM_SIZE; x++) {
        grid[doorPos - 1][x] = 0;
        grid[doorPos][x] = (x === ROOM_SIZE - 1) ? doorTile : 0;
        grid[doorPos + 1][x] = 0;
      }
    } else if (door.direction === 'west') {
      // Clear corridor from west edge to center (3 tiles wide)
      for (let x = 0; x <= centerPos; x++) {
        grid[doorPos - 1][x] = 0;
        grid[doorPos][x] = (x === 0) ? doorTile : 0;
        grid[doorPos + 1][x] = 0;
      }
    }
  }

  const playerGridX = Math.floor(ROOM_SIZE / 2);
  const playerGridY = Math.floor(ROOM_SIZE / 2);

  // Calculate enemy spawn points (only if not already calculated)
  // We do this here to ensure they are on valid floor tiles
  if (room.enemySpawnPoints.length === 0 && room.enemyCount > 0) {
    const MIN_DISTANCE_FROM_PLAYER = 5;
    const spawnPoints: [number, number][] = [];

    let attempts = 0;
    const MAX_ATTEMPTS = 200;
    
    // Try to place all enemies
    while (spawnPoints.length < room.enemyCount && attempts < MAX_ATTEMPTS) {
      attempts++;
      const x = rng.nextInt(1, ROOM_SIZE - 2);
      const y = rng.nextInt(1, ROOM_SIZE - 2);

      // Check if tile is walkable (0)
      if (grid[y][x] !== 0) continue;

      // Check distance from player (start position)
      const distX = Math.abs(x - playerGridX);
      const distY = Math.abs(y - playerGridY);
      const distance = Math.max(distX, distY);

      if (distance < MIN_DISTANCE_FROM_PLAYER) continue;

      // Check distance from other enemies to avoid stacking
      let tooClose = false;
      for (const [ex, ey] of spawnPoints) {
        if (Math.abs(x - ex) < 2 && Math.abs(y - ey) < 2) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Valid spawn
      spawnPoints.push([x, y]);
    }

    // Update room data with valid points
    room.enemySpawnPoints = spawnPoints;
    room.enemyCount = spawnPoints.length; // Update count if we couldn't place all
  }

  // Place enemy spawn markers on grid (for visualization/debug)
  for (const [x, y] of room.enemySpawnPoints) {
    if (grid[y][x] === 0) {
      grid[y][x] = 2; // Enemy spawn marker
    }
  }

  const enemyCount = isPlayerInRoom ? room.enemyCount : 0;

  // Place loot spawns
  const lootSpawns = 2 + Math.floor(floorNumber / 3);
  for (let i = 0; i < lootSpawns; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = rng.nextInt(1, ROOM_SIZE - 2);
      y = rng.nextInt(1, ROOM_SIZE - 2);
      attempts++;
    } while ((grid[y][x] !== 0 || (x === playerGridX && y === playerGridY)) && attempts < 50);

    if (grid[y][x] === 0) {
      grid[y][x] = 3; // Loot spawn
    }
  }

  // Place exit portal only in exit room
  let exitPosition: [number, number] | undefined;
  if (room.type === 'boss') {
    let exitX = playerGridX;
    let exitY = playerGridY;
    let maxDistance = 0;

    for (let y = 0; y < ROOM_SIZE; y++) {
      for (let x = 0; x < ROOM_SIZE; x++) {
        if (grid[y][x] === 0) {
          const distX = x - playerGridX;
          const distY = y - playerGridY;
          const distance = Math.sqrt(distX * distX + distY * distY);

          if (distance > maxDistance) {
            maxDistance = distance;
            exitX = x;
            exitY = y;
          }
        }
      }
    }

    if (grid[exitY][exitX] === 0) {
      grid[exitY][exitX] = 4; // Exit portal
      exitPosition = [exitX, exitY];
    }
  }

  // Helper to place a clump of hazards
  const placeHazardClump = (tileType: 7 | 8, totalCount: number, minClumpSize: number, maxClumpSize: number) => {
    let remaining = totalCount;
    let safetyBreaker = 0;

    while (remaining > 0 && safetyBreaker < 100) {
      safetyBreaker++;
      
      // 1. Pick a random start seed
      let startX, startY;
      let attempts = 0;
      do {
        startX = rng.nextInt(1, ROOM_SIZE - 2);
        startY = rng.nextInt(1, ROOM_SIZE - 2);
        attempts++;
      } while (
        (grid[startY][startX] !== 0 || (startX === playerGridX && startY === playerGridY)) && 
        attempts < 50
      );

      if (grid[startY][startX] !== 0) continue; // Failed to find start

      // 2. Grow clump
      const clumpSize = Math.min(remaining, rng.nextInt(minClumpSize, maxClumpSize));
      const candidates: [number, number][] = [[startX, startY]];
      const clumpTiles: [number, number][] = [];

      // Add start to grid immediately
      grid[startY][startX] = tileType;
      clumpTiles.push([startX, startY]);
      remaining--;
      
      let currentClumpCount = 1;

      while (currentClumpCount < clumpSize && candidates.length > 0) {
        // Pick random candidate to grow from (makes it irregular)
        const randIndex = rng.nextInt(0, candidates.length - 1);
        const [cx, cy] = candidates[randIndex];
        
        // Try all neighbors
        const neighbors = [
          [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
        ];
        
        // Shuffle neighbors for randomness
        const shuffled = rng.shuffle(neighbors);
        
        let grew = false;
        for (const [nx, ny] of shuffled) {
          if (
            nx > 0 && nx < ROOM_SIZE - 1 && 
            ny > 0 && ny < ROOM_SIZE - 1 &&
            grid[ny][nx] === 0 && // Must be empty floor
            !(nx === playerGridX && ny === playerGridY) // Not player start
          ) {
            grid[ny][nx] = tileType;
            candidates.push([nx, ny]);
            clumpTiles.push([nx, ny]);
            currentClumpCount++;
            remaining--;
            grew = true;
            if (currentClumpCount >= clumpSize) break;
          }
        }
        
        if (!grew) {
          // If couldn't grow from here, remove from candidates
          candidates.splice(randIndex, 1);
        }
      }
    }
  };

  // Place Spikes (Environmental Hazards) - Clumped
  // Base count increases with floor number: 10 base + floor * 2
  const spikeCount = Math.floor(10 + floorNumber * 2);
  const actualSpikeCount = Math.min(spikeCount, 25); // Increased cap for clumps
  placeHazardClump(7, actualSpikeCount, 3, 6);

  // Place Pits (Pitfalls) - Clumped
  // Base count increases with floor number: 5 base + floor
  const pitCount = Math.floor(5 + floorNumber);
  const actualPitCount = Math.min(pitCount, 20);
  placeHazardClump(8, actualPitCount, 2, 5);

  // Calculate world offset for this room
  const worldOffset: [number, number, number] = [
    room.gridX * ROOM_WORLD_SIZE,
    0,
    room.gridY * ROOM_WORLD_SIZE,
  ];

  return {
    grid,
    worldOffset,
    exitPosition,
    enemyCount,
  };
}

/**
 * Get the world position for a grid coordinate within a room
 */
export function gridToWorld(
  gridX: number,
  gridY: number,
  worldOffset: [number, number, number]
): [number, number, number] {
  const tileSize = ROOM_WORLD_SIZE / ROOM_SIZE;
  const offset = -ROOM_WORLD_SIZE / 2 + tileSize / 2;

  return [
    worldOffset[0] + offset + gridX * tileSize,
    worldOffset[1],
    worldOffset[2] + offset + gridY * tileSize,
  ];
}

/**
 * Get room size in world units
 */
export function getRoomWorldSize(): number {
  return ROOM_WORLD_SIZE;
}

/**
 * Generate a single fixed room for testing/scenarios.
 */
function generateTestFloor(seed: number, type: 'normal' | 'boss'): FloorData {
  const rooms: Room[] = [];
  const room: Room = {
    id: 0,
    gridX: 0,
    gridY: 0,
    type: type,
    doors: [],
    distanceFromStart: 0,
    enemySpawnPoints: [],
    enemyCount: 0,
    tintedRockCount: 0
  };
  
  // Predictable spawn points for test
  if (type === 'boss') {
    room.enemyCount = 1; // Just the boss
    // Boss spawns in center usually? Or specific point? 
    // Handled by generateBossRoom logic or simple override.
    // generateBossRoom spawns boss at center (likely).
  } else {
    room.enemyCount = 1; // One dummy enemy
  }
  
  // We need to run layout generation to populate grid/spawn points
  generateRoomLayout(room, 1, false, seed);
  
  // Force override spawn points for deterministic E2E check if desired
  // But seeding should handle it.
  
  rooms.push(room);

  return {
    rooms,
    startRoomId: 0,
    exitRoomId: 0,
    roomCount: 1,
    seed: seed,
  };
}
