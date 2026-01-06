import { Vector3 } from 'three';
import { EnemyState } from '../../types/enemies';
import { ProjectileSpawnData } from '../enemyPatterns';

export interface WeaverBossState {
  phase: 1 | 2 | 3 | 4;
  attackTimer: number;
  patternIndex: number;
  rotationAngle: number;
  isBlinking: boolean;
  blinkCooldown: number;
}

/**
 * Custom logic for The Glitch Weaver boss
 */
export function updateWeaverBoss(
  enemy: EnemyState,
  playerPos: Vector3,
  enemyVec: Vector3,
  time: number,
  delta: number,
  bossState: WeaverBossState
): {
  velocity: Vector3;
  projectiles: ProjectileSpawnData[];
  newBossState: WeaverBossState;
  colorOverride?: string;
  sizeOverride?: number;
} {
  const hpPercent = enemy.health / enemy.definition.health;
  let phase: 1 | 2 | 3 | 4 = 1;
  if (hpPercent < 0.1) phase = 4;
  else if (hpPercent < 0.3) phase = 3;
  else if (hpPercent < 0.7) phase = 2;

  const velocity = new Vector3(0, 0, 0);
  const projectiles: ProjectileSpawnData[] = [];
  const nextBossState = { ...bossState, phase };

  // 1. MOVEMENT LOGIC
  if (phase === 1) {
    // slow orbit around player
    const orbitRadius = 10;
    const angle = time * 0.5;
    const targetOrbitPos = new Vector3(
      playerPos.x + Math.cos(angle) * orbitRadius,
      0.5,
      playerPos.z + Math.sin(angle) * orbitRadius
    );
    velocity.subVectors(targetOrbitPos, enemyVec).normalize().multiplyScalar(enemy.definition.speed);
  } else if (phase === 2) {
    // Random erratic movement
    const jitter = Math.sin(time * 2) * 2;
    const dir = new Vector3().subVectors(playerPos, enemyVec).normalize();
    velocity.set(dir.x * enemy.definition.speed, 0, dir.z * enemy.definition.speed);
    velocity.add(new Vector3(Math.cos(time) * jitter, 0, Math.sin(time) * jitter));
  } else if (phase === 3) {
    // Aggressive pursuit + Blinking
    velocity.subVectors(playerPos, enemyVec).normalize().multiplyScalar(enemy.definition.speed * 2.5);
    
    nextBossState.blinkCooldown -= delta;
    if (nextBossState.blinkCooldown <= 0) {
      nextBossState.isBlinking = true;
      nextBossState.blinkCooldown = 3.0; // 3 second cooldown
    } else {
      nextBossState.isBlinking = false;
    }
  } else if (phase === 4) {
    // Drift slowly towards player
    velocity.subVectors(playerPos, enemyVec).normalize().multiplyScalar(enemy.definition.speed * 0.5);
  }

  // 2. ATTACK LOGIC (Projectiles)
  nextBossState.attackTimer -= delta;
  nextBossState.rotationAngle += delta * 2;

  if (nextBossState.attackTimer <= 0) {
    const fireRate = phase === 4 ? 0.15 : phase === 3 ? 0.3 : phase === 2 ? 0.6 : 1.0;
    nextBossState.attackTimer = fireRate;

    if (phase === 1) {
      // Spiral Pattern
      const numProjectiles = 4;
      for (let i = 0; i < numProjectiles; i++) {
        const angle = nextBossState.rotationAngle + (i * Math.PI * 2) / numProjectiles;
        const dir = new Vector3(Math.cos(angle), 0, Math.sin(angle));
        projectiles.push({
          origin: [enemyVec.x + dir.x * 2, 1.0, enemyVec.z + dir.z * 2],
          direction: [dir.x, 0, dir.z],
          type: 'normal',
          damage: enemy.definition.damage,
          speed: 8,
          color: '#8A2BE2',
          size: 1.2
        });
      }
    } else if (phase === 2) {
      // Ring + Target
      const numProjectiles = 12;
      for (let i = 0; i < numProjectiles; i++) {
        const angle = (i * Math.PI * 2) / numProjectiles;
        const dir = new Vector3(Math.cos(angle), 0, Math.sin(angle));
        projectiles.push({
          origin: [enemyVec.x + dir.x * 2, 1.0, enemyVec.z + dir.z * 2],
          direction: [dir.x, 0, dir.z],
          type: 'normal',
          damage: enemy.definition.damage,
          speed: 10,
          color: '#00FFFF',
          size: 1.0
        });
      }
      // Target shot
      const dirPlayer = new Vector3().subVectors(playerPos, enemyVec).normalize();
      projectiles.push({
        origin: [enemyVec.x + dirPlayer.x * 2, 1.0, enemyVec.z + dirPlayer.z * 2],
        direction: [dirPlayer.x, 0, dirPlayer.z],
        type: 'normal',
        damage: enemy.definition.damage * 1.5,
        speed: 15,
        color: '#FF0000',
        size: 1.5
      });
    } else if (phase === 3) {
      // Rapid Chaos
      const numProjectiles = 6;
      for (let i = 0; i < numProjectiles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dir = new Vector3(Math.cos(angle), 0, Math.sin(angle));
        projectiles.push({
          origin: [enemyVec.x + dir.x * 1, 1.0, enemyVec.z + dir.z * 1],
          direction: [dir.x, 0, dir.z],
          type: 'normal',
          damage: enemy.definition.damage,
          speed: 12 + Math.random() * 8,
          color: Math.random() > 0.5 ? '#FF00FF' : '#4B0082',
          size: 0.8,
          lifetime: 3.0
        });
      }
    } else if (phase === 4) {
      // GLITCH OVERLOAD: Rapid 16-way oscillating fire
      const numProjectiles = 16;
      const swirl = Math.sin(time * 5) * 1.0;
      for (let i = 0; i < numProjectiles; i++) {
        const angle = (i * Math.PI * 2) / numProjectiles + swirl;
        const dir = new Vector3(Math.cos(angle), 0, Math.sin(angle));
        projectiles.push({
          origin: [enemyVec.x + dir.x * 1, 1.0, enemyVec.z + dir.z * 1],
          direction: [dir.x, 0, dir.z],
          type: 'normal',
          damage: enemy.definition.damage * 0.8,
          speed: 10,
          color: time % 0.2 > 0.1 ? '#FFFFFF' : '#00FFFF',
          size: 0.7,
          lifetime: 2.0
        });
      }
    }
  }

  // Visual Overrides
  const colorOverride = phase === 4 ? (time % 0.2 > 0.1 ? '#FFFFFF' : '#00FFFF') : phase === 3 ? '#FF0000' : phase === 2 ? '#4B0082' : '#8A2BE2';
  const sizeOverride = phase === 4 ? enemy.definition.size * 1.5 : phase === 3 ? enemy.definition.size * 1.2 : phase === 2 ? enemy.definition.size * 1.1 : enemy.definition.size;

  return { velocity, projectiles, newBossState: nextBossState, colorOverride, sizeOverride };
}
