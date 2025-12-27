export type TileType = 0 | 1 | 2 | 3 | 4;
// 0 = Floor (walkable)
// 1 = Wall (obstacle)
// 2 = Enemy spawn
// 3 = Loot/Upgrade spawn
// 4 = Exit portal (to next room)

export type GridMap = TileType[][];

const GRID_SIZE = 30; // Single room at a time (1.5x larger: 20 * 1.5 = 30)

export interface RoomData {
  grid: GridMap;
  exitPosition: [number, number]; // Grid position of exit portal
  enemyCount: number; // Number of enemies to spawn
}

/**
 * Generate a single room layout for the current level
 */
export function generateRoom(roomNumber: number): RoomData {
  const grid: GridMap = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(1)); // Start with all walls

  // Create different room shapes based on room number
  const roomType = roomNumber % 4;

  if (roomType === 0) {
    // Square room (scaled 1.5x: 12 * 1.5 = 18)
    const roomSize = 18;
    const startX = Math.floor((GRID_SIZE - roomSize) / 2);
    const startY = Math.floor((GRID_SIZE - roomSize) / 2);
    for (let y = startY; y < startY + roomSize; y++) {
      for (let x = startX; x < startX + roomSize; x++) {
        grid[y][x] = 0;
      }
    }
  } else if (roomType === 1) {
    // L-shaped room (scaled 1.5x)
    for (let y = 6; y < 24; y++) {
      for (let x = 6; x < 18; x++) {
        grid[y][x] = 0;
      }
    }
    for (let y = 15; y < 24; y++) {
      for (let x = 18; x < 24; x++) {
        grid[y][x] = 0;
      }
    }
  } else if (roomType === 2) {
    // Cross-shaped room (scaled 1.5x)
    // Vertical bar
    for (let y = 3; y < 27; y++) {
      for (let x = 12; x < 18; x++) {
        grid[y][x] = 0;
      }
    }
    // Horizontal bar
    for (let y = 12; y < 18; y++) {
      for (let x = 3; x < 27; x++) {
        grid[y][x] = 0;
      }
    }
  } else {
    // Room with pillars (scaled 1.5x)
    for (let y = 5; y < 25; y++) {
      for (let x = 5; x < 25; x++) {
        grid[y][x] = 0;
      }
    }
    // Add pillars
    grid[10][10] = 1;
    grid[10][18] = 1;
    grid[18][10] = 1;
    grid[18][18] = 1;
  }

  const playerGridX = Math.floor(GRID_SIZE / 2);
  const playerGridY = Math.floor(GRID_SIZE / 2);

  // Enemy count scales with room number
  const enemyCount = Math.min(15, 5 + Math.floor(roomNumber * 1.5));

  // Place enemy spawn markers
  const MIN_DISTANCE_FROM_PLAYER = 5;
  let spawnedEnemies = 0;
  for (let i = 0; i < enemyCount * 3 && spawnedEnemies < enemyCount; i++) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);

    const distX = Math.abs(x - playerGridX);
    const distY = Math.abs(y - playerGridY);
    const distance = Math.max(distX, distY);

    if (grid[y][x] === 0 && distance >= MIN_DISTANCE_FROM_PLAYER) {
      grid[y][x] = 2; // Enemy spawn
      spawnedEnemies++;
    }
  }

  // Place loot spawns
  const lootSpawns = 3 + Math.floor(roomNumber / 3);
  for (let i = 0; i < lootSpawns; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
      attempts++;
    } while (grid[y][x] !== 0 && attempts < 50);

    if (grid[y][x] === 0) {
      grid[y][x] = 3; // Loot spawn
    }
  }

  // Place exit portal in the furthest walkable tile from player spawn
  let exitX = playerGridX;
  let exitY = playerGridY;
  let maxDistance = 0;

  // Scan all floor tiles to find the furthest one
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 0) {
        // Calculate Euclidean distance (more accurate than Chebyshev)
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

  // Place the portal at the furthest location
  if (grid[exitY][exitX] === 0) {
    grid[exitY][exitX] = 4; // Exit portal
    console.log(`🌀 Portal placed at grid (${exitX}, ${exitY}), distance ${maxDistance.toFixed(2)} from player`);
  }

  return {
    grid,
    exitPosition: [exitX, exitY],
    enemyCount,
  };
}

/**
 * Legacy function for backwards compatibility
 */
export function generateLevel(): GridMap {
  return generateRoom(0).grid;
}

/**
 * Get the world position for a grid coordinate
 */
export function gridToWorld(gridX: number, gridY: number, gridSize: number = GRID_SIZE): [number, number, number] {
  const worldSize = 60; // Total world size in units for 30x30 grid (1.5x larger: 40 * 1.5 = 60)
  const tileSize = worldSize / gridSize;
  const offset = -worldSize / 2 + tileSize / 2;

  return [
    offset + gridX * tileSize,
    0,
    offset + gridY * tileSize,
  ];
}

/**
 * Get the total world size (for floor plane, etc.)
 */
export function getWorldSize(): number {
  return 60; // Match the worldSize in gridToWorld (1.5x larger)
}

