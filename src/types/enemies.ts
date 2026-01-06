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
  flanker: {
    id: 'flanker',
    name: 'Flanker',
    health: 25,
    damage: 6,
    speed: 0.7,
    size: 0.8,
    color: '#FF8C00', // Dark Orange
    dropChance: 0.4,
    experience: 25,
    attackType: 'ranged',
    attackRange: 20,
    projectileSpeed: 8,
    fireRate: 2000,
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
    fireRate: 2000,
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
  weaver: {
    id: 'weaver',
    name: 'The Glitch Weaver',
    health: 1200, // Mega tank
    damage: 15, // Damage per projectile
    speed: 1.0, 
    size: 4.0, // Large presence
    color: '#8A2BE2', // BlueViolet
    dropChance: 1.0,
    experience: 2000,
    attackType: 'ranged',
    attackRange: 30,
    projectileSpeed: 10,
    fireRate: 1200, // Slower base pattern repeat
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
  hopper: {
    id: 'hopper',
    name: 'Hopper',
    health: 25,
    damage: 8,
    speed: 8.0, // Fast burst speed
    size: 0.9,
    color: '#00FA9A', // MediumSpringGreen
    dropChance: 0.3,
    experience: 20,
    attackType: 'melee',
  },
  knight: {
    id: 'knight',
    name: 'Knight',
    health: 40, // Tankier than Hopper
    damage: 12, // Harder hitting
    speed: 6.0, 
    size: 1.1,
    color: '#4682B4', // SteelBlue
    dropChance: 0.35,
    experience: 35,
    attackType: 'melee',
  },
  bomber: {
    id: 'bomber',
    name: 'Bomber',
    health: 35,
    damage: 15,
    speed: 1.5,
    size: 1.1,
    color: '#A52A2A', // Brownish
    dropChance: 0.4,
    experience: 30,
    attackType: 'ranged',
    attackRange: 8, // Short range
    fireRate: 3000, // Throws every 3 seconds
  },
  demolisher: {
    id: 'demolisher',
    name: 'Demolisher',
    health: 80,
    damage: 15,
    speed: 0.8, // Very slow
    size: 1.5,
    color: '#2F4F4F', // DarkSlateGray
    dropChance: 0.6,
    experience: 50,
    attackType: 'ranged',
    attackRange: 10,
    fireRate: 4000, // Slow but powerful
  },
  bombardier: {
    id: 'bombardier',
    name: 'Bombardier',
    health: 30,
    damage: 12,
    speed: 1.0, 
    size: 0.9,
    color: '#FFD700', // Gold
    dropChance: 0.4,
    experience: 30,
    attackType: 'ranged',
    attackRange: 25, // Long range
    fireRate: 4000, // Very slow fire rate
  },
  slime_slow: {
    id: 'slime_slow',
    name: 'Slow Slime',
    health: 40,
    damage: 8,
    speed: 10.0,
    size: 1.2,
    color: '#00f2ff', // Cyan
    dropChance: 0.4,
    experience: 30,
    attackType: 'melee',
  },
  slime_toxic: {
    id: 'slime_toxic',
    name: 'Toxic Slime',
    health: 45,
    damage: 10,
    speed: 10.2,
    size: 1.1,
    color: '#32CD32', // LimeGreen
    dropChance: 0.45,
    experience: 35,
    attackType: 'melee',
  },
  nova: {
    id: 'nova',
    name: 'Nova Bug',
    health: 60,
    damage: 8,
    speed: 0.6, // Slow
    size: 1.4,
    color: '#FF69B4', // HotPink
    dropChance: 0.5,
    experience: 40,
    attackType: 'ranged',
    attackRange: 8, // Short range
    fireRate: 2500, // Every 2.5 seconds
  },
  reactive_bug: {
    id: 'reactive_bug',
    name: 'Spite Bug',
    health: 80, // Tanky enough to take multiple hits
    damage: 10,
    speed: 0.6,
    size: 1.5,
    color: '#DC143C', // Crimson
    dropChance: 0.6,
    experience: 50,
    attackType: 'melee', // Moves towards player
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

