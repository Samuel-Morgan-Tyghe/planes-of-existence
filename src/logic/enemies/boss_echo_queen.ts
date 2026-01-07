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
  playerPosition: [number, number, number],
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
  
  // Fire rotating waves of echoes
  if (now - state.lastAttackTime > 1000) {
    state.waveCount++;
    
    // Create a wave of sound projectiles in a rotating pattern
    const numWaves = 3; // Three waves at different angles
    const projectilesPerWave = 6;
    
    for (let wave = 0; wave < numWaves; wave++) {
      const waveAngle = state.rotationAngle + (wave * Math.PI * 2) / numWaves;
      
      for (let i = 0; i < projectilesPerWave; i++) {
        const spreadAngle = (i - projectilesPerWave / 2) * 0.3; // Spread within wave
        const angle = waveAngle + spreadAngle;
        
        const direction: [number, number, number] = [
          Math.cos(angle),
          0,
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
