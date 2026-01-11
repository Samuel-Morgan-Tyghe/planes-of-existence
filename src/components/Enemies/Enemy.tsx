import { useFrame } from '@react-three/fiber';
import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { calculateEnemyVelocity } from '../../logic/enemies/movement';
import { calculateEnemyAttackPattern } from '../../logic/enemyPatterns';
import { spawnThrownBomb } from '../../stores/game';
import { $isInvulnerable, takeDamage } from '../../stores/player';
import { addEnemyProjectile } from '../../stores/projectiles';
import { $trails, addTrail } from '../../stores/trails';
import { emitDamage } from '../../systems/events';
import type { EnemyState } from '../../types/enemies';
import { ITEM_DEFINITIONS } from '../../types/items';
import type { TrailType } from '../../types/trails';
import { EnemyVisuals } from './Visuals/EnemyVisuals';

// Inline MockRigidBody to prevent import issues
const MockRigidBody = React.forwardRef((props: any, ref) => {
  const { children, position } = props;
  React.useImperativeHandle(ref, () => ({
    setLinvel: () => { },
    setTranslation: () => { },
    linvel: () => ({ x: 0, y: 0, z: 0 }),
    translation: () => ({ x: position[0], y: position[1], z: position[2] }),
  }));
  return <group position={position}>{children}</group>;
});

// Lazy load Rapier components to prevent crash in Headless/Test mode
const LazyRigidBody = lazy(() => import('@react-three/rapier').then(m => ({ default: m.RigidBody })));
const LazyCuboidCollider = lazy(() => import('@react-three/rapier').then(m => ({ default: m.CuboidCollider })));

interface EnemyProps {
  enemy: EnemyState;
  active: boolean;
  playerPosition: [number, number, number];
  onDeath: (enemyId: number) => void;

  onPositionUpdate?: (enemyId: number, position: [number, number, number]) => void;
}

const ENEMY_DETECTION_RANGE = 50; // Room-wide detection
const ENEMY_ATTACK_RANGE = 2;
const ENEMY_ATTACK_COOLDOWN = 1000; // ms
const ENEMY_SPAWN_DELAY = 1000; // 1 second for faster testing

export function Enemy({ enemy, active, playerPosition, onDeath, onPositionUpdate }: EnemyProps) {
  // Hooks
  const rigidBodyRef = useRef(null);
  const meshRef = useRef<THREE.Group>(null);
  const [_isAttacking, setIsAttacking] = useState(false);
  const [_distanceToPlayer, setDistanceToPlayer] = useState(999);
  const currentPositionRef = useRef<[number, number, number]>(enemy?.position || [0, 0, 0]);
  const [_damageFlash, setDamageFlash] = useState(false);
  const lastHealthRef = useRef(enemy?.health || 100);
  const lastAttackTime = useRef(0);
  const spawnTime = useRef(Date.now());
  const isDeadRef = useRef(false);
  const SPAWN_INVULNERABILITY_TIME = ENEMY_SPAWN_DELAY;

  // Store player position in ref for access in useFrame
  const playerPositionRef = useRef(playerPosition);
  useEffect(() => {
    playerPositionRef.current = playerPosition;
  }, [playerPosition]);

  const [_hitEffects, setHitEffects] = useState<Array<{ id: number; position: [number, number, number] }>>([]);
  const hitEffectIdCounter = useRef(0);

  const dynamicStatsRef = useRef({
    speed: enemy?.definition?.speed || 0,
    damage: enemy?.definition?.damage || 0,
    healthMultiplier: 1.0
  });
  const lastTrailPositionRef = useRef<Vector3 | null>(null);
  const lastPoisonTimeRef = useRef(0);

  if (!enemy) return null;

  const isRanged = enemy.definition.attackType === 'ranged' || !!enemy.heldItem;
  let attackRange = isRanged ? (enemy.definition.attackRange || 15) : ENEMY_ATTACK_RANGE;
  if (enemy.definition.id === 'corruption') attackRange = 0.5; // Must collide
  const detectionRange = Math.max(ENEMY_DETECTION_RANGE, attackRange + 5);

  const isTestMode = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('test') === 'true' : false;
  const RigidBodyComponent = isTestMode ? MockRigidBody : LazyRigidBody;

  // Handle damage from projectiles (Legacy hack removed - using event system now)

  useEffect(() => {
    if (enemy.isDead && !isDeadRef.current) {
      isDeadRef.current = true;

      // Reactive Bug: Explode on death
      if (enemy.definition.id === 'reactive_bug') {
        const explosionPos: [number, number, number] = [
          currentPositionRef.current[0],
          currentPositionRef.current[1] + 0.5,
          currentPositionRef.current[2]
        ];
        console.log(`💥 Spite Bug ${enemy.id} exploding on death!`);
        spawnThrownBomb(explosionPos, [0, 0, 0], [0, 0, 0], 0.1);
      }

      onDeath(enemy.id);
    }
  }, [enemy.isDead, enemy.id, onDeath]);

  // Register enemy position immediately on mount
  useEffect(() => {
    // console.log(`👹 Enemy ${ enemy.id }: Registering initial position`, enemy.position);
    onPositionUpdate?.(enemy.id, enemy.position);
  }, [enemy.id, enemy.position, onPositionUpdate]);

  // Flash white and show hit effect when taking damage
  useEffect(() => {
    if (enemy.health < lastHealthRef.current) {
      // console.log(`💢 Enemy ${ enemy.id } health changed: ${ lastHealthRef.current } -> ${ enemy.health } `);
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 200);

      // Add hit effect
      const id = hitEffectIdCounter.current++;
      // Use current position for effect
      const currentPos = currentPositionRef.current;
      const effectPos: [number, number, number] = [currentPos[0], currentPos[1] + enemy.definition.size / 2, currentPos[2]];
      setHitEffects(prev => [...prev, { id, position: effectPos }]);

      // Reactive Bug: Fire on hit
      if (enemy.definition.id === 'reactive_bug' && !enemy.isDead) {
        const playerPos = new Vector3(...playerPosition);
        const enemyVec = new Vector3(...currentPos);
        const dir = new Vector3().subVectors(playerPos, enemyVec).normalize();

        console.log(`🔫 Spite Bug ${enemy.id} reacting to hit!`);
        addEnemyProjectile({
          origin: [currentPos[0] + dir.x * 1.5, currentPos[1] + 1.0, currentPos[2] + dir.z * 1.5],
          direction: [dir.x, dir.y, dir.z],
          type: 'normal',
          damage: enemy.definition.damage,
          speed: 12,
          color: enemy.definition.color,
          size: 0.8,
        });
      }
    }
    lastHealthRef.current = enemy.health;
  }, [enemy.health, enemy.id, currentPositionRef, enemy.definition.size, playerPosition]);

  // Update position from mesh (synced with physics, safe to read)
  useFrame(() => {
    if (!active || enemy.isDead || !rigidBodyRef.current) return;
    // const rb = rigidBodyRef.current as any; // Treat as any to avoid Type errors
    // Silence unused warning for rb if it's not used in simplified logic
    // if (!rb) return;
    const now = Date.now();
    // Prevent 0,0,0 artifacts by waiting a bit for physics to sync
    if (now - spawnTime.current < 200) return;

    if (meshRef.current) {
      // Get world position from mesh which is updated by Rapier
      const worldPos = new Vector3();
      meshRef.current.getWorldPosition(worldPos);

      const newPos: [number, number, number] = [worldPos.x, worldPos.y, worldPos.z];
      currentPositionRef.current = newPos;

      // Update parent spawner with current position for projectile collision
      // Ensure this is called every frame to keep global state fresh
      onPositionUpdate?.(enemy.id, newPos);

      // Check if fallen off map
      if (worldPos.y < -10) {
        console.log(`💀 Enemy ${enemy.id} fell into the void !`);
        emitDamage(enemy.id, 99999);
      }

      // Check for Trails
      const activeTrails = Object.values($trails.get()).filter(t => t.roomId === enemy.roomId);
      let isSlowed = false;
      let isOnPoison = false;

      for (const trail of activeTrails) {
        const trailPos = new Vector3(...trail.position);
        if (worldPos.distanceTo(trailPos) < trail.size) {
          if (trail.type === 'slow') isSlowed = true;
          if (trail.type === 'toxic') isOnPoison = true;
        }
      }

      // Apply Slow
      if (isSlowed) {
        dynamicStatsRef.current.speed = enemy.definition.speed * 0.4; // 60% slow
      } else if (!enemy.definition.id.startsWith('growth_')) {
        // Reset if not a growth bug (which has its own speed logic)
        dynamicStatsRef.current.speed = enemy.definition.speed;
      }

      // Apply Poison
      if (isOnPoison && now - lastPoisonTimeRef.current > 1000) {
        emitDamage(enemy.id, 2); // 2 poison damage per second
        lastPoisonTimeRef.current = now;
      }

      // Slime Trail Logic
      if (enemy.definition.id.startsWith('slime_')) {
        const currentPosVec = worldPos.clone();
        if (currentPosVec.lengthSq() < 0.1) return;

        // Skip the very first frame to prevent artifacts
        if (!lastTrailPositionRef.current) {
          lastTrailPositionRef.current = currentPosVec;
          return;
        }

        if (currentPosVec.distanceTo(lastTrailPositionRef.current) > 1.5) {
          const type: TrailType = enemy.definition.id === 'slime_slow' ? 'slow' : 'toxic';
          addTrail(
            [worldPos.x, worldPos.y, worldPos.z],
            type,
            enemy.definition.size * 0.5,
            6000, // 6 seconds
            enemy.roomId
          );
          lastTrailPositionRef.current = currentPosVec;
        }
      }
      // Visual Rotation (Look at Player)
      const currentParamsPlayerPos = playerPositionRef.current;
      const targetLookAt = new Vector3(currentParamsPlayerPos[0], worldPos.y, currentParamsPlayerPos[2]);
      meshRef.current.lookAt(targetLookAt);

      // Optional: Smooth rotation could be added here via Quaternion slerp if lookAt is too jittery
      // but direct lookAt is usually fine for this view perspective.
    }

  });

  // Simplified Movement/Attack Logic
  const updateMovement = (
    rb: any,
    distance: number,
    targetPos: Vector3,
    enemyVec: Vector3,
    dynamicSpeed?: number
  ) => {
    if (distance > detectionRange) {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }
    const velocity = calculateEnemyVelocity(
      enemy,
      targetPos,
      enemyVec,
      distance,
      dynamicSpeed
    );
    rb.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
  };

  const updateAttack = (
    now: number,
    distance: number,
    playerPos: Vector3,
    enemyVec: Vector3,
    dynamicDamage?: number
  ) => {
    if (distance <= attackRange) {
      if ($isInvulnerable.get()) return;
      const fireRate = isRanged ? (enemy.definition.fireRate || 2000) : ENEMY_ATTACK_COOLDOWN;
      if (now - lastAttackTime.current > fireRate) {
        if (isRanged) {
          // Ranged Logic (simplified)
          const projectiles = calculateEnemyAttackPattern(enemy, playerPos, enemyVec, ITEM_DEFINITIONS);
          projectiles.forEach(p => addEnemyProjectile(p));
        } else {
          takeDamage(dynamicDamage || enemy.definition.damage);
        }
        lastAttackTime.current = now;
        setIsAttacking(true);
        setTimeout(() => setIsAttacking(false), 500);
      }
    }
  };

  useFrame((_state, _delta) => {
    if (!rigidBodyRef.current || enemy.isDead || !active) return;
    const rb = rigidBodyRef.current as any;
    // Silence unused warning for rb if it's not used in simplified logic
    if (!rb) return;
    const now = Date.now();
    const timeSinceSpawn = now - spawnTime.current;
    if (timeSinceSpawn < SPAWN_INVULNERABILITY_TIME) {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const playerPos = new Vector3(...playerPosition);
    const enemyVec = new Vector3(...currentPositionRef.current);
    const distanceToPlayer = enemyVec.distanceTo(playerPos);
    let targetPos = playerPos;
    let distanceToTarget = distanceToPlayer;



    setDistanceToPlayer(distanceToPlayer);
    updateMovement(rb, distanceToTarget, targetPos, enemyVec, dynamicStatsRef.current.speed);

    if (targetPos === playerPos) {
      updateAttack(now, distanceToTarget, targetPos, enemyVec, dynamicStatsRef.current.damage);
    }
  });

  if (enemy.isDead || !active) return null;
  const healthPercent = (enemy.health / enemy.definition.health) * 100;

  const isBoss = ['weaver', 'corrupter', 'echo_queen', 'chess_queen', 'bomber_king', 'mega_snake', 'summoner'].includes(enemy.definition.id);

  return (
    <>
      <Suspense fallback={null}>
        <RigidBodyComponent
          ref={rigidBodyRef as any}
          colliders={false}
          mass={1}
          position={enemy.position}
          userData={{ isEnemy: true, isBoss, enemyId: enemy.id, health: enemy.health, damage: enemy.definition.damage, size: enemy.definition.size }}
          enabledTranslations={[true, true, true]}
          lockRotations={true}
          ccd={true}
        >
          {!isTestMode && (() => {
            const sizeMultiplier = isBoss ? 1.2 : 1.0;
            const colliderSize = (enemy.definition.size * sizeMultiplier) / 2;
            return (
              <Suspense fallback={null}>
                {/* Huge 'Ceiling' Hitbox for 2.5D Gameplay feel */}
                {/* 1.5x Width for generous XZ aiming, 10 height to hit anything in the column */}
                <LazyCuboidCollider args={[colliderSize * 1.5, 5.0, colliderSize * 1.5]} position={[0, 5.0, 0]} sensor />
                <LazyCuboidCollider args={[colliderSize, 2.0, colliderSize]} position={[0, 2.0, 0]} />
              </Suspense>
            );
          })()}

          <group ref={meshRef} position={[0, enemy.definition.size / 2, 0]}>
            <EnemyVisuals definition={enemy.definition} healthPercent={healthPercent} />
          </group>

          {/* Simple Health Bar */}
          {!isTestMode && (
            <group position={[0, enemy.definition.size + 0.8, 0]}>
              <mesh><boxGeometry args={[0.6, 0.05, 0.05]} /><meshStandardMaterial color="black" /></mesh>
              <mesh position={[-0.3 + (healthPercent / 100) * 0.3, 0, 0.01]}><boxGeometry args={[(healthPercent / 100) * 0.6, 0.05, 0.05]} /><meshStandardMaterial color="green" /></mesh>
            </group>
          )}
        </RigidBodyComponent>
      </Suspense>
    </>
  );
}

// Memoize Enemy component
export default React.memo(Enemy, (prevProps, nextProps) => {
  if (prevProps.enemy.id !== nextProps.enemy.id) return false;
  if (prevProps.enemy.health !== nextProps.enemy.health) return false;
  if (prevProps.enemy.isDead !== nextProps.enemy.isDead) return false;
  if (prevProps.active !== nextProps.active) return false;
  if (nextProps.enemy.isDead) return true;
  if (
    prevProps.playerPosition[0] !== nextProps.playerPosition[0] ||
    prevProps.playerPosition[1] !== nextProps.playerPosition[1] ||
    prevProps.playerPosition[2] !== nextProps.playerPosition[2]
  ) return false;
  return true;
});
