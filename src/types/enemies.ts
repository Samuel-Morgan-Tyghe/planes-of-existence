export interface EnemyDefinition {
  id: string;
  name: string;
  health: number;
  damage: number;
  speed: number;
  size: number;
  color: string;
  dropChance: number; // 0-1 chance to drop loot
  experience: number;
  attackType?: 'melee' | 'ranged'; // Attack type
  attackRange?: number; // Range for ranged attacks
  projectileSpeed?: number; // Speed of projectiles for ranged enemies
  fireRate?: number; // Time between shots in ms for ranged enemies
}

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  glitch_basic: {
    id: 'glitch_basic',
    name: 'Glitch',
    health: 20,
    damage: 5,
    speed: 2,
    size: 0.8,
    color: '#ff0000',
    dropChance: 0.3,
    experience: 10,
  },
  corruption: {
    id: 'corruption',
    name: 'Corruption',
    health: 50,
    damage: 10,
    speed: 1.5,
    size: 1.2,
    color: '#800080',
    dropChance: 0.5,
    experience: 25,
  },
  artifact: {
    id: 'artifact',
    name: 'Artifact',
    health: 100,
    damage: 15,
    speed: 1,
    size: 1.5,
    color: '#00ffff',
    dropChance: 0.7,
    experience: 50,
  },
  sniper: {
    id: 'sniper',
    name: 'Sniper',
    health: 30,
    damage: 8,
    speed: 0.5,
    size: 0.9,
    color: '#ffff00',
    dropChance: 0.4,
    experience: 20,
    attackType: 'ranged',
    attackRange: 15, // Can attack from 15 units away
    projectileSpeed: 12, // Fast projectiles
    fireRate: 2000, // Fire every 2 seconds
  },
};

export interface EnemyState {
  id: number;
  definition: EnemyDefinition;
  health: number;
  position: [number, number, number];
  isDead: boolean;
}

