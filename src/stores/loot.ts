import { map } from 'nanostores';
import { emitDrop } from '../systems/events';
import { $currentRoomId } from './game';

// Set of Coordinate strings "room.id-x,y" that have been destroyed
// This ensures crates don't reappear if we revisit a room
export const $brokenCrates = map<Record<string, boolean>>({});

export type LootType = 'coin' | 'heart' | 'shield';

export const spawnLoot = (position: [number, number, number], type?: LootType) => {
  let dropType: string | undefined;
  
  if (!type) {
    const r = Math.random();
    if (r < 0.6) dropType = 'coin';
    else if (r < 0.9) dropType = 'health';
    else dropType = 'shield';
  } else {
    if (type === 'heart') dropType = 'health';
    else dropType = type;
  }

  const roomId = $currentRoomId.get();
  // Spawn at ground level (0.1) instead of in the air (0.5)
  // because the dynamic rigid bodies have an initial hop impulse.
  emitDrop([position[0], 0.1, position[2]], roomId, dropType);
};

export const breakCrate = (id: string) => {
    $brokenCrates.setKey(id, true);
}

export const clearLoot = () => {
    $brokenCrates.set({});
}
