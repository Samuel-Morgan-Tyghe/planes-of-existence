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
  // --- RANGE ---
  fiber_optic_cable: {
    id: 'fiber_optic_cable',
    name: 'Fiber Optic Cable',
    description: 'Low latency transmission. +50% Range.',
    rarity: 'common',
    visualType: 'range',
    statModifiers: { range: 0.5 }
  },
  router_extender: {
    id: 'router_extender',
    name: 'Router Extender',
    description: 'Signal boost for dead zones. +25% Range.',
    rarity: 'common',
    visualType: 'range',
    statModifiers: { range: 0.25 }
  },
  ping_timeout_override: {
    id: 'ping_timeout_override',
    name: 'Ping Timeout Override',
    description: 'Connection kept alive indefinitely. +100% Range, -10% Speed.',
    rarity: 'uncommon',
    visualType: 'range',
    statModifiers: { range: 1.0, projectileSpeed: -0.1 }
  },
  sniper_exe: {
    id: 'sniper_exe',
    name: 'Sniper.exe',
    description: 'Target specific. +200% Range, -50% Fire Rate.',
    rarity: 'rare',
    visualType: 'range',
    statModifiers: { range: 2.0, fireRate: -0.5 }
  },

  // --- RATE ---
  turbo_button: {
    id: 'turbo_button',
    name: 'Turbo Button',
    description: 'Hardware forced to max cycle. +25% Fire Rate.',
    rarity: 'common',
    visualType: 'rate',
    statModifiers: { fireRate: 0.25 }
  },
  v_sync_off: {
    id: 'v_sync_off',
    name: 'V-Sync Off',
    description: 'Tearing allowed for max frames. +50% Fire Rate, +Spread.',
    rarity: 'uncommon',
    visualType: 'rate',
    statModifiers: { fireRate: 0.5 },
    baseEffect: (p) => ({ ...p, count: p.count + 1 }) // Simple spread representation
  },
  script_kiddy: {
    id: 'script_kiddy',
    name: 'Script Kiddy',
    description: 'Copy-paste code rapidly. +15% Fire Rate.',
    rarity: 'common',
    visualType: 'rate',
    statModifiers: { fireRate: 0.15 }
  },
  ddos_attack: {
    id: 'ddos_attack',
    name: 'DDoS Attack',
    description: 'Packet flooding initiated. Massive Fire Rate boost.',
    rarity: 'rare',
    visualType: 'rate',
    statModifiers: { fireRate: 0.3 } // Base boost, could add logic for "after damage" later
  },

  // --- SIZE ---
  big_data: {
    id: 'big_data',
    name: 'Big Data',
    description: 'Uncompressed raw files. +100% Size.',
    rarity: 'uncommon',
    visualType: 'size',
    statModifiers: { projectileSize: 1.0 }
  },
  bloatware: {
    id: 'bloatware',
    name: 'Bloatware',
    description: 'Unnecessary pre-installed junk. +50% Size, -10% Speed.',
    rarity: 'common',
    visualType: 'size',
    statModifiers: { projectileSize: 0.5, projectileSpeed: -0.1 }
  },
  hitbox_dilation: {
    id: 'hitbox_dilation',
    name: 'Hitbox Dilation',
    description: 'Developer debug tool left on. +25% Size.',
    rarity: 'common',
    visualType: 'size',
    statModifiers: { projectileSize: 0.25 }
  },
  zip_folder: {
    id: 'zip_folder',
    name: 'Zip Folder',
    description: 'Compressed for transport. -50% Size, +50% Speed, +20% Damage.',
    rarity: 'rare',
    visualType: 'size',
    statModifiers: { projectileSize: -0.5, projectileSpeed: 0.5, damage: 0.2 }
  },

  // --- DAMAGE ---
  root_access: {
    id: 'root_access',
    name: 'Root Access',
    description: 'Admin privileges granted. +20% Damage.',
    rarity: 'common',
    visualType: 'damage',
    statModifiers: { damage: 0.2 }
  },
  malware_injection: {
    id: 'malware_injection',
    name: 'Malware Injection',
    description: 'Corrupts host files on contact. +15% Damage.',
    rarity: 'common',
    visualType: 'damage',
    statModifiers: { damage: 0.15 }
  },
  overclocked_gpu: {
    id: 'overclocked_gpu',
    name: 'Overclocked GPU',
    description: 'Running hot. +40% Damage, +10% Damage Taken.',
    rarity: 'uncommon',
    visualType: 'damage',
    statModifiers: { damage: 0.4 }
  },
  critical_error: {
    id: 'critical_error',
    name: 'Critical Error',
    description: 'Blue Screen of Death payload. +100% Damage on every 10th shot.',
    rarity: 'rare',
    visualType: 'damage',
    statModifiers: { damage: 0.1 } // Base boost for now
  },

  // --- SPEED ---
  ssd_upgrade: {
    id: 'ssd_upgrade',
    name: 'SSD Upgrade',
    description: 'Read/Write speeds optimized. +25% Projectile Speed.',
    rarity: 'common',
    visualType: 'speed',
    statModifiers: { projectileSpeed: 0.25 }
  },
  antenna_5g: {
    id: 'antenna_5g',
    name: '5G Antenna',
    description: 'Next-gen bandwidth. +15% Projectile Speed.',
    rarity: 'common',
    visualType: 'speed',
    statModifiers: { projectileSpeed: 0.15 }
  },
  lag_switch: {
    id: 'lag_switch',
    name: 'Lag Switch',
    description: 'Artificial delay removed. +200% Projectile Speed, -20% Range.',
    rarity: 'rare',
    visualType: 'speed',
    statModifiers: { projectileSpeed: 2.0, range: -0.2 }
  },
  mouse_acceleration: {
    id: 'mouse_acceleration',
    name: 'Mouse Acceleration',
    description: 'Motion calculation error. Projectiles gain speed over distance.',
    rarity: 'uncommon',
    visualType: 'speed',
    statModifiers: { projectileSpeed: 0.2 }
  },

  // --- LEGACY ---
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

  // --- SHARPNESS ---
  unsharp_mask: {
    id: 'unsharp_mask',
    name: 'Unsharp Mask',
    description: 'Edges become hyper-defined. +20% Sharpness, +10% Crit Chance.',
    rarity: 'common',
    statModifiers: { sharpness: 0.2, critChance: 0.1 }
  },
  gaussian_blur: {
    id: 'gaussian_blur',
    name: 'Gaussian Blur',
    description: 'The world looks dreamy and soft. -30% Sharpness, -10% Crit, +1 Pierce.',
    rarity: 'uncommon',
    statModifiers: { sharpness: -0.3, critChance: -0.1, pierce: 1 }
  },
  edge_detection: {
    id: 'edge_detection',
    name: 'Edge Detection',
    description: 'The world looks like a sketch. Max Sharpness, True Damage, Take double damage.',
    rarity: 'legendary',
    statModifiers: { sharpness: 1.0, trueDamage: true, incomingDamageMultiplier: 1.0 } // 1.0 + 1.0 = 2x
  },
  bokeh_filter: {
    id: 'bokeh_filter',
    name: 'Bokeh Filter',
    description: 'Background elements are extremely blurry. +10% Sharpness, +50% Damage to far enemies.',
    rarity: 'rare',
    statModifiers: { sharpness: 0.1 } // Damage logic handled in combat.ts
  },

  // --- SATURATION ---
  digital_vibrance: {
    id: 'digital_vibrance',
    name: 'Digital Vibrance',
    description: 'Colors "pop" neon-bright. +25% Saturation, Status effects last 2s longer.',
    rarity: 'common',
    statModifiers: { saturation: 0.25 }
  },
  deep_fried: {
    id: 'deep_fried',
    name: 'Deep Fried',
    description: 'Colors are blown out and distorted. +100% Saturation, +50% Elemental Damage, -20% Accuracy.',
    rarity: 'uncommon',
    statModifiers: { saturation: 1.0 }
  },
  noir_filter: {
    id: 'noir_filter',
    name: 'Noir Filter',
    description: 'Black & White. Set Saturation to 0, +40% Physical Damage.',
    rarity: 'rare',
    statModifiers: { saturation: -1.0, damage: 0.4 }
  },
  color_invert: {
    id: 'color_invert',
    name: 'Color Invert',
    description: 'Blue is Orange, Red is Teal. Invert Saturation. Healing items damage you; Damage items heal you.',
    rarity: 'legendary',
    statModifiers: { saturation: -2.0 } // Invert logic
  },
  sepia_tone: {
    id: 'sepia_tone',
    name: 'Sepia Tone',
    description: 'Old wild west look. -20% Saturation, Slow Motion on kill.',
    rarity: 'uncommon',
    statModifiers: { saturation: -0.2 }
  },

  // --- CONTRAST ---
  oled_black: {
    id: 'oled_black',
    name: 'OLED Black',
    description: 'Shadows become pure black voids. +30% Contrast, +50% Damage to enemies in shadows.',
    rarity: 'uncommon',
    statModifiers: { contrast: 0.3 }
  },
  washed_out: {
    id: 'washed_out',
    name: 'Washed Out',
    description: 'Everything looks gray and flat. -30% Contrast, Enemy detection radius reduced.',
    rarity: 'common',
    statModifiers: { contrast: -0.3, stealthMultiplier: -0.5 }
  },
  threshold: {
    id: 'threshold',
    name: 'Threshold',
    description: '1-bit style. Max Contrast, See invisible enemies/traps.',
    rarity: 'rare',
    statModifiers: { contrast: 1.0 }
  },
  gamma_correction: {
    id: 'gamma_correction',
    name: 'Gamma Correction',
    description: 'Mid-tones are brightened. +15% Contrast, Increases Loot Rarity.',
    rarity: 'common',
    statModifiers: { contrast: 0.15, lootRarityBonus: 0.1 }
  },

  // --- BRIGHTNESS ---
  lens_flare: {
    id: 'lens_flare',
    name: 'Lens Flare',
    description: 'JJ Abrams style flares. +20% Brightness, Enemies have -10% Accuracy.',
    rarity: 'common',
    statModifiers: { brightness: 0.2 }
  },
  dark_mode: {
    id: 'dark_mode',
    name: 'Dark Mode',
    description: 'UI and World dim significantly. -40% Brightness, Enemies cannot target from far away.',
    rarity: 'uncommon',
    statModifiers: { brightness: -0.4, stealthMultiplier: -0.3 }
  },
  flashbang: {
    id: 'flashbang',
    name: 'Flashbang',
    description: 'Screen is white-washed. +50% Brightness, Crits trigger Stun.',
    rarity: 'rare',
    statModifiers: { brightness: 0.5 }
  },
  night_sight: {
    id: 'night_sight',
    name: 'Night Sight',
    description: 'Green tint night-vision. Normal Brightness in Dark Areas, Immunity to Blindness.',
    rarity: 'uncommon',
    statModifiers: { brightness: 0.1 }
  },

  // --- RESOLUTION ---
  texture_pack_4k: {
    id: 'texture_pack_4k',
    name: '4K Texture Pack',
    description: 'Textures are crisp. +50% Resolution, +50% Max HP, -10% Speed.',
    rarity: 'rare',
    statModifiers: { resolution: 0.5, projectileSpeed: -0.1 } // Max HP handled in Player.tsx
  },
  downsampler_8bit: {
    id: 'downsampler_8bit',
    name: '8-Bit Downsampler',
    description: 'Game looks like NES. -50% Resolution, -50% Max HP, +20% Dodge Chance.',
    rarity: 'rare',
    statModifiers: { resolution: -0.25, dodgeChance: 0.2 }
  },
  dlss_performance: {
    id: 'dlss_performance',
    name: 'DLSS Performance',
    description: 'Slightly blurry upscaling. -10% Resolution, +15% Movement Speed.',
    rarity: 'uncommon',
    statModifiers: { resolution: -0.1, projectileSpeed: 0.15 }
  },
  dead_pixel_artistic: {
    id: 'dead_pixel_artistic',
    name: 'Dead Pixel (Artistic)',
    description: 'A black square covers part of the screen. +100% Damage for shots passing through it.',
    rarity: 'legendary',
    statModifiers: { damage: 1.0 } // Simplified for now
  },
  polygon_decimator: {
    id: 'polygon_decimator',
    name: 'Polygon Decimator',
    description: 'Models look low-poly. -20% Resolution, Enemies explode into shards.',
    rarity: 'uncommon',
    statModifiers: { resolution: -0.2 }
  },
  
  // --- MOBILITY ---
  double_jump: {
    id: 'double_jump',
    name: 'Air Dash Protocol',
    description: 'Defies gravity momentarily. Grants one additional mid-air jump.',
    rarity: 'uncommon',
    statModifiers: {} // Mechanical effect handled in PlayerController
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
      if (plane === '2D') return { ...p, count: p.count * 2, behavior: 'linear' };
      if (plane === 'ISO') return { ...p, count: p.count * 3, behavior: 'linear' };
      return { ...p, count: p.count * 2, behavior: 'homing' };
    },
  },
];

