export type TileType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
// 0 = Floor (walkable)
// 1 = Wall (obstacle)
// 2 = Enemy spawn
// 3 = Loot/Upgrade spawn
// 4 = Exit portal (to next floor)
// 5 = Door (open, connects rooms)
// 6 = Locked door (requires key)
// 7 = Environmental Hazard (Spikes)
// 8 = Pitfall (hole in the ground)
// 9 = Rock (obstacle)
// 10 = Crate (breakable)

export type GridMap = TileType[][];

export interface Room {
  id: number;
  gridX: number; // Position in room grid
  gridY: number;
  type: 'start' | 'normal' | 'exit' | 'boss' | 'treasure';
  doors: { direction: 'north' | 'south' | 'east' | 'west'; locked: boolean }[];
  distanceFromStart: number; // For pathfinding
  enemySpawnPoints: [number, number][]; // Grid positions for enemy spawns (calculated at floor generation)
  enemyCount: number; // Number of enemies to spawn in this room
}

export interface FloorData {
  rooms: Room[];
  startRoomId: number;
  exitRoomId: number;
  roomCount: number;
  seed: number;
}

export interface RoomLayoutData {
  grid: GridMap;
  worldOffset: [number, number, number]; // Offset for this room in world space
  exitPosition?: [number, number]; // Only set for exit room
  enemyCount: number;
}
