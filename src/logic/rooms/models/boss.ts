import { RoomGenerator } from '../types';

export const generateBossRoom: RoomGenerator = (_rng, _room, grid) => {
  const ROOM_SIZE = grid.length;
  
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
};
