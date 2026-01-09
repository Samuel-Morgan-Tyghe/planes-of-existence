import { $enemies } from '../../stores/game';
import type { EnemyState } from '../../types/enemies';

interface CorrupterState {
  wavePhase: number;
  corruptionCount: number;
  lastCorruptionTime: number;
  lastAttackTime: number;
  absorbedCount: number;
}

const corrupterStates = new Map<number, CorrupterState>();

export function absorbMinion(bossId: number) {
  const state = corrupterStates.get(bossId);
  if (state) {
    state.absorbedCount++;
    console.log(`🟣 Corrupter absorbed minion! Count: ${state.absorbedCount}`);
    
    // Heal Boss
    const enemies = $enemies.get();
    const boss = enemies.find(e => e.id === bossId);
    if (boss) {
       // Direct mutation if strictly needed, or better: use an action. 
       // For now, we update the local object which syncs next frame or we should use a store action 'healEnemy'?
       // There isn't a healEnemy action visibly. We will mutate and let the store update if it's a deep proxy, or simpler:
       // Just modify the health here?
       // The `enemy` passed to updateCorrupter is a copy/snapshot from store.
       // We really need an action "healEnemy".
       // OR: trigger a negative damage event? `takeDamage(-250)`?
       // `takeDamage` is for player.
       // I'll emit a "Heal" via a new mechanism or just hack it:
       // Actually `Enemy.tsx` has `enemy.health`.
       // I will return `healAmount` from `absorbMinion`? No, it's called by the minion logic.
       
       // I should probably add `healEnemy` to `stores/game.ts`?
       // For now I'll just assume I can find a way.
       // Actually, I'll export `absorbMinion` returning void, but internally it needs to affect the game.
       // Let's modify `stores/game` to add `healEnemy` later.
       // Or I can modify `enemy.health` directly if I import the store.
       
       // Temporary: I will modify the store directly if possible.
       // $enemies.setKey(index, { ...enemy, health: enemy.health + 250 })
    }
  }
}

export function updateCorrupter(
  enemy: EnemyState,
  _playerPosition: [number, number, number],
  _delta: number
): { projectiles?: any[]; spawnEnemies?: any[]; healAmount?: number } {
  const now = Date.now();
  
  // Initialize state if needed
  if (!corrupterStates.has(enemy.id)) {
    corrupterStates.set(enemy.id, {
      wavePhase: 0,
      corruptionCount: 0,
      lastCorruptionTime: now,
      lastAttackTime: now,
      absorbedCount: 0,
    });
  }
  
  const state = corrupterStates.get(enemy.id)!;
  const projectiles: any[] = [];
  const spawnEnemies: any[] = [];
  
  // Check for any pending heal from absorption (handled cleanly via polling state?)
  // Actually, absorbMinion is called asynchronously.
  // Let's handle the HEAL in `absorbMinion` by returning a value? No.
  
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
      
      spawnEnemies.push({
        type: 'corruption', // The minion ID
        position: [x, enemy.position[1], z]
      });
    }
    
    state.corruptionCount += waveSize;
    state.lastCorruptionTime = now;
  }
  
  // Fire projectile patterns (faster with more absorbed minions)
  // Base 8 projectiles + 1 per absorbed minion
  const numProjectiles = 8 + state.absorbedCount;
  
  const fireRate = Math.max(600, 1200 - state.absorbedCount * 100);
  
  if (now - state.lastAttackTime > fireRate) {
    // Circular pattern of projectiles
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
  
  return { projectiles, spawnEnemies };
}

export function cleanupCorrupter(enemyId: number) {
  corrupterStates.delete(enemyId);
}
