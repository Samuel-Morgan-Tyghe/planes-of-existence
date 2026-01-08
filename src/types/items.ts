import type { PlaneType, ProjectileData } from './game';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  visualType?: 'range' | 'rate' | 'size' | 'damage' | 'speed';
  
  // Base effect (applies to all planes)
  baseEffect?: (projectile: ProjectileData) => ProjectileData;
  
  // Plane-specific effects
  planeEffects?: {
    '2D'?: (projectile: ProjectileData) => ProjectileData;
    'ISO'?: (projectile: ProjectileData) => ProjectileData;
    'FPS'?: (projectile: ProjectileData) => ProjectileData;
  };
  
  // Stat modifiers
  statModifiers?: {
    sharpness?: number;
    saturation?: number;
    contrast?: number;
    brightness?: number;
    resolution?: number;
    // Combat Stats
    range?: number;
    fireRate?: number;
    projectileSize?: number;
    damage?: number;
    projectileSpeed?: number;
    // Artistic Gameplay Modifiers
    critChance?: number;
    armorPen?: number;
    pierce?: number;
    trueDamage?: boolean;
    dodgeChance?: number;
    stealthMultiplier?: number;
    lootRarityBonus?: number;
    incomingDamageMultiplier?: number;
    knockback?: number;
    knockbackResistance?: number;
  };
}

export interface SynergyDefinition {
  id: string;
  name: string;
  description: string;
  requiredItems: string[]; // Item IDs that must be present
  effect: (projectile: ProjectileData, plane: PlaneType) => ProjectileData;
}

// Item Definitions
export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  // --- WARRIOR THEME (Damage + Health) ---
  gladiators_heart: {
    id: 'gladiators_heart',
    name: "Gladiator's Heart",
    description: "Strength through vitality. +20% Damage, +50% Max HP (logic pending), -5% Speed.", // Max HP logic is in Player.tsx
    rarity: 'rare',
    visualType: 'damage',
    statModifiers: { damage: 0.2, projectileSpeed: -0.05 } 
  },
  berserker_drive: {
    id: 'berserker_drive',
    name: "Berserker Drive",
    description: "Rage protocol. +35% Fire Rate, +15% Damage, -20% Accuracy.",
    rarity: 'uncommon',
    visualType: 'rate',
    statModifiers: { fireRate: 0.35, damage: 0.15 } 
  },
  executioner_chip: {
    id: 'executioner_chip',
    name: "Executioner Chip",
    description: "Effectively lethal. +50% Crit Damage (simulated), +10% Crit Chance.",
    rarity: 'rare',
    visualType: 'damage',
    statModifiers: { critChance: 0.1, damage: 0.2 } 
  },

  // --- RANGER THEME (Range + Speed) ---
  railgun_accelerator: {
    id: 'railgun_accelerator',
    name: "Railgun Accelerator",
    description: "Hyper-velocity rounds. +40% Speed, +40% Range, +1 Pierce.",
    rarity: 'rare',
    visualType: 'speed',
    statModifiers: { projectileSpeed: 0.4, range: 0.4, pierce: 1 }
  },
  sniper_scope: {
    id: 'sniper_scope',
    name: "Digital Scope",
    description: "Extreme precision. +100% Range, +25% Crit Chance, -30% Fire Rate.",
    rarity: 'uncommon',
    visualType: 'range',
    statModifiers: { range: 1.0, critChance: 0.25, fireRate: -0.3 }
  },
  guerrilla_tactics: {
    id: 'guerrilla_tactics',
    name: "Guerrilla Tactics",
    description: "Hit and run. +20% Move Speed (simulated), +15% Fire Rate.",
    rarity: 'common',
    visualType: 'speed',
    statModifiers: { fireRate: 0.15 } 
  },

  // --- MAGE THEME (Size + Effects) ---
  void_prism: {
    id: 'void_prism',
    name: "Void Prism",
    description: "Projectiles distorted by darkness. +100% Size, +20% Damage, Slow Projectiles.",
    rarity: 'legendary',
    visualType: 'size',
    statModifiers: { projectileSize: 1.0, damage: 0.2, projectileSpeed: -0.4 }
  },
  arcane_battery: {
    id: 'arcane_battery',
    name: "Arcane Battery",
    description: "Overcharged energy. +2 Pierce, +25% Range, Projectiles glow brighter.",
    rarity: 'rare',
    visualType: 'range',
    statModifiers: { pierce: 2, range: 0.25 }
  },
  chaos_engine: {
    id: 'chaos_engine',
    name: "Chaos Engine",
    description: "Unstable output. +50% Fire Rate, -50% Accuracy, Random Crits.",
    rarity: 'uncommon',
    visualType: 'rate',
    statModifiers: { fireRate: 0.5, critChance: 0.1 }
  },

  // --- TANK THEME (Health + Defense) ---
  titan_plating: {
    id: 'titan_plating',
    name: "Titan Plating",
    description: "Heavy armor. -20% Incoming Damage, -10% Move Speed.",
    rarity: 'rare',
    visualType: 'size',
    statModifiers: { incomingDamageMultiplier: 0.8 }
  },
  reactive_shield: {
    id: 'reactive_shield',
    name: "Reactive Shield",
    description: "Explosive defense. +100% Knockback, +50% Knockback Resistance.",
    rarity: 'uncommon',
    visualType: 'damage',
    statModifiers: { knockback: 1.0, knockbackResistance: 0.5 }
  },

  // --- ROGUE THEME (Crit + Speed) ---
  assassin_dagger: {
    id: 'assassin_dagger',
    name: "Assassin's Code",
    description: "Silent but deadly. +100% Damage from behind (flanking), +20% Crit.",
    rarity: 'rare',
    visualType: 'damage',
    statModifiers: { critChance: 0.2, damage: 0.2 }
  },
  smoke_bomb: {
    id: 'smoke_bomb',
    name: "Smoke Bomb",
    description: "Disappear. +20% Dodge Chance, +1 sec Stealth duration.",
    rarity: 'common',
    visualType: 'speed',
    statModifiers: { dodgeChance: 0.2, stealthMultiplier: 1.0 }
  },

  // --- ARTISTIC THEMES (Visuals + Stats) ---
  noir_detective: {
    id: 'noir_detective',
    name: "Noir Detective",
    description: "Hard-boiled. -100% Saturation, +50% Damage, +20% Contrast.",
    rarity: 'rare',
    visualType: 'damage',
    statModifiers: { saturation: -1.0, damage: 0.5, contrast: 0.2 }
  },
  neon_demon: {
    id: 'neon_demon',
    name: "Neon Demon",
    description: "Blinding lights. +50% brightness, +50% Saturation, +25% Fire Rate.",
    rarity: 'uncommon',
    visualType: 'rate',
    statModifiers: { brightness: 0.5, saturation: 0.5, fireRate: 0.25 }
  },
  retro_glitch: {
    id: 'retro_glitch',
    name: "Retro Glitch",
    description: "Analog decay. -50% Resolution, +2 Pierce, +20% Knockback.",
    rarity: 'rare',
    visualType: 'size',
    statModifiers: { resolution: -0.5, pierce: 2, knockback: 0.2 }
  },
  
  // --- LEGACY UTILITIES ---
  dead_pixel: {
    id: 'dead_pixel',
    name: 'Dead Pixel',
    description: 'Projectiles pass through obstacles',
    rarity: 'common',
    planeEffects: {
      '2D': (p) => ({ ...p, behavior: 'linear', phaseThroughWalls: true }),
      'ISO': (p) => ({ ...p, behavior: 'linear', phaseThroughWalls: true }),
      'FPS': (p) => ({ ...p, behavior: 'linear', phaseThroughWalls: true }),
    },
  },
  rgb_split: {
    id: 'rgb_split',
    name: 'RGB Split',
    description: 'Triples projectile count',
    rarity: 'common',
    baseEffect: (p) => ({ ...p, count: p.count * 3 }),
  },

  double_jump: {
    id: 'double_jump',
    name: 'Air Dash Protocol',
    description: 'Defies gravity momentarily. Grants one additional mid-air jump.',
    rarity: 'uncommon',
    statModifiers: {} 
  },

  // --- NEW MECHANIC ITEMS ---
  dull_prism: {
    id: 'dull_prism',
    name: 'Dull Prism',
    description: 'Geometric brutality. Projectiles become heavy tumbling cubes using pure kinetic force.',
    rarity: 'rare',
    visualType: 'size',
    baseEffect: (p) => ({ ...p, tumble: true, shape: 'cube', speed: p.speed * 0.7, knockback: (p.knockback || 5) * 3.0, damage: p.damage * 1.5, size: (p.size || 1) * 1.5 }),
  },
  cosine_calibrator: {
    id: 'cosine_calibrator',
    name: 'Cosine Calibrator',
    description: 'Oscillating frequencies. Projectiles move in a sine wave pattern.',
    rarity: 'uncommon',
    visualType: 'range',
    baseEffect: (p) => ({ ...p, wobble: 0.5, pierce: (p.pierce || 0) + 1 }),
  },
  vector_field: {
    id: 'vector_field',
    name: 'Vector Field',
    description: 'Magnetic guidance. Projectiles strictly home in on targets.',
    rarity: 'legendary',
    visualType: 'speed',
    baseEffect: (p) => ({ ...p, behavior: 'homing', turnSpeed: 0.2, color: '#ff0055' }), // turnSpeed not in type yet but assuming lerp factor
  },
};

// Synergy Definitions
export const SYNERGY_DEFINITIONS: SynergyDefinition[] = [
  {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'Sniper Scope + Berserker Drive = Ultimate Offense',
    requiredItems: ['sniper_scope', 'berserker_drive'],
    effect: (p, _plane) => ({ ...p, damage: p.damage * 2.0, count: p.count + 2 }),
  },
];
