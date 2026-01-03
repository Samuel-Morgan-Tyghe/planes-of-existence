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
  projectileSize?: number; // Size scale of projectiles for ranged enemies (default 1.0)
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
    attackRange: 30, // Can attack from 15 units away
    projectileSpeed: 20, // Fast projectiles
    projectileSize: 0.1, // Small, bullet-like
    fireRate: 2000, // Fire every 2 seconds
  },
  rusher: {
    id: 'rusher',
    name: 'Rusher',
    health: 15,
    damage: 4,
    speed: 8.0, // Same as player base speed
    size: 0.6,
    color: '#ff4500', // Orange-Red
    dropChance: 0.2,
    experience: 15,
    attackType: 'melee',
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    health: 80,
    damage: 15,
    speed: 0.8, // Slow
    size: 1.8,
    color: '#006400', // Dark Green
    dropChance: 0.6,
    experience: 40,
    attackType: 'melee',
  },
  turret: {
    id: 'turret',
    name: 'Turret',
    health: 40,
    damage: 10,
    speed: 0, // Stationary
    size: 1.0,
    color: '#4b0082', // Indigo
    dropChance: 0.4,
    experience: 30,
    attackType: 'ranged',
    attackRange: 12,
    projectileSpeed: 8,
    fireRate: 1500,
  },
  echoer: {
    id: 'echoer',
    name: 'Echoer',
    health: 40,
    damage: 12,
    speed: 1.2,
    size: 1.1,
    color: '#00ff7f', // Spring Green
    dropChance: 0.5,
    experience: 35,
    attackType: 'ranged', // We'll handle the specific 'echo' logic in Enemy.tsx
    attackRange: 10,
    projectileSpeed: 6,
    fireRate: 2500,
  },
  boss: {
    id: 'boss',
    name: 'The Glitch Lord',
    health: 500,
    damage: 20,
    speed: 1.5,
    size: 2.5,
    color: '#ff00ff',
    dropChance: 1.0,
    experience: 500,
    attackType: 'melee',
  },
  growth_health: {
    id: 'growth_health',
    name: 'Growth Buy (Health)',
    health: 5, // Starts very weak (1-hit kill)
    damage: 5,
    speed: 1.0,
    size: 0.8,
    color: '#228B22', // Forest Green
    dropChance: 0.4,
    experience: 30,
    attackType: 'melee',
  },
  growth_harden: {
    id: 'growth_harden',
    name: 'Growth Bug (Hard)',
    health: 5, // Starts very weak
    damage: 5,
    speed: 1.2,
    size: 0.6,
    color: '#708090', // Slate Gray
    dropChance: 0.4,
    experience: 30,
    attackType: 'melee',
  },
  growth_cannon: {
    id: 'growth_cannon',
    name: 'Growth Bug (Cannon)',
    health: 5, // Starts very weak
    damage: 5,
    speed: 1.0,
    size: 0.7,
    color: '#B22222', // Firebrick
    dropChance: 0.4,
    experience: 35,
    attackType: 'ranged',
    attackRange: 15,
    projectileSpeed: 8,
    fireRate: 2000,
  },
};

export interface EnemyState {
  id: number;
  roomId: number;
  definition: EnemyDefinition;
  health: number;
  position: [number, number, number];
  isDead: boolean;
  heldItem?: string; // Item ID if the enemy is holding one
  spawnTime: number;
  isCorrupted?: boolean;
}

