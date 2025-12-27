/**
 * Game Variables Registry
 * 
 * This file defines TypeScript types for all game variables
 * that can be modified by items, modifiers, and game mechanics.
 */

// ============================================================================
// Rendering Variables (Artistic Stats)
// ============================================================================

export interface RenderingVariables {
  /** 0.0 - 1.0: Edges become crisp; Armor Penetration & Crit */
  sharpness: number;
  
  /** 0.0 - 2.0: Colors become vivid; Elemental Intensity */
  saturation: number;
  
  /** 0.0 - 1.0: Darks get darker, lights get lighter; Loot/Trap Detection */
  contrast: number;
  
  /** 0.0 - 2.0: Overall exposure; Aggro Radius (Stealth/Taunt) */
  brightness: number;
  
  /** 0.1 - 1.0: Pixel count; Structural Integrity (Max HP) */
  resolution: number;
  
  /** 0.5 - 2.0: Mid-tone balance; Luck / Drop Rates */
  gamma: number;
}

// ============================================================================
// Physics Variables (Engine Glitches)
// ============================================================================

export interface PhysicsVariables {
  /** 0.016 - 0.1: Animation smoothness; Tunneling Chance */
  timeStep: number;
  
  /** 0.1 - 2.0: Hitbox size multiplier; Precision vs Safety */
  hitboxScale: number;
  
  /** 0.0 - 1.0: Surface friction; Control (Ice to Sandpaper) */
  friction: number;
  
  /** 0.0 - 1.0: Bounce factor; Knockback */
  restitution: number;
  
  /** -1.0 - 2.0: Gravity multiplier; Verticality */
  gravityScale: number;
}

// ============================================================================
// System Variables (Meta-State)
// ============================================================================

export interface SystemVariables {
  /** 0.0 - 1.0: Simulation stability; Risk vs Reward */
  systemStability: number;
  
  /** 0.0 - 1.0: Input delay in seconds; "Echo" Attacks */
  latency: number;
  
  /** 5.0 - 100.0: Render distance in meters; Enemy Spawn Rate */
  renderDistance: number;
}

// ============================================================================
// Perspective Variables (Camera Lenses)
// ============================================================================

export interface PerspectiveVariables {
  /** 30 - 120: Field of view in degrees; Speed Perception */
  fov: number;
  
  /** boolean: Depth lock; 2D/3D Toggle */
  zLock: boolean;
  
  /** 0 - 360: Camera rotation in degrees; Secret Reveal */
  cameraAngle: number;
}

// ============================================================================
// Combined Game Variables
// ============================================================================

export interface GameVariables {
  rendering: RenderingVariables;
  physics: PhysicsVariables;
  system: SystemVariables;
  perspective: PerspectiveVariables;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_RENDERING: RenderingVariables = {
  sharpness: 0.5,
  saturation: 1.0,
  contrast: 0.5,
  brightness: 1.0,
  resolution: 1.0,
  gamma: 1.0,
};

export const DEFAULT_PHYSICS: PhysicsVariables = {
  timeStep: 0.016, // 60fps
  hitboxScale: 1.0,
  friction: 0.5,
  restitution: 0.0,
  gravityScale: 1.0,
};

export const DEFAULT_SYSTEM: SystemVariables = {
  systemStability: 1.0,
  latency: 0.0,
  renderDistance: 50.0,
};

export const DEFAULT_PERSPECTIVE: PerspectiveVariables = {
  fov: 75,
  zLock: false,
  cameraAngle: 0,
};

export const DEFAULT_GAME_VARIABLES: GameVariables = {
  rendering: DEFAULT_RENDERING,
  physics: DEFAULT_PHYSICS,
  system: DEFAULT_SYSTEM,
  perspective: DEFAULT_PERSPECTIVE,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clamp a value to a valid range
 */
export function clampRenderingVariable<K extends keyof RenderingVariables>(
  key: K,
  value: number
): number {
  const ranges: Record<keyof RenderingVariables, [number, number]> = {
    sharpness: [0.0, 1.0],
    saturation: [0.0, 2.0],
    contrast: [0.0, 1.0],
    brightness: [0.0, 2.0],
    resolution: [0.1, 1.0],
    gamma: [0.5, 2.0],
  };
  
  const [min, max] = ranges[key];
  return Math.max(min, Math.min(max, value));
}

export function clampPhysicsVariable<K extends keyof PhysicsVariables>(
  key: K,
  value: number
): number {
  const ranges: Record<keyof PhysicsVariables, [number, number]> = {
    timeStep: [0.016, 0.1],
    hitboxScale: [0.1, 2.0],
    friction: [0.0, 1.0],
    restitution: [0.0, 1.0],
    gravityScale: [-1.0, 2.0],
  };
  
  const [min, max] = ranges[key];
  return Math.max(min, Math.min(max, value));
}

export function clampSystemVariable<K extends keyof SystemVariables>(
  key: K,
  value: number
): number {
  const ranges: Record<keyof SystemVariables, [number, number]> = {
    systemStability: [0.0, 1.0],
    latency: [0.0, 1.0],
    renderDistance: [5.0, 100.0],
  };
  
  const [min, max] = ranges[key];
  return Math.max(min, Math.min(max, value));
}

