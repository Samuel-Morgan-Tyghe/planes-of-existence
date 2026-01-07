import { spawnThrownBomb } from '../../stores/game';
import type { EnemyState } from '../../types/enemies';

/**
 * Mega Snake Boss Behavior
 * - Moves in a snake-like pattern
 * - Leaves a trail of bombs behind it
 * - Can be hurt by its own bombs
 * - Has segments that can split off
 */

export interface SnakeSegment {
  position: [number, number, number];
  timestamp: number;
}

interface MegaSnakeState {
  segments: SnakeSegment[];
  lastBombTime: number;
  moveDirection: [number, number, number];
  lastDirectionChange: number;
  splitCount: number;
}

const megaSnakeStates = new Map<number, MegaSnakeState>();

export function updateMegaSnake(
  enemy: EnemyState,
  playerPosition: [number, number, number],
  _delta: number
): { velocity?: [number, number, number]; segments?: SnakeSegment[] } {
  const now = Date.now();
  
  // Initialize state if needed
  if (!megaSnakeStates.has(enemy.id)) {
    megaSnakeStates.set(enemy.id, {
      segments: [],
      lastBombTime: now,
      moveDirection: [1, 0, 0],
      lastDirectionChange: now,
      splitCount: 0,
    });
  }
  
  const state = megaSnakeStates.get(enemy.id)!;
  
  // Add current position to segments trail
  state.segments.push({
    position: [...enemy.position],
    timestamp: now
  });
  
  // Keep only recent segments (last 3 seconds)
  state.segments = state.segments.filter(seg => now - seg.timestamp < 3000);
  
  // Change direction smoothly toward player
  if (now - state.lastDirectionChange > 500) {
    const dx = playerPosition[0] - enemy.position[0];
    const dz = playerPosition[2] - enemy.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > 0.1) {
      // Smoothly turn toward player
      const targetDir: [number, number, number] = [dx / distance, 0, dz / distance];
      
      // Blend current direction with target direction for smooth turning
      state.moveDirection = [
        state.moveDirection[0] * 0.7 + targetDir[0] * 0.3,
        0,
        state.moveDirection[2] * 0.7 + targetDir[2] * 0.3
      ];
      
      // Normalize
      const mag = Math.sqrt(
        state.moveDirection[0] ** 2 + state.moveDirection[2] ** 2
      );
      state.moveDirection = [
        state.moveDirection[0] / mag,
        0,
        state.moveDirection[2] / mag
      ];
    }
    
    state.lastDirectionChange = now;
  }
  
  // Drop bombs along the trail
  const bombInterval = 400 - state.splitCount * 50; // Faster with more splits
  if (now - state.lastBombTime > Math.max(200, bombInterval)) {
    const bombPosition: [number, number, number] = [
      enemy.position[0],
      enemy.position[1] + 0.5,
      enemy.position[2]
    ];
    
    // Drop bomb with minimal velocity (just falls)
    spawnThrownBomb(bombPosition, [0, 0, 0], [0, 0, 0], 1.5);
    state.lastBombTime = now;
  }
  
  // Check for splits when damaged (every 25% health lost)
  const healthPercent = enemy.health / enemy.definition.health;
  const expectedSplits = Math.floor((1 - healthPercent) * 4);
  
  if (expectedSplits > state.splitCount) {
    state.splitCount = expectedSplits;
    // Split effect: drop extra bombs in a circle
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      const offset = 2;
      const splitBombPos: [number, number, number] = [
        enemy.position[0] + Math.cos(angle) * offset,
        enemy.position[1] + 0.5,
        enemy.position[2] + Math.sin(angle) * offset
      ];
      spawnThrownBomb(splitBombPos, [0, 0, 0], [0, 0, 0], 2.0);
    }
  }
  
  // Return velocity for snake movement and segments for rendering
  const speed = enemy.definition.speed;
  return {
    velocity: [
      state.moveDirection[0] * speed,
      0,
      state.moveDirection[2] * speed
    ],
    segments: state.segments
  };
}

export function cleanupMegaSnake(enemyId: number) {
  megaSnakeStates.delete(enemyId);
}
