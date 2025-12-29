export type PlaneType = '2D' | 'ISO' | 'FPS';

export interface PlayerStats {
  sharpness: number;
  saturation: number;
  contrast: number;
  brightness: number;
  resolution: number;
}

export interface ProjectileData {
  speed: number;
  damage: number;
  behavior: 'linear' | 'homing' | 'bouncing';
  count: number;
  direction?: [number, number, number];
  color?: string; // Color override for RGB split etc
  phaseThroughWalls?: boolean;
}

