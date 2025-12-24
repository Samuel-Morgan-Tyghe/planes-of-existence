export type TileType = 0 | 1 | 2 | 3;
// 0 = Floor (walkable)
// 1 = Wall (obstacle)
// 2 = Enemy spawn
// 3 = Loot/Upgrade spawn

export type GridMap = TileType[][];

const GRID_SIZE = 20; // 20x20 grid

/**
 * Generate a procedural level using a simple room-based approach
 */
export function generateLevel(): GridMap {
  const grid: GridMap = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(1)); // Start with all walls

  // Create a simple room in the center
  const roomSize = 8;
  const roomStartX = Math.floor((GRID_SIZE - roomSize) / 2);
  const roomStartY = Math.floor((GRID_SIZE - roomSize) / 2);

  // Clear the room
  for (let y = roomStartY; y < roomStartY + roomSize; y++) {
    for (let x = roomStartX; x < roomStartX + roomSize; x++) {
      grid[y][x] = 0; // Floor
    }
  }

  // Add some corridors
  // Horizontal corridor
  const corridorY = Math.floor(GRID_SIZE / 2);
  for (let x = 0; x < GRID_SIZE; x++) {
    if (grid[corridorY][x] === 1) {
      grid[corridorY][x] = 0;
    }
  }

  // Vertical corridor
  const corridorX = Math.floor(GRID_SIZE / 2);
  for (let y = 0; y < GRID_SIZE; y++) {
    if (grid[y][corridorX] === 1) {
      grid[y][corridorX] = 0;
    }
  }

  // Add some random rooms
  const numRooms = 3;
  for (let i = 0; i < numRooms; i++) {
    const roomX = Math.floor(Math.random() * (GRID_SIZE - 4));
    const roomY = Math.floor(Math.random() * (GRID_SIZE - 4));
    const roomW = 3 + Math.floor(Math.random() * 3);
    const roomH = 3 + Math.floor(Math.random() * 3);

    for (let y = roomY; y < roomY + roomH && y < GRID_SIZE; y++) {
      for (let x = roomX; x < roomX + roomW && x < GRID_SIZE; x++) {
        if (grid[y][x] === 1) {
          grid[y][x] = 0;
        }
      }
    }
  }

  // Place enemy spawns (avoid center where player starts)
  const enemySpawns = 5;
  for (let i = 0; i < enemySpawns; i++) {
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
      attempts++;
    } while (
      (grid[y][x] !== 0 || 
       (x >= roomStartX - 2 && x < roomStartX + roomSize + 2 &&
        y >= roomStartY - 2 && y < roomStartY + roomSize + 2)) &&
      attempts < 50
    );
    
    if (grid[y][x] === 0) {
      grid[y][x] = 2; // Enemy spawn
    }
  }

  // Place loot spawns
  const lootSpawns = 3;
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

  return grid;
}

/**
 * Get the world position for a grid coordinate
 */
export function gridToWorld(gridX: number, gridY: number, gridSize: number = GRID_SIZE): [number, number, number] {
  const worldSize = 40; // Total world size in units
  const tileSize = worldSize / gridSize;
  const offset = -worldSize / 2 + tileSize / 2;
  
  return [
    offset + gridX * tileSize,
    0,
    offset + gridY * tileSize,
  ];
}

