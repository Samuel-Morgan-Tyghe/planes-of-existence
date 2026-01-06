
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
  // Base growth rate - slightly higher
  const baseGrowthRate = 0.12; 

  // Quadratic Growth: Multiplier grows faster the longer they live
  // multiplier = 1 + r*t + (r*t)^2
  const rt = timeAliveSeconds * baseGrowthRate;
  const growthMultiplier = 1 + rt + (rt * rt);

  // Default Caps - Increased
  let maxAbsScale = 4.0; 
  let maxSpeed = 8.0; 
  let maxDamage = 100;
  let maxHealthMultiplier = 20.0;
  
  // Custom Caps per Variant
  if (variant === 'growth_harden') {
     maxAbsScale = 1.8; // Grows a bit more now
     maxHealthMultiplier = 100.0; // Truly immortal eventually
     maxDamage = 20; 
  } else if (variant === 'growth_cannon') {
     maxAbsScale = 2.0; 
     maxDamage = 150; // Sniper level damage
     maxHealthMultiplier = 10.0; 
  } else if (variant === 'growth_health') {
     maxAbsScale = 5.0; // Becomes a literal wall
     maxHealthMultiplier = 500.0; // Massive damage soak
  }

  // Dynamic stats
  const maxScaleMultiplier = maxAbsScale / baseSize;
  const currentScale = Math.min(growthMultiplier, maxScaleMultiplier);
  
  // Speed shouldn't get TWO fast (impossible to dodge), so we use a softer growth for it
  const speedMultiplier = 1 + (rt * 0.5); 
  const currentSpeed = Math.min(baseSpeed * speedMultiplier, maxSpeed);
  
  // Cannon/Damage lethality
  const lethalFactor = variant === 'growth_cannon' ? 1.5 : 1.0;
  const damageMultiplier = growthMultiplier * lethalFactor;
  const currentDamage = Math.min(baseDamage * damageMultiplier, maxDamage);
  
  // Harden/Health defense growth
  const defenseFactor = variant === 'growth_harden' ? 2.5 : 1.0;
  const healthGrowth = growthMultiplier * defenseFactor;
  const currentHealthMultiplier = Math.min(healthGrowth, maxHealthMultiplier);

  return {
    scale: currentScale,
    speed: currentSpeed,
    damage: currentDamage,
    healthMultiplier: currentHealthMultiplier
  };
}
