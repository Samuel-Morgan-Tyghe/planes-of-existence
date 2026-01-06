import { Vector3 } from 'three';
import { EnemyState } from '../../types/enemies';
import { getBomberVelocity } from './behaviors/bomber';
import { getHopperVelocity } from './behaviors/hopper';
import { getKnightVelocity } from './behaviors/knight';
import { getNovaVelocity } from './behaviors/nova';
import { getParasiteVelocity } from './behaviors/parasite';
import { getSlimeVelocity } from './behaviors/slime';
import { getTurretVelocity } from './behaviors/turret';

export function calculateEnemyVelocity(
  enemy: EnemyState,
  playerPos: Vector3,
  enemyVec: Vector3,
  distance: number,
  dynamicSpeed?: number
): Vector3 {
  const speed = dynamicSpeed || enemy.definition.speed;
  const isRanged = enemy.definition.attackType === 'ranged' || !!enemy.heldItem;
  
  const attackRange = isRanged ? (enemy.definition.attackRange || 15) : 2; 


  // 1. Stationary Enemies
  if (enemy.definition.id === 'turret') {
    return getTurretVelocity();
  }
  
  // 2. Hopper Logic (Handles its own idle/detect state)
  if (enemy.definition.id === 'hopper') {
     const baseDirection = new Vector3().subVectors(playerPos, enemyVec).normalize();
     return getHopperVelocity(baseDirection, distance, 15, speed); 
  }
  
  // 3. Knight Logic
  if (enemy.definition.id === 'knight') {
     const baseDirection = new Vector3().subVectors(playerPos, enemyVec).normalize();
     return getKnightVelocity(baseDirection, distance, 20, speed, enemy.id); 
  }

  // 4. Bomber logic
  if (enemy.definition.id === 'bomber' || enemy.definition.id === 'demolisher' || enemy.definition.id === 'bombardier') {
    const baseDirection = new Vector3().subVectors(playerPos, enemyVec).normalize();
    return getBomberVelocity(baseDirection, distance, attackRange, speed);
  }

  // 5. Slime logic
  if (enemy.definition.id.startsWith('slime_')) {
    const baseDirection = new Vector3().subVectors(playerPos, enemyVec).normalize();
    return getSlimeVelocity(baseDirection, distance, 6.0, speed);
  }

  // 6. Nova logic
  if (enemy.definition.id === 'nova') {
    return getNovaVelocity(speed, enemy.id);
  }

  // 3. Ranged Positioning (Stop at max range)
  if (isRanged && distance > attackRange * 0.7 && distance <= attackRange) {
     return new Vector3(0, 0, 0);
  }

  // 4. Melee Positioning (Stop when in hitting range)
  if (!isRanged && distance <= attackRange) {
     if (enemy.definition.id !== 'parasite' && enemy.definition.id !== 'hopper' && enemy.definition.id !== 'knight' && enemy.definition.id !== 'reactive_bug') {
        return new Vector3(0, 0, 0);
     }
  }

  // Calculation Base Direction
  const baseDirection = new Vector3().subVectors(playerPos, enemyVec).normalize();
  let finalDirection = baseDirection;

  // 5. Specific Movement Behaviors
  if (enemy.definition.id === 'parasite') {
      finalDirection = getParasiteVelocity(baseDirection);
  }

  return finalDirection.multiplyScalar(speed);
}
