import { RoomGenerator } from '../types';

export const generateNormalRoom: RoomGenerator = (rng, room, grid) => {
  const ROOM_SIZE = grid.length;
  
  // Determine variation based on room ID (deterministic)
  const roomType = room.id % 4;

  if (roomType === 0) {
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
};
