import { GridMap, Room } from '../../../types/room';
import { SeededRandom } from '../../../utils/random';

const ROOM_SIZE = 30;

export function generateShopRoom(_rng: SeededRandom, _room: Room, grid: GridMap) {
  const centerX = Math.floor(ROOM_SIZE / 2);
  const centerY = Math.floor(ROOM_SIZE / 2);

  // Clear a large central area (10x10)
  for (let y = centerY - 5; y <= centerY + 5; y++) {
    for (let x = centerX - 5; x <= centerX + 5; x++) {
      if (x > 1 && x < ROOM_SIZE - 2 && y > 1 && y < ROOM_SIZE - 2) {
        grid[y][x] = 0; // Floor
      }
    }
  }

  // Place 3 Shop Items in a row at the center
  // Left
  grid[centerY][centerX - 3] = 18;
  // Center
  grid[centerY][centerX] = 18;
  // Right
  grid[centerY][centerX + 3] = 18;

  // Decorate with some pillars/torches around the shop area
  grid[centerY - 4][centerX - 4] = 13; // Pillar
  grid[centerY - 4][centerX + 4] = 13; // Pillar
  grid[centerY + 4][centerX - 4] = 13; // Pillar
  grid[centerY + 4][centerX + 4] = 13; // Pillar

  grid[centerY - 4][centerX] = 14; // Torch
  grid[centerY + 4][centerX] = 14; // Torch

  // Add a nice carpet? Maybe just use floor for now.
}
