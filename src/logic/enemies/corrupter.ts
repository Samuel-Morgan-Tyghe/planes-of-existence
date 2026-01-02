import { Vector3 } from 'three';
import { EnemyState } from '../../types/enemies';

interface CorrupterActions {
  emitCorruption: (id: number) => void;
  die: () => void;
}

interface CorrupterResult {
  targetPos: Vector3;
  distanceToTarget: number;
}

/**
 * Handles the specific AI behavior for Corrupter enemies.
 * Targets nearest non-corrupted ally and sacrifices self upon contact.
 */
export function updateCorrupterAI(
  currentPos: Vector3,
  me: EnemyState,
  allEnemies: EnemyState[],
  enemyPositions: Record<number, [number, number, number]>, // New arg
  actions: CorrupterActions
): CorrupterResult | null {
  let nearestAlly: Vector3 | null = null;
  let minAllyDist = Infinity;
  let targetAllyId: number | null = null;

  allEnemies.forEach((e) => {
    // Find active enemies in same room, not self, not corrupted, not other corrupters
    if (e.id !== me.id && 
        e.roomId === me.roomId && 
        !e.isDead && 
        !e.isCorrupted && 
        e.definition.id !== 'corruption') {
      
      // Use live position from map, fallback to state position (spawn/last known)
      const rawPos = enemyPositions[e.id] || e.position;
      const allyPos = new Vector3(rawPos[0], rawPos[1], rawPos[2]);
      
      const dist = currentPos.distanceTo(allyPos);
      if (dist < minAllyDist) {
        minAllyDist = dist;
        nearestAlly = allyPos;
        targetAllyId = e.id;
      }
    }
  });

  if (nearestAlly && targetAllyId !== null) {
    // Corrupt Action: Sacrifice self to corrupt ally
    // Calculate dynamic threshold based on sizes (assuming size ~= diameter, so radius + radius)
    // Add a small buffer to ensure it triggers before physics prevents overlap
    const threshold = (me.definition.size + (allEnemies.find(e => e.id === targetAllyId)?.definition.size || 1.0)) * 0.8 + 0.5;
    
    if (minAllyDist < threshold) {
       console.log(`🟣 Corrupter ${me.id} sacrificing for ally ${targetAllyId}`);
       actions.emitCorruption(targetAllyId);
       actions.die();
    }
    
    return {
      targetPos: nearestAlly,
      distanceToTarget: minAllyDist
    };
  }

  return null; // No target found
}
