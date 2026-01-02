
export interface GrowthStats {
  scale: number;
  speed: number;
  damage: number;
  healthMultiplier: number;
}

/**
 * Calculates the current stats for a Growth Bug based on its variant and time alive.
 * 
 * @param variant The enemy ID variant ('growth_health', 'growth_harden', 'growth_cannon')
 * @param timeAliveSeconds How long the enemy has been alive in seconds
 * @param baseSize Base size from definition (to check caps)
 * @param baseSpeed Base speed from definition
 * @param baseDamage Base damage from definition
 * @returns Object containing current scale multiplier, speed, damage, and health multiplier
 */
export function calculateGrowthStats(
  variant: string,
  timeAliveSeconds: number,
  baseSize: number,
  baseSpeed: number,
  baseDamage: number
): GrowthStats {
  // Base growth rate
  const growthRate = 0.1; // 10% per second relative to base

  // Default Caps
  let maxAbsScale = 2.5; 
  let maxSpeed = 5.0; 
  let maxDamage = 25;
  let maxHealthMultiplier = 10.0;
  
  // Custom Caps per Variant
  if (variant === 'growth_harden') {
     maxAbsScale = 1.2; // Stays smaller
     maxHealthMultiplier = 50.0; // Extremely tanky
     maxDamage = 10; // Low damage cap
  } else if (variant === 'growth_cannon') {
     maxAbsScale = 1.5; // Moderate size
     maxDamage = 50; // High damage cap (ranged)
     maxHealthMultiplier = 5.0; // Less tanky
  } else if (variant === 'growth_health') {
     maxAbsScale = 3.0; // Huge
     maxHealthMultiplier = 20.0; // Very tanky via HP
  }

  // Calculate generic growth multiplier (time-based linear growth)
  const growthMultiplier = 1 + (timeAliveSeconds * growthRate);

  // Dynamic stats
  
  const maxScaleMultiplier = maxAbsScale / baseSize;
  const currentScale = Math.min(growthMultiplier, maxScaleMultiplier);
  
  const currentSpeed = Math.min(baseSpeed * growthMultiplier, maxSpeed);
  
  // Cannon grows damage faster
  const damageMultiplier = variant === 'growth_cannon' ? growthMultiplier * 1.5 : growthMultiplier;
  const currentDamage = Math.min(baseDamage * damageMultiplier, maxDamage);
  
  // Harden grows defense faster
  const defenseMultiplier = variant === 'growth_harden' ? growthMultiplier * 2.0 : growthMultiplier;
  const currentHealthMultiplier = Math.min(defenseMultiplier, maxHealthMultiplier);

  return {
    scale: currentScale,
    speed: currentSpeed,
    damage: currentDamage,
    healthMultiplier: currentHealthMultiplier
  };
}
