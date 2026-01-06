import { Vector3 } from 'three';
import { calculateProjectileStats } from '../utils/combat'; // Reusing this utility if needed, or import from where it lives. 
// Wait, calculateProjectileStats is in Enemy.tsx? No, it's imported.
// Let's check imports in Enemy.tsx first.

// Checks imports in Enemy.tsx:
// import { calculateProjectileStats } from '../../utils/enemyUtils'; 
// Ah, it is in utils. 

import { EnemyState } from '../types/enemies';
import { ItemDefinition } from '../types/items';

// Interface for the result of the pattern calculation
export interface ProjectileSpawnData {
  origin: [number, number, number];
  direction: [number, number, number];
  type: 'normal' | 'soundwave';
  damage: number;
  speed: number;
  color: string;
  size: number;
  lifetime?: number;
}

/**
 * Calculates the projectile patterns for an enemy attack.
 * Returns an array of projectile data to be spawned.
 */
export function calculateEnemyAttackPattern(
  enemy: EnemyState,
  playerPos: Vector3,
  enemyVec: Vector3,
  itemDefinitions: Record<string, ItemDefinition>
): ProjectileSpawnData[] {
  const direction = new Vector3().subVectors(playerPos, enemyVec).normalize();
  const spawnOffset = enemy.definition.size * 2.0; // Distance from center to spawn projectile
  const results: ProjectileSpawnData[] = [];

  const type = enemy.definition.id === 'echoer' ? 'soundwave' : 'normal';

  if (enemy.definition.id === 'nova') {
    // Nova Logic: Fire 8 projectiles in all directions
    const numProjectiles = 8;
    for (let i = 0; i < numProjectiles; i++) {
      const angle = (i * 2 * Math.PI) / numProjectiles;
      const dir = new Vector3(1, 0, 0).applyAxisAngle(new Vector3(0, 1, 0), angle);

      const projOrigin: [number, number, number] = [
        enemyVec.x + dir.x * spawnOffset,
        1.0,
        enemyVec.z + dir.z * spawnOffset,
      ];

      results.push({
        origin: projOrigin,
        direction: [dir.x, dir.y, dir.z],
        type: 'normal',
        damage: enemy.definition.damage,
        speed: enemy.definition.projectileSpeed || 12, // Faster initial burst
        color: enemy.definition.color,
        size: enemy.definition.projectileSize || 0.8,
        lifetime: 0.6, // Short range
      });
    }
  } else if (enemy.definition.id === 'flanker') {
    // Flanker Logic: Fire 2 projectiles, angled +/- 15 degrees from target
    const angleOffset = Math.PI / 12; // 15 degrees

    const dirs = [
      new Vector3(direction.x, 0, direction.z).applyAxisAngle(new Vector3(0, 1, 0), angleOffset),
      new Vector3(direction.x, 0, direction.z).applyAxisAngle(new Vector3(0, 1, 0), -angleOffset),
    ];

    dirs.forEach((dir) => {
      const projOrigin: [number, number, number] = [
        enemyVec.x + dir.x * spawnOffset,
        1.0,
        enemyVec.z + dir.z * spawnOffset,
      ];

      results.push({
        origin: projOrigin,
        direction: [dir.x, dir.y, dir.z],
        type: 'normal',
        damage: enemy.definition.damage,
        speed: enemy.definition.projectileSpeed || 10,
        color: enemy.definition.color,
        size: enemy.definition.projectileSize || 1.0,
      });
    });
  } else {
    // Standard Single Shot logic
    const projOrigin: [number, number, number] = [
      enemyVec.x + direction.x * spawnOffset,
      1.0,
      enemyVec.z + direction.z * spawnOffset,
    ];

    // Calculate stats based on held item
    const { damage, speed, size, color } = calculateProjectileStats(
      {
        damage: enemy.definition.damage,
        speed: enemy.definition.projectileSpeed || 10,
        size: enemy.definition.projectileSize || 1.0,
        color: enemy.definition.color,
      },
      enemy.heldItem,
      itemDefinitions
    );

    results.push({
      origin: projOrigin,
      direction: [direction.x, direction.y, direction.z],
      type: type as 'normal' | 'soundwave',
      damage: damage,
      speed: speed,
      color: color,
      size: size,
    });
  }

  return results;
}
