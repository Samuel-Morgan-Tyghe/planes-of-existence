export type TrailType = 'slow' | 'toxic';

export interface SlimeTrail {
  id: number;
  type: TrailType;
  position: [number, number, number];
  size: number;
  spawnTime: number;
  duration: number; // Duration in ms
  roomId: number;
}
