import * as THREE from 'three';
import type { EnemyState } from '../../types/enemies';

/**
 * Chess Queen Boss Behavior
 * - Moves in chess patterns: Knight -> Rook -> Pawn -> Queen
 * - Progresses through movement phases as health decreases
 */

type ChessPhase = 'pawn' | 'knight' | 'rook' | 'queen';

interface ChessQueenState {
  phase: ChessPhase;
  lastMoveTime: number;
  targetPosition: [number, number, number] | null;
  moveDelay: number;
}

const chessQueenStates = new Map<number, ChessQueenState>();

export function updateChessQueen(
  enemy: EnemyState,
  playerPosition: [number, number, number],
  delta: number
): { velocity?: [number, number, number] } {
  const now = Date.now();
  
  // Initialize state if needed
  if (!chessQueenStates.has(enemy.id)) {
    chessQueenStates.set(enemy.id, {
      phase: 'pawn',
      lastMoveTime: now,
      targetPosition: null,
      moveDelay: 2000, // 2 seconds between moves
    });
  }
  
  const state = chessQueenStates.get(enemy.id)!;
  
  // Determine phase based on health percentage
  const healthPercent = enemy.health / enemy.definition.health;
  if (healthPercent > 0.75) {
    state.phase = 'pawn';
    state.moveDelay = 2000;
  } else if (healthPercent > 0.5) {
    state.phase = 'knight';
    state.moveDelay = 1500;
  } else if (healthPercent > 0.25) {
    state.phase = 'rook';
    state.moveDelay = 1200;
  } else {
    state.phase = 'queen';
    state.moveDelay = 1000;
  }
  
  // Calculate next move based on phase
  if (now - state.lastMoveTime > state.moveDelay) {
    const currentPos = new THREE.Vector3(...enemy.position);
    const playerPos = new THREE.Vector3(...playerPosition);
    const toPlayer = new THREE.Vector3().subVectors(playerPos, currentPos);
    
    let moveVector = new THREE.Vector3();
    
    switch (state.phase) {
      case 'pawn':
        // Move forward (toward player) in small steps
        moveVector = toPlayer.normalize().multiplyScalar(3);
        break;
        
      case 'knight':
        // L-shaped moves (2 squares one direction, 1 square perpendicular)
        const knightMoves = [
          [2, 1], [2, -1], [-2, 1], [-2, -1],
          [1, 2], [1, -2], [-1, 2], [-1, -2]
        ];
        const knightMove = knightMoves[Math.floor(Math.random() * knightMoves.length)];
        moveVector.set(knightMove[0] * 3, 0, knightMove[1] * 3);
        break;
        
      case 'rook':
        // Straight lines (horizontal or vertical)
        const rookDirection = Math.random() < 0.5 ? 
          (Math.random() < 0.5 ? [1, 0] : [-1, 0]) :
          (Math.random() < 0.5 ? [0, 1] : [0, -1]);
        moveVector.set(rookDirection[0] * 6, 0, rookDirection[1] * 6);
        break;
        
      case 'queen':
        // Any direction (diagonal or straight)
        const queenAngle = Math.atan2(toPlayer.z, toPlayer.x);
        moveVector.set(Math.cos(queenAngle) * 8, 0, Math.sin(queenAngle) * 8);
        break;
    }
    
    state.lastMoveTime = now;
    
    // Return velocity for this move
    const moveSpeed = enemy.definition.speed * 2;
    return {
      velocity: [
        moveVector.x * moveSpeed,
        0,
        moveVector.z * moveSpeed
      ]
    };
  }
  
  return {};
}

export function cleanupChessQueen(enemyId: number) {
  chessQueenStates.delete(enemyId);
}
