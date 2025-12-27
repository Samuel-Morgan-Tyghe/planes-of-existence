import { $inventory, $plane, $stats } from '../stores/game';
import type { PlaneType, ProjectileData } from '../types/game';
import { ITEM_DEFINITIONS, SYNERGY_DEFINITIONS } from '../types/items';

const BASE_DAMAGE = 10;

/**
 * Calculate damage based on player stats
 */
export function calculateDamage(): number {
  const stats = $stats.get();
  const base = BASE_DAMAGE;
  const critChance = stats.sharpness;
  const elementalBonus = stats.saturation * 3;
  
  // Random crit based on sharpness
  const isCrit = Math.random() < critChance;
  const critMultiplier = isCrit ? 2 : 1;
  
  return (base + elementalBonus) * critMultiplier;
}

/**
 * Apply item effects to projectile data
 */
export function applyItemEffects(
  baseProjectile: ProjectileData,
  plane: PlaneType
): ProjectileData {
  const inventory = $inventory.get();
  let projectile = { ...baseProjectile };

  // Apply base item effects
  Object.keys(inventory).forEach((itemId) => {
    const item = ITEM_DEFINITIONS[itemId];
    if (!item) return;

    // Apply base effect
    if (item.baseEffect) {
      projectile = item.baseEffect(projectile);
    }

    // Apply plane-specific effect
    if (item.planeEffects?.[plane]) {
      projectile = item.planeEffects[plane]!(projectile);
    }
  });

  // Check for synergies
  const activeSynergies = SYNERGY_DEFINITIONS.filter((synergy) => {
    return synergy.requiredItems.every((itemId) => inventory[itemId] > 0);
  });

  // Apply synergy effects (synergies override base effects)
  activeSynergies.forEach((synergy) => {
    projectile = synergy.effect(projectile, plane);
  });

  return projectile;
}

/**
 * Create base projectile data
 */
export function createBaseProjectile(
  direction: [number, number, number]
): ProjectileData {
  const stats = $stats.get();

  return {
    speed: 8 + stats.sharpness * 3, // Visible speed - can see them travel across screen
    damage: calculateDamage(),
    behavior: 'linear',
    count: 1,
    direction,
  };
}

/**
 * Fire weapon - returns projectile data ready to spawn
 */
export function fireWeapon(origin: [number, number, number], direction: [number, number, number]): ProjectileData[] {
  const plane = $plane.get();
  const inventory = $inventory.get();
  const baseProjectile = createBaseProjectile(direction);
  const modifiedProjectile = applyItemEffects(baseProjectile, plane);

  // Check if RGB split is active
  const hasRGBSplit = inventory['rgb_split'] > 0;
  const rgbColors = ['#ff0000', '#00ff00', '#0000ff']; // Red, Green, Blue

  // Generate multiple projectiles based on count
  const projectiles: ProjectileData[] = [];

  for (let i = 0; i < modifiedProjectile.count; i++) {
    let dir = [...direction] as [number, number, number];

    // Modify direction based on plane and item effects
    if (plane === '2D') {
      // Horizontal spread for 2D
      if (modifiedProjectile.count > 1) {
        const spread = (i - (modifiedProjectile.count - 1) / 2) * 0.2;
        dir = [direction[0] + spread, direction[1], direction[2]];
      }
    } else if (plane === 'ISO') {
      // Circular spread for ISO
      if (modifiedProjectile.count > 1) {
        const angle = (i / modifiedProjectile.count) * Math.PI * 2;
        dir = [Math.cos(angle), direction[1], Math.sin(angle)];
      }
    } else if (plane === 'FPS') {
      // Vertical spread for FPS
      if (modifiedProjectile.count > 1) {
        const spread = (i - (modifiedProjectile.count - 1) / 2) * 0.1;
        dir = [direction[0], direction[1] + spread, direction[2]];
      }
    }

    projectiles.push({
      ...modifiedProjectile,
      direction: dir,
      // Assign RGB colors if RGB split is active
      color: hasRGBSplit ? rgbColors[i % rgbColors.length] : undefined,
    });
  }

  return projectiles;
}

