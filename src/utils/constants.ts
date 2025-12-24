// Collision groups for Rapier physics
export const COLLISION_GROUPS = {
  PLAYER: 0x0001,
  ENEMY: 0x0002,
  WALL: 0x0004,
  PROJECTILE: 0x0008,
  LOOT: 0x0010,
} as const;

