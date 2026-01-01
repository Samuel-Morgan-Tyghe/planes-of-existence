import { ItemDefinition } from '../types/items';

interface BaseProjectileStats {
  damage: number;
  speed: number;
  size: number;
  color: string;
}

interface ProjectileStats extends BaseProjectileStats {
  // Future properties can be added here (e.g., pierceCount, splitCount, isExplosive)
}

/**
 * Calculates the final stats for a projectile based on the shooter's base stats
 * and any items they are holding.
 */
export function calculateProjectileStats(
  baseStats: BaseProjectileStats,
  heldItemId: string | undefined,
  itemDefinitions: Record<string, ItemDefinition>
): ProjectileStats {
  let { damage, speed, size, color } = baseStats;

  if (heldItemId) {
    const item = itemDefinitions[heldItemId];
    if (item && item.statModifiers) {
      if (item.statModifiers.damage) damage *= (1 + item.statModifiers.damage);
      if (item.statModifiers.projectileSpeed) speed *= (1 + item.statModifiers.projectileSpeed);
      if (item.statModifiers.projectileSize) size *= (1 + item.statModifiers.projectileSize);
      
      // Future: Add logic for other item effects here
      // e.g., if (item.tags.includes('explosive')) ...
    }
  }

  return {
    damage,
    speed,
    size,
    color,
  };
}
