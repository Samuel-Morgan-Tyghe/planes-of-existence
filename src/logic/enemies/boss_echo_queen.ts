import type { EnemyState } from '../../types/enemies';

/**
 * Echo Queen Boss Behavior
 * - Fires waves of echoes (sound waves) in rotating directions
 * - Creates expanding rings of projectiles
 */

interface EchoQueenState {
  rotationAngle: number;
  lastAttackTime: number;
  waveCount: number;
}

const echoQueenStates = new Map<number, EchoQueenState>();

export function updateEchoQueen(
  enemy: EnemyState,
  _playerPosition: [number, number, number],
  delta: number
): { projectiles?: any[] } {
  const now = Date.now();
  
  // Initialize state if needed
  if (!echoQueenStates.has(enemy.id)) {
    echoQueenStates.set(enemy.id, {
      rotationAngle: 0,
      lastAttackTime: now,
      waveCount: 0,
    });
  }
  
  const state = echoQueenStates.get(enemy.id)!;
  const projectiles: any[] = [];
  
  // Rotate continuously
  state.rotationAngle += delta * 2; // 2 radians per second
  
  // Calculate health percentage for scaling difficulty
  const healthPercent = enemy.health / enemy.definition.health;
  
  // Scale attack speed based on health (faster when lower health)
  // 100% HP: 1000ms, 50% HP: 750ms, 0% HP: 500ms
  const attackInterval = 1000 - (1 - healthPercent) * 500;
  
  // Scale number of waves based on health
  // 100% HP: 3 waves, 50% HP: 4 waves, 0% HP: 5 waves
  const numWaves = Math.floor(3 + (1 - healthPercent) * 2);
  
  // Fire rotating waves of echoes
  if (now - state.lastAttackTime > attackInterval) {
    state.waveCount++;
    
    // Create a wave of sound projectiles in a rotating pattern
    const projectilesPerWave = 6;
    
    for (let wave = 0; wave < numWaves; wave++) {
      const waveAngle = state.rotationAngle + (wave * Math.PI * 2) / numWaves;
      
      for (let i = 0; i < projectilesPerWave; i++) {
        const spreadAngle = (i - projectilesPerWave / 2) * 0.3; // Spread within wave
        const angle = waveAngle + spreadAngle;
        
        const direction: [number, number, number] = [
          Math.cos(angle),
          0.5, // Upward arc
          Math.sin(angle)
        ];
        
        projectiles.push({
          origin: [enemy.position[0], enemy.position[1] + 1, enemy.position[2]],
          direction,
          speed: 12,
          damage: enemy.definition.damage,
          color: '#00CED1',
          size: 1.2,
          lifetime: 2.5,
          isSoundWave: true, // Special sound wave type
          hasGravity: true, // Apply gravity for arcing trajectory
        });
      }
    }
    
    state.lastAttackTime = now;
  }
  
  return { projectiles };
}

export function cleanupEchoQueen(enemyId: number) {
  echoQueenStates.delete(enemyId);
}
