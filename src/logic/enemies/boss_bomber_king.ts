import { spawnThrownBomb } from '../../stores/game';
import type { EnemyState } from '../../types/enemies';

/**
 * Bomber King Boss Behavior
 * - Runs super fast in random directions
 * - Throws bombs while moving
 * - Immune to its own bombs
 */

interface BomberKingState {
  currentDirection: [number, number, number];
  lastDirectionChange: number;
  lastBombTime: number;
  directionChangeCooldown: number;
}

const bomberKingStates = new Map<number, BomberKingState>();

export function updateBomberKing(
  enemy: EnemyState,
  _playerPosition: [number, number, number],
  _delta: number
): { velocity?: [number, number, number] } {
  const now = Date.now();
  
  // Initialize state if needed
  if (!bomberKingStates.has(enemy.id)) {
    const randomAngle = Math.random() * Math.PI * 2;
    bomberKingStates.set(enemy.id, {
      currentDirection: [Math.cos(randomAngle), 0, Math.sin(randomAngle)],
      lastDirectionChange: now,
      lastBombTime: now,
      directionChangeCooldown: 1000 + Math.random() * 1000, // 1-2 seconds
    });
  }
  
  const state = bomberKingStates.get(enemy.id)!;
  
  // Change direction randomly
  if (now - state.lastDirectionChange > state.directionChangeCooldown) {
    const randomAngle = Math.random() * Math.PI * 2;
    state.currentDirection = [Math.cos(randomAngle), 0, Math.sin(randomAngle)];
    state.lastDirectionChange = now;
    state.directionChangeCooldown = 1000 + Math.random() * 1000;
  }
  
  // Throw bombs while running
  if (now - state.lastBombTime > 800) {
    // Throw bomb in a random direction
    const throwAngle = Math.random() * Math.PI * 2;
    const throwDirection: [number, number, number] = [
      Math.cos(throwAngle),
      0,
      Math.sin(throwAngle)
    ];
    
    const bombPosition: [number, number, number] = [
      enemy.position[0],
      enemy.position[1] + 1,
      enemy.position[2]
    ];
    
    const throwVelocity: [number, number, number] = [
      throwDirection[0] * 12,
      4, // Upward arc
      throwDirection[2] * 12
    ];
    
    spawnThrownBomb(bombPosition, throwDirection, throwVelocity, 2.0);
    state.lastBombTime = now;
  }
  
  // Return velocity for fast movement
  const speed = enemy.definition.speed;
  return {
    velocity: [
      state.currentDirection[0] * speed,
      0,
      state.currentDirection[2] * speed
    ]
  };
}

export function cleanupBomberKing(enemyId: number) {
  bomberKingStates.delete(enemyId);
}
