import { map } from 'nanostores';
import { SlimeTrail, TrailType } from '../types/trails';

export const $trails = map<Record<number, SlimeTrail>>({});
let trailIdCounter = 0;

export const addTrail = (
  position: [number, number, number],
  type: TrailType,
  size: number,
  duration: number,
  roomId: number
) => {
  const id = trailIdCounter++;
  const newTrail: SlimeTrail = {
    id,
    type,
    position,
    size,
    spawnTime: Date.now(),
    duration,
    roomId,
  };
  $trails.setKey(id, newTrail);
  return id;
};

export const clearTrails = () => {
    $trails.set({});
};

export const removeTrail = (id: number) => {
    const trails = { ...$trails.get() };
    delete trails[id];
    $trails.set(trails);
};

export const tickTrails = () => {
    const now = Date.now();
    const currentTrails = $trails.get();
    let changed = false;
    const nextTrails = { ...currentTrails };

    Object.values(currentTrails).forEach(trail => {
        if (now - trail.spawnTime > trail.duration) {
            delete nextTrails[trail.id];
            changed = true;
        }
    });

    if (changed) {
        $trails.set(nextTrails);
    }
};
