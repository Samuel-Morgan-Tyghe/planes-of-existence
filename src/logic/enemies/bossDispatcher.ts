import type { EnemyState } from '../../types/enemies';
import { updateBomberKing } from './boss_bomber_king';
import { updateChessQueen } from './boss_chess_queen';
import { updateCorrupter } from './boss_corrupter';
import { updateEchoQueen } from './boss_echo_queen';
import { updateMegaSnake } from './boss_mega_snake';
import { updateSummoner } from './boss_summoner';
import { updateWeaverBoss, type WeaverBossState } from './boss_weaver';

/**
 * Boss Behavior Dispatcher
 * Routes boss updates to the appropriate behavior function
 */

export interface BossUpdateResult {
  velocity?: [number, number, number];
  projectiles?: any[];
  summonEnemies?: any[];
  // Weaver-specific
  newBossState?: WeaverBossState;
  colorOverride?: string;
  sizeOverride?: number;
  isBlinking?: boolean;
}

export function updateBoss(
  enemy: EnemyState,
  playerPosition: [number, number, number],
  delta: number,
  // Weaver-specific state
  weaverState?: WeaverBossState,
  elapsedTime?: number,
  enemyVec?: any
): BossUpdateResult {
  
  switch (enemy.definition.id) {
    case 'weaver':
      if (!weaverState || !elapsedTime || !enemyVec) {
        console.warn('Weaver boss missing required state');
        return {};
      }
      const weaverResult = updateWeaverBoss(
        enemy,
        { toArray: () => playerPosition } as any,
        enemyVec,
        elapsedTime,
        delta,
        weaverState
      );
      return {
        velocity: [weaverResult.velocity.x, weaverResult.velocity.y, weaverResult.velocity.z],
        projectiles: weaverResult.projectiles,
        newBossState: weaverResult.newBossState,
        colorOverride: weaverResult.colorOverride,
        sizeOverride: weaverResult.sizeOverride,
        isBlinking: weaverResult.newBossState.isBlinking,
      };
      
    case 'corrupter':
      return updateCorrupter(enemy, playerPosition, delta);
      
    case 'echo_queen':
      return updateEchoQueen(enemy, playerPosition, delta);
      
    case 'chess_queen':
      return updateChessQueen(enemy, playerPosition, delta);
      
    case 'bomber_king':
      return updateBomberKing(enemy, playerPosition, delta);
      
    case 'mega_snake':
      return updateMegaSnake(enemy, playerPosition, delta);
      
    case 'summoner':
      return updateSummoner(enemy, playerPosition, delta);
      
    default:
      console.warn(`Unknown boss type: ${enemy.definition.id}`);
      return {};
  }
}

export const BOSS_IDS = ['weaver', 'corrupter', 'echo_queen', 'chess_queen', 'bomber_king', 'mega_snake', 'summoner'];

export function isBoss(enemyId: string): boolean {
  return BOSS_IDS.includes(enemyId);
}
