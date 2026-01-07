import type { EnemyState } from '../../types/enemies';

/**
 * The Corrupter Boss Behavior
 * - Stays stationary
 * - Spawns corruption in waves that builds its strength
 * - Fires patterns of projectiles
 */

interface CorrupterState {
  wavePhase: number;
  corruptionCount: number;
  lastCorruptionTime: number;
  lastAttackTime: number;
}

const corrupterStates = new Map<number, CorrupterState>();

export function updateCorrupter(
  enemy: EnemyState,
  _playerPosition: [number, number, number],
  _delta: number
): { projectiles?: any[] } {
  const now = Date.now();
  
  // Initialize state if needed
  if (!corrupterStates.has(enemy.id)) {
    corrupterStates.set(enemy.id, {
      wavePhase: 0,
      corruptionCount: 0,
      lastCorruptionTime: now,
      lastAttackTime: now,
    });
  }
  
  const state = corrupterStates.get(enemy.id)!;
  const projectiles: any[] = [];
  
  // Spawn corruption in waves (every 5 seconds)
  if (now - state.lastCorruptionTime > 5000) {
    state.wavePhase++;
    const waveSize = Math.min(3 + state.wavePhase, 8); // Grows with each wave
    
    // Spawn corruption around the boss
    for (let i = 0; i < waveSize; i++) {
      const angle = (Math.PI * 2 * i) / waveSize;
      const distance = 5 + Math.random() * 5;
      const x = enemy.position[0] + Math.cos(angle) * distance;
      const z = enemy.position[2] + Math.sin(angle) * distance;
      // TODO: Spawn corruption trail at this position
      // This would create a damaging area on the ground
      console.log(`Spawning corruption at [${x}, ${enemy.position[1]}, ${z}]`);
    }
    
    state.corruptionCount += waveSize;
    state.lastCorruptionTime = now;
  }
  
  // Fire projectile patterns (faster with more corruption)
  const fireRate = Math.max(600, 1200 - state.corruptionCount * 50);
  if (now - state.lastAttackTime > fireRate) {
    // Circular pattern of projectiles
    const numProjectiles = 8;
    const rotationOffset = (now / 1000) % (Math.PI * 2); // Slowly rotating pattern
    
    for (let i = 0; i < numProjectiles; i++) {
      const angle = (Math.PI * 2 * i) / numProjectiles + rotationOffset;
      const direction: [number, number, number] = [
        Math.cos(angle),
        0,
        Math.sin(angle)
      ];
      
      projectiles.push({
        origin: [enemy.position[0], enemy.position[1] + 1, enemy.position[2]],
        direction,
        speed: 8,
        damage: enemy.definition.damage,
        color: '#4B0082',
        size: 1.0,
        lifetime: 3.0,
      });
    }
    
    state.lastAttackTime = now;
  }
  
  return { projectiles };
}

export function cleanupCorrupter(enemyId: number) {
  corrupterStates.delete(enemyId);
}
