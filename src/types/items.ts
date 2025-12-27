import type { PlaneType } from './game';
import type { ProjectileData } from './game';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  
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
    resolution?: number;
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
  dead_pixel: {
    id: 'dead_pixel',
    name: 'Dead Pixel',
    description: 'Projectiles pass through obstacles',
    rarity: 'common',
    planeEffects: {
      '2D': (p) => ({ ...p, behavior: 'linear' }), // Phase through platforms
      'ISO': (p) => ({ ...p, behavior: 'linear' }), // Ignore walls
      'FPS': (p) => ({ ...p, behavior: 'linear' }), // Phase through enemies
    },
  },
  
  rgb_split: {
    id: 'rgb_split',
    name: 'RGB Split',
    description: 'Triples projectile count',
    rarity: 'common',
    baseEffect: (p) => ({ ...p, count: p.count * 3 }),
    planeEffects: {
      '2D': (p) => ({ ...p }), // Horizontal spread handled in firing
      'ISO': (p) => ({ ...p }), // 120° arc handled in firing
      'FPS': (p) => ({ ...p }), // Vertical spread handled in firing
    },
  },
  
  motion_blur: {
    id: 'motion_blur',
    name: 'Motion Blur',
    description: 'Increases movement speed',
    rarity: 'common',
    statModifiers: {
      // Movement speed handled in PlayerController
    },
  },
  
  gaussian_blur: {
    id: 'gaussian_blur',
    name: 'Gaussian Blur',
    description: 'Spread shot pattern',
    rarity: 'uncommon',
    baseEffect: (p) => ({ ...p, count: p.count + 2 }), // More projectiles
  },
  
  clone_tool: {
    id: 'clone_tool',
    name: 'Clone Tool',
    description: 'Replicates projectiles mid-air',
    rarity: 'rare',
    baseEffect: (p) => ({ ...p, behavior: 'bouncing' }), // Bounce to replicate
  },
  
  darkness_aura: {
    id: 'darkness_aura',
    name: 'Darkness Aura',
    description: 'Damaging aura around player',
    rarity: 'rare',
    statModifiers: {
      brightness: -0.3, // Darker = stealth
    },
  },
  
  color_bleed: {
    id: 'color_bleed',
    name: 'Color Bleed',
    description: 'Leaves damaging trail',
    rarity: 'uncommon',
    statModifiers: {
      saturation: 0.2, // More colorful
    },
  },
};

// Synergy Definitions
export const SYNERGY_DEFINITIONS: SynergyDefinition[] = [
  {
    id: 'the_vignette',
    name: 'The Vignette',
    description: 'Darkness aura + color bleed creates devastating combo',
    requiredItems: ['darkness_aura', 'color_bleed'],
    effect: (p, plane) => {
      // Creates damaging aura + trail
      if (plane === '2D') {
        return { ...p, count: p.count * 2, behavior: 'linear' };
      } else if (plane === 'ISO') {
        return { ...p, count: p.count * 3, behavior: 'linear' };
      } else {
        return { ...p, count: p.count * 2, behavior: 'homing' };
      }
    },
  },
  {
    id: 'recursive_render',
    name: 'Recursive Render',
    description: 'Gaussian blur + clone tool creates bullet hell',
    requiredItems: ['gaussian_blur', 'clone_tool'],
    effect: (p, plane) => {
      // Spread shots that replicate
      if (plane === '2D') {
        return { ...p, count: p.count * 4, behavior: 'bouncing' };
      } else if (plane === 'ISO') {
        return { ...p, count: p.count * 6, behavior: 'bouncing' };
      } else {
        return { ...p, count: p.count * 3, behavior: 'bouncing' };
      }
    },
  },
];

