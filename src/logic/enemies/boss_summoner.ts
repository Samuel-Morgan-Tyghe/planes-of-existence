import { $currentRoomId, $enemies } from '../../stores/game';
import type { EnemyState } from '../../types/enemies';

/**
 * The Summoner Boss Behavior
 * - Spawns random enemy units to fight alongside it
 * - Summons more enemies as health decreases
 * - Fires weak projectiles while minions do the heavy lifting
 */

interface SummonerState {
  lastSummonTime: number;
  lastAttackTime: number;
  summonedCount: number;
  maxMinions: number;
}

const summonerStates = new Map<number, SummonerState>();

// Enemy types that can be summoned (excluding special/boss enemies)
const SUMMONABLE_ENEMIES = [
  'slime',
  'hopper',
  'turret',
  'spite_bug',
  'echoer',
  'knight',
  'bomber',
  'parasite',
];

export function updateSummoner(
  enemy: EnemyState,
  playerPosition: [number, number, number],
  _delta: number
): { projectiles?: any[]; summonEnemies?: any[] } {
  const now = Date.now();
  
  // Initialize state if needed
  if (!summonerStates.has(enemy.id)) {
    summonerStates.set(enemy.id, {
      lastSummonTime: now,
      lastAttackTime: now,
      summonedCount: 0,
      maxMinions: 3,
    });
  }
  
  const state = summonerStates.get(enemy.id)!;
  const projectiles: any[] = [];
  const summonEnemies: any[] = [];
  
  // Increase max minions as health decreases
  const healthPercent = enemy.health / enemy.definition.health;
  state.maxMinions = Math.floor(3 + (1 - healthPercent) * 5); // 3-8 minions
  
  // Count current minions in the room
  const currentEnemies = $enemies.get();
  const currentRoomId = $currentRoomId.get();
  const currentMinions = currentEnemies.filter(
    e => e.roomId === currentRoomId && !e.isDead && e.id !== enemy.id
  ).length;
  
  // Summon new enemies if below max
  const summonInterval = Math.max(3000, 5000 - (1 - healthPercent) * 2000); // 3-5 seconds
  if (now - state.lastSummonTime > summonInterval && currentMinions < state.maxMinions) {
    const numToSummon = Math.min(2, state.maxMinions - currentMinions);
    
    for (let i = 0; i < numToSummon; i++) {
      // Random enemy type
      const enemyType = SUMMONABLE_ENEMIES[
        Math.floor(Math.random() * SUMMONABLE_ENEMIES.length)
      ];
      
      // Spawn position around the summoner
      const angle = Math.random() * Math.PI * 2;
      const distance = 3 + Math.random() * 2;
      const spawnPos: [number, number, number] = [
        enemy.position[0] + Math.cos(angle) * distance,
        enemy.position[1],
        enemy.position[2] + Math.sin(angle) * distance
      ];
      
      summonEnemies.push({
        type: enemyType,
        position: spawnPos,
      });
    }
    
    state.summonedCount += numToSummon;
    state.lastSummonTime = now;
  }
  
  // Fire weak projectiles at player
  if (now - state.lastAttackTime > 1500) {
    const dx = playerPosition[0] - enemy.position[0];
    const dz = playerPosition[2] - enemy.position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance > 0.1 && distance < 25) {
      const dy = (playerPosition[1] + 1.0) - (enemy.position[1] + 1.5); // Aim at player center from slightly higher origin
      const dist3d = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const direction: [number, number, number] = [
        dx / dist3d,
        dy / dist3d,
        dz / dist3d
      ];
      
      projectiles.push({
        origin: [enemy.position[0], enemy.position[1] + 1.5, enemy.position[2]], // Fire from "eye" height
        direction,
        speed: 10,
        damage: enemy.definition.damage,
        color: '#9370DB',
        size: 0.8,
        lifetime: 2.5,
      });
    }
    
    state.lastAttackTime = now;
  }
  
  return { projectiles, summonEnemies };
}

export function cleanupSummoner(enemyId: number) {
  summonerStates.delete(enemyId);
}
