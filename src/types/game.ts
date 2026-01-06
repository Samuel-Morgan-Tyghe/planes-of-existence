export type PlaneType = '2D' | 'ISO' | 'FPS';

export interface PlayerStats {
  sharpness: number;
  saturation: number;
  contrast: number;
  brightness: number;
  resolution: number;
  // Combat Stats
  range: number;           // Projectile lifetime in seconds
  fireRate: number;        // Shots per second
  projectileSize: number;  // Scale multiplier
  damage: number;          // Damage multiplier
  projectileSpeed: number; // Velocity multiplier
  // Artistic Gameplay Modifiers
  critChance: number;
  armorPen: number;
  pierce: number;
  trueDamage: boolean;
  dodgeChance: number;
  stealthMultiplier: number;
  lootRarityBonus: number;
  incomingDamageMultiplier: number;
  // Knockback
  knockback: number;           // Force applied to enemies
  knockbackResistance: number; // Resistance to incoming knockback
}

export interface ProjectileData {
  speed: number;
  damage: number;
  behavior: 'linear' | 'homing' | 'bouncing';
  count: number;
  direction?: [number, number, number];
  color?: string; // Color override for RGB split etc
  phaseThroughWalls?: boolean;
  range?: number; // Lifetime in seconds
  size?: number; // Scale multiplier
  pierce?: number;
  trueDamage?: boolean;
}

export interface ThrownBomb {
  id: number;
  position: [number, number, number];
  direction: [number, number, number];
  initialVelocity: [number, number, number];
  exploded: boolean;
  explosionPos?: [number, number, number];
  fuse: number;
}
