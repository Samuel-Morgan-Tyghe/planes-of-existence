import type { FloorData, GridMap, Room, RoomLayoutData } from '../types/room';

const ROOM_SIZE = 20; // Each room is 20x20 tiles
const ROOM_WORLD_SIZE = 40; // Each room is 40 units in world space

/**
 * Seeded random number generator (using mulberry32)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

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
 * Generate a floor with multiple connected rooms
 */
export function generateFloor(floorNumber: number): FloorData {
  // Create seeded RNG for this floor
  const rng = new SeededRandom(floorNumber * 12345);

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
    enemySpawnPoints: [], // Will be calculated later
    enemyCount: 0, // Will be calculated later
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
          enemySpawnPoints: [], // Will be calculated later
          enemyCount: 0, // Will be calculated later
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

  // Initialize enemy spawn data (will be calculated when room layout is generated)
  for (const room of rooms) {
    room.enemySpawnPoints = [];
    room.enemyCount = room.type === 'start' ? 0 : Math.min(12, 4 + Math.floor(floorNumber * 1.2));
    
    // Pre-calculate layout and spawn points immediately
    // We pass isPlayerInRoom=false because we just want to generate the data
    generateRoomLayout(room, floorNumber, false);
  }

  console.log(`🗺️ Floor ${floorNumber}: Generated ${rooms.length} rooms`);
  console.log(`  Start room at (${rooms[0].gridX}, ${rooms[0].gridY})`);
  console.log(`  Exit room at (${furthestRoom.gridX}, ${furthestRoom.gridY}), distance: ${furthestRoom.distanceFromStart}`);

  // Log total enemy count
  const totalEnemies = rooms.reduce((sum, room) => sum + room.enemyCount, 0);
  console.log(`  Total enemies on floor: ${totalEnemies}`);
  rooms.forEach(room => {
    if (room.enemyCount > 0) {
      console.log(`    Room ${room.id} (${room.type}): ${room.enemyCount} enemies`);
    }
  });

  return {
    rooms,
    startRoomId: 0,
    exitRoomId: furthestRoom.id,
    roomCount: rooms.length,
  };
}

/**
 * Generate the actual tile layout for a specific room
 */
export function generateRoomLayout(
  room: Room,
  floorNumber: number,
  isPlayerInRoom: boolean
): RoomLayoutData {
  // Create seeded RNG for this specific room
  const rng = new SeededRandom(floorNumber * 12345 + room.id * 67890);

  const grid: GridMap = Array(ROOM_SIZE)
    .fill(null)
    .map(() => Array(ROOM_SIZE).fill(1)); // Start with all walls

  // Create room interior (leave walls on edges for doors)
  const roomType = room.id % 4;

  if (roomType === 0) {
    // Square room
    const roomSize = 14;
    const startX = Math.floor((ROOM_SIZE - roomSize) / 2);
    const startY = Math.floor((ROOM_SIZE - roomSize) / 2);
    for (let y = startY; y < startY + roomSize; y++) {
      for (let x = startX; x < startX + roomSize; x++) {
        grid[y][x] = 0;
      }
    }
  } else if (roomType === 1) {
    // L-shaped room
    for (let y = 4; y < 16; y++) {
      for (let x = 4; x < 12; x++) {
        grid[y][x] = 0;
      }
    }
    for (let y = 10; y < 16; y++) {
      for (let x = 12; x < 16; x++) {
        grid[y][x] = 0;
      }
    }
  } else if (roomType === 2) {
    // Cross-shaped room
    for (let y = 2; y < 18; y++) {
      for (let x = 8; x < 12; x++) {
        grid[y][x] = 0;
      }
    }
    for (let y = 8; y < 12; y++) {
      for (let x = 2; x < 18; x++) {
        grid[y][x] = 0;
      }
    }
  } else {
    // Room with pillars
    for (let y = 3; y < 17; y++) {
      for (let x = 3; x < 17; x++) {
        grid[y][x] = 0;
      }
    }
    grid[7][7] = 1;
    grid[7][12] = 1;
    grid[12][7] = 1;
    grid[12][12] = 1;
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

  // Calculate enemy spawn points (only once if not already calculated)
  // This is now primarily handled by the pre-calculation in generateFloor
  if (room.enemySpawnPoints.length === 0 && room.enemyCount > 0) {
    const MIN_DISTANCE_FROM_PLAYER = 5;
    const spawnPoints: [number, number][] = [];

    let attempts = 0;
    const MAX_ATTEMPTS = 100;
    for (let i = 0; i < room.enemyCount && attempts < MAX_ATTEMPTS; attempts++) {
      const x = rng.nextInt(1, ROOM_SIZE - 2); // Avoid edges
      const y = rng.nextInt(1, ROOM_SIZE - 2);

      const distX = Math.abs(x - playerGridX);
      const distY = Math.abs(y - playerGridY);
      const distance = Math.max(distX, distY);

      // Check if tile is walkable (0) and far enough from player
      // IMPORTANT: Ensure we are checking the grid we just generated/modified
      if (grid[y][x] === 0 && distance >= MIN_DISTANCE_FROM_PLAYER) {
        spawnPoints.push([x, y]);
        i++;
      } else {
        // console.log(`⚠️ Rejected spawn at ${x},${y} (Tile: ${grid[y][x]}, Dist: ${distance})`);
      }
    }

    // Store calculated spawn points in room data
    room.enemySpawnPoints = spawnPoints;
    room.enemyCount = spawnPoints.length;
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
      x = rng.nextInt(0, ROOM_SIZE - 1);
      y = rng.nextInt(0, ROOM_SIZE - 1);
      attempts++;
    } while (grid[y][x] !== 0 && attempts < 50);

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
      console.log(`🌀 Exit portal placed in room ${room.id}`);
    }
  }

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
