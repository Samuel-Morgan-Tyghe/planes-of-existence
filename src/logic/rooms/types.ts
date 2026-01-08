import type { GridMap, Room } from '../../types/room';
import type { SeededRandom } from '../../utils/random';

export type RoomGenerator = (
  rng: SeededRandom,
  room: Room,
  grid: GridMap
) => void;
