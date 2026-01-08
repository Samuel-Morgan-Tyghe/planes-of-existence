import { RoomGenerator } from '../types';

export const generateTreasureRoom: RoomGenerator = (_rng, _room, grid) => {
  const ROOM_SIZE = grid.length;
  
  // Treasure Room: Octagon/Clipped Corners
  for (let y = 3; y < ROOM_SIZE - 3; y++) {
    for (let x = 3; x < ROOM_SIZE - 3; x++) {
      const distToCenter = Math.sqrt(Math.pow(x - (ROOM_SIZE/2), 2) + Math.pow(y - (ROOM_SIZE/2), 2));
      if (distToCenter < 7) grid[y][x] = 0;
    }
  }
};
