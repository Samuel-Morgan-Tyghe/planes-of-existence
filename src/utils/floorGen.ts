import type { FloorData, GridMap, Room, RoomLayoutData } from '../types/room';

const ROOM_SIZE = 30; // Each room is 30x30 tiles
const ROOM_WORLD_SIZE = 60; // Each room is 60 units in world space

/**
 * Seeded random number generator (Mulberry32)
 * Provides deterministic random numbers based on a seed.
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Returns a random number between 0 (inclusive) and 1 (exclusive).
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm.
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Generate a floor with multiple connected rooms.
 * Strictly deterministic based on the provided seed.
 */
export function generateFloor(floorNumber: number, seed: number = 12345): FloorData {
  // Combine floor number and master seed for unique floor seeds
  const floorSeed = seed + (floorNumber * 99999);
  const rng = new SeededRandom(floorSeed);

  // Random number of rooms (4-10)
  const roomCount = rng.nextInt(4, 10);

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
  const potentialTreasureRooms = rooms.filter(r => r.type === 'normal' && r.id !== 0);
  if (potentialTreasureRooms.length > 0) {
    const treasureRoom = potentialTreasureRooms[rng.nextInt(0, potentialTreasureRooms.length - 1)];
    treasureRoom.type = 'treasure';
  }

  // Initialize enemy spawn data
  // We do this by generating the layout for each room to ensure valid spawn points
  for (const room of rooms) {
    // Determine enemy count based on floor and room type
    if (room.type === 'start' || room.type === 'treasure') {
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

  // Create room interior (leave walls on edges for doors)
  // Room shape is deterministic based on room ID
  const roomType = room.id % 4;

  if (room.type === 'boss') {
    // Boss Arena: Large open square
    for (let y = 1; y < ROOM_SIZE - 1; y++) {
      for (let x = 1; x < ROOM_SIZE - 1; x++) {
        grid[y][x] = 0;
      }
    }
    // Add 4 large decorative/strategic pillars
    const centerX = Math.floor(ROOM_SIZE / 2);
    const centerY = Math.floor(ROOM_SIZE / 2);
    const pOffset = Math.floor(ROOM_SIZE / 5);
    
    [centerX - pOffset, centerX + pOffset].forEach(cx => {
      [centerY - pOffset, centerY + pOffset].forEach(cy => {
        // 2x2 pillar
        grid[cy][cx] = 9;
        grid[cy+1][cx] = 9;
        grid[cy][cx+1] = 9;
        grid[cy+1][cx+1] = 9;
      });
    });
  } else if (room.type === 'treasure') {
     // Treasure Room: Octagon/Clipped Corners
     for (let y = 3; y < ROOM_SIZE - 3; y++) {
       for (let x = 3; x < ROOM_SIZE - 3; x++) {
         const distToCenter = Math.sqrt(Math.pow(x - (ROOM_SIZE/2), 2) + Math.pow(y - (ROOM_SIZE/2), 2));
         if (distToCenter < 7) grid[y][x] = 0;
       }
     }
  } else if (roomType === 0) {
    // Square room
    const roomSize = rng.nextInt(10, 16); 
    const startX = Math.floor((ROOM_SIZE - roomSize) / 2);
    const startY = Math.floor((ROOM_SIZE - roomSize) / 2);
    for (let y = startY; y < startY + roomSize; y++) {
      for (let x = startX; x < startX + roomSize; x++) {
        grid[y][x] = 0;
      }
    }
  } else if (roomType === 1) {
    // L-shaped room (Refined)
    for (let y = 3; y < 17; y++) {
      for (let x = 3; x < 12; x++) grid[y][x] = 0;
    }
    for (let y = 10; y < 17; y++) {
      for (let x = 12; x < 17; x++) grid[y][x] = 0;
    }
  } else if (roomType === 2) {
    // Cross-shaped room (Refined)
    for (let y = 2; y < 18; y++) {
      for (let x = 7; x < 13; x++) grid[y][x] = 0;
    }
    for (let y = 7; y < 13; y++) {
      for (let x = 2; x < 18; x++) grid[y][x] = 0;
    }
  } else {
    // Spacious room with pillars
    for (let y = 2; y < 18; y++) {
      for (let x = 2; x < 18; x++) {
        grid[y][x] = 0;
      }
    }
    grid[6][6] = 1;
    grid[6][13] = 1;
    grid[13][6] = 1;
    grid[13][13] = 1;
  }



  // Determine Rock Pattern
  const patternType = rng.nextInt(0, 4); // 0: Random, 1: Ring, 2: Corners, 3: Cluster
  const rockCount = rng.nextInt(6, 12); // Doubled checks

  const centerX = Math.floor(ROOM_SIZE / 2);
  const centerY = Math.floor(ROOM_SIZE / 2);

  const placeRock = (px: number, py: number) => {
      if (px > 1 && px < ROOM_SIZE - 2 && py > 1 && py < ROOM_SIZE - 2) {
          if (grid[py][px] === 0 && (px !== centerX || py !== centerY)) {
              // 15% chance for a Secret Rock (Tile 11)
              const isSecret = rng.next() < 0.15;
              grid[py][px] = isSecret ? 11 : 9; 
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
      placeRock(centerX - 2, centerY + 2);
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
