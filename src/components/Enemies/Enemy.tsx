import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import React, { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { updateBomberKing } from '../../logic/enemies/boss_bomber_king';
import { updateChessQueen } from '../../logic/enemies/boss_chess_queen';
import { absorbMinion, updateCorrupter } from '../../logic/enemies/boss_corrupter';
import { updateEchoQueen } from '../../logic/enemies/boss_echo_queen';
import { updateMegaSnake, type SnakeSegment } from '../../logic/enemies/boss_mega_snake';
import { updateSummoner } from '../../logic/enemies/boss_summoner';
import { updateWeaverBoss, type WeaverBossState } from '../../logic/enemies/boss_weaver';
import { updateCorrupterAI } from '../../logic/enemies/corrupter';
import { calculateEnemyVelocity } from '../../logic/enemies/movement';
import { calculateEnemyAttackPattern } from '../../logic/enemyPatterns';
import { calculateGrowthStats } from '../../logic/growthLogic';
import { $enemies, $enemyPositions, enemyUseBomb, spawnEnemy, spawnThrownBomb } from '../../stores/game';
import { $isInvulnerable, takeDamage } from '../../stores/player';
import { addEnemyProjectile } from '../../stores/projectiles';
import { $trails, addTrail } from '../../stores/trails';
import { emitCorruption, emitDamage } from '../../systems/events';
import type { EnemyState } from '../../types/enemies';
import { ITEM_DEFINITIONS } from '../../types/items';
import type { TrailType } from '../../types/trails';
import { HitEffect } from '../Effects/HitEffect';
import { SnakeBody } from './Bosses/SnakeBody';

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
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [distanceToPlayer, setDistanceToPlayer] = useState(999);
  const currentPositionRef = useRef<[number, number, number]>(enemy.position);
  const [damageFlash, setDamageFlash] = useState(false);
  const lastHealthRef = useRef(enemy.health);
  const lastAttackTime = useRef(0);
  const spawnTime = useRef(Date.now());
  const isDeadRef = useRef(false);
  const SPAWN_INVULNERABILITY_TIME = ENEMY_SPAWN_DELAY; // Delay before enemy can attack

  const [hitEffects, setHitEffects] = useState<Array<{ id: number; position: [number, number, number] }>>([]);
  const hitEffectIdCounter = useRef(0);
  // ... (inside component)
  const timeAliveRef = useRef(0);
  const dynamicStatsRef = useRef({ speed: enemy.definition.speed, damage: enemy.definition.damage, healthMultiplier: 1.0 });
  const segmentsRef = useRef<SnakeSegment[]>([]);
  const lastTrailPositionRef = useRef<Vector3 | null>(null);
  const lastPoisonTimeRef = useRef(0);
  const weaverStateRef = useRef<WeaverBossState>({
    phase: 1,
    attackTimer: 1.0,
    patternIndex: 0,
    rotationAngle: 0,
    isBlinking: false,
    blinkCooldown: 3.0
  });

  const isRanged = enemy.definition.attackType === 'ranged' || !!enemy.heldItem;
  let attackRange = isRanged ? (enemy.definition.attackRange || 15) : ENEMY_ATTACK_RANGE;
  if (enemy.definition.id === 'corruption') attackRange = 0.5; // Must collide
  const detectionRange = Math.max(ENEMY_DETECTION_RANGE, attackRange + 5);

  // Handle damage from projectiles
  // Legacy hack removed - using event system now

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
    console.log(`👹 Enemy ${enemy.id}: Registering initial position`, enemy.position);
    onPositionUpdate?.(enemy.id, enemy.position);
  }, [enemy.id, enemy.position, onPositionUpdate]);

  // Flash white and show hit effect when taking damage
  useEffect(() => {
    if (enemy.health < lastHealthRef.current) {
      console.log(`💢 Enemy ${enemy.id} health changed: ${lastHealthRef.current} -> ${enemy.health}`);
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
    const now = Date.now();

    if (meshRef.current) {
      // Get world position from mesh which is updated by Rapier
      const worldPos = new Vector3();
      meshRef.current.getWorldPosition(worldPos);

      const newPos: [number, number, number] = [worldPos.x, worldPos.y, worldPos.z];
      currentPositionRef.current = newPos;

      // Update parent spawner with current position for projectile collision
      // Ensure this is called every frame to keep global state fresh
      onPositionUpdate?.(enemy.id, newPos);

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
        if (!lastTrailPositionRef.current || currentPosVec.distanceTo(lastTrailPositionRef.current) > 1.5) {
          const type: TrailType = enemy.definition.id === 'slime_slow' ? 'slow' : 'toxic';
          addTrail(
            [worldPos.x, worldPos.y, worldPos.z],
            type,
            enemy.definition.size * 1.5,
            6000, // 6 seconds
            enemy.roomId
          );
          lastTrailPositionRef.current = currentPosVec;
        }
      }
    }

  });

  // Refactored Movement Logic
  const updateMovement = (
    rb: RapierRigidBody,
    distance: number,
    targetPos: Vector3,
    enemyVec: Vector3,
    dynamicSpeed?: number
  ) => {
    // We assume detection range checks are done before calling this or inside internal logic if complex.
    // However, the previous logic checked detectionRange (50) inside updateMovement.
    // Let's preserve that check here or rely on the utility?
    // The utility is pure math. State checks should be here.

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
        console.log('🔴 Enemy', enemy.id, 'attacking player! Distance:', distance.toFixed(2), 'Type:', isRanged ? 'RANGED' : 'melee');

        if (isRanged) {
          const isBombThrower = ['bomber', 'demolisher', 'bombardier'].includes(enemy.definition.id);
          if (isBombThrower) {
            console.log(`💣 Enemy ${enemy.id} throwing bomb(s)!`);
            const targetDir: [number, number, number] = [playerPos.x - enemyVec.x, 0, playerPos.z - enemyVec.z];
            const length = Math.sqrt(targetDir[0] * targetDir[0] + targetDir[2] * targetDir[2]);
            const normalizedDir: [number, number, number] = [targetDir[0] / length, 0, targetDir[2] / length];

            const throwBomb = (dir: [number, number, number]) => {
              const spawnPos: [number, number, number] = [
                enemyVec.x + dir[0] * 1.5,
                enemyVec.y + 1.2,
                enemyVec.z + dir[2] * 1.5
              ];
              const vel = rigidBodyRef.current?.linvel() || { x: 0, y: 0, z: 0 };

              if (enemy.definition.id === 'bombardier') {
                const sniperForce = 20;
                const bombardierVelocity: [number, number, number] = [
                  dir[0] * sniperForce + vel.x,
                  6 + vel.y,
                  dir[2] * sniperForce + vel.z
                ];
                spawnThrownBomb(spawnPos, dir, bombardierVelocity);
              } else {
                enemyUseBomb(spawnPos, dir, [vel.x, vel.y, vel.z]);
              }
            };

            if (enemy.definition.id === 'demolisher') {
              // Throw 3 bombs in a fan
              const angles = [-0.3, 0, 0.3]; // Radians
              angles.forEach(angle => {
                const vec = new Vector3(normalizedDir[0], 0, normalizedDir[2]).applyAxisAngle(new Vector3(0, 1, 0), angle);
                throwBomb([vec.x, 0, vec.z]);
              });
            } else {
              throwBomb(normalizedDir);
            }

          } else {
            // Use extracted logic to calculate attack pattern
            const projectiles = calculateEnemyAttackPattern(
              enemy,
              playerPos,
              enemyVec,
              ITEM_DEFINITIONS
            );

            projectiles.forEach(p => {
              console.log(`🚀 Enemy ${enemy.id} firing ${p.type} projectile at ${p.origin}`);
              addEnemyProjectile(p);
            });
          }

        } else {
          takeDamage(dynamicDamage || enemy.definition.damage);
        }

        lastAttackTime.current = now;
        setIsAttacking(true);
        setTimeout(() => setIsAttacking(false), 500);

        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshStandardMaterial;
          const originalColor = material.color.clone();
          material.color.set('#ff0000');
          material.emissive.set('#ff0000');
          material.emissiveIntensity = 3.0;
          setTimeout(() => {
            if (meshRef.current && !enemy.isDead) {
              material.color.copy(originalColor);
              material.emissive.set(enemy.definition.color);
              material.emissiveIntensity = 2.0;
            }
          }, 500);
        }
      }
    }
  };

  useFrame((_state, delta) => {
    if (!rigidBodyRef.current || enemy.isDead || !active) return;

    const rb = rigidBodyRef.current;
    const now = Date.now();
    const timeSinceSpawn = now - spawnTime.current;

    // Don't activate AI until spawn invulnerability period ends
    if (timeSinceSpawn < SPAWN_INVULNERABILITY_TIME) {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const playerPos = new Vector3(...playerPosition);
    const enemyVec = new Vector3(...currentPositionRef.current);
    const distanceToPlayer = enemyVec.distanceTo(playerPos);

    // Default target is player
    let targetPos = playerPos;
    let distanceToTarget = distanceToPlayer;

    // Corrupter Logic: Target nearest non-corrupted ally
    if (enemy.definition.id === 'corruption') {
      const result = updateCorrupterAI(
        enemyVec,
        enemy,
        $enemies.get(),
        $enemyPositions.get(), // Pass live positions
        {
          emitCorruption: (targetId) => {
            const allEnemies = $enemies.get();
            const target = allEnemies.find(e => e.id === targetId);

            if (target && target.definition.id === 'corrupter') {
              // Boss Absorption Logic
              absorbMinion(targetId);
              // Heal Boss +250 HP
              const newEnemies = allEnemies.map(e =>
                e.id === targetId ? { ...e, health: e.health + 250 } : e
              );
              $enemies.set(newEnemies);
              console.log(`💪 Corrupter Boss ${targetId} healed! +250 HP`);
            } else {
              emitCorruption(targetId);
            }
          },
          die: () => emitDamage(enemy.id, 9999) // Kill self correctly
        }
      );

      if (result) {
        targetPos = result.targetPos;
        distanceToTarget = result.distanceToTarget;
      } else {
        // No allies found - idle or wander, DO NOT TARGET PLAYER
        targetPos = enemyVec;
        distanceToTarget = 0;
      }
    }

    setDistanceToPlayer(distanceToPlayer);
    // Boss Logic - Handle all boss types
    const isBoss = ['weaver', 'corrupter', 'echo_queen', 'chess_queen', 'bomber_king', 'mega_snake', 'summoner'].includes(enemy.definition.id);
    if (isBoss && enemy.definition.id === 'weaver') {
      const { velocity: bossVel, projectiles, newBossState, colorOverride, sizeOverride } = updateWeaverBoss(
        enemy,
        playerPos,
        enemyVec,
        _state.clock.elapsedTime,
        delta,
        weaverStateRef.current
      );
      weaverStateRef.current = newBossState;

      // Handle Blinking
      if (newBossState.isBlinking) {
        const offset = new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(15);
        const blinkTarget = playerPos.clone().add(offset);
        rb.setTranslation({ x: blinkTarget.x, y: currentPositionRef.current[1], z: blinkTarget.z }, true);
      } else {
        rb.setLinvel({ x: bossVel.x, y: bossVel.y, z: bossVel.z }, true);
      }

      // Handle Projectiles
      projectiles.forEach((p: any) => addEnemyProjectile(p));

      // Visual Overrides
      if (meshRef.current) {
        if (colorOverride) {
          const mat = meshRef.current.material as THREE.MeshStandardMaterial;
          if (!damageFlash) {
            mat.color.set(colorOverride);
            mat.emissive.set(colorOverride);
          }
        }
        if (sizeOverride) {
          // Base the scale on the actual current size vs definition size
          const s = sizeOverride / enemy.definition.size;
          meshRef.current.scale.set(s, s, s);
        }
      }

      // Custom Rotation for Boss
      if (meshRef.current) {
        meshRef.current.lookAt(playerPos.x, currentPositionRef.current[1], playerPos.z);
      }

      return; // Skip default AI
    }

    // Other bosses - call their specific behavior functions
    if (isBoss) {
      const playerPosArray: [number, number, number] = [playerPos.x, playerPos.y, playerPos.z];

      // Create updated enemy object with current position (not spawn position)
      const currentEnemy = {
        ...enemy,
        position: currentPositionRef.current
      };

      switch (enemy.definition.id) {

        case 'corrupter': {
          const result = updateCorrupter(currentEnemy, playerPosArray, delta);
          if (result.projectiles) {
            result.projectiles.forEach((p: any) => addEnemyProjectile(p));
          }
          if (result.spawnEnemies) {
            result.spawnEnemies.forEach((s: any) => spawnEnemy(s.type, s.position));
          }
          // Echo Queen moves toward player
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
          break;
        }

        case 'echo_queen': {
          const result = updateEchoQueen(currentEnemy, playerPosArray, delta);
          if (result.projectiles) {
            result.projectiles.forEach((p: any) => addEnemyProjectile(p));
          }
          // Echo Queen moves toward player
          updateMovement(rb, distanceToPlayer, playerPos, enemyVec, enemy.definition.speed);
          break;
        }

        case 'chess_queen': {
          const result = updateChessQueen(currentEnemy, playerPosArray, delta);
          if (result.velocity) {
            rb.setLinvel({ x: result.velocity[0], y: 0, z: result.velocity[2] }, true);
          }
          break;
        }

        case 'bomber_king': {
          const result = updateBomberKing(currentEnemy, playerPosArray, delta);
          if (result.velocity) {
            rb.setLinvel({ x: result.velocity[0], y: 0, z: result.velocity[2] }, true);
          }
          break;
        }

        case 'mega_snake': {
          const result = updateMegaSnake(currentEnemy, playerPosArray, delta);
          if (result.velocity) {
            rb.setLinvel({ x: result.velocity[0], y: 0, z: result.velocity[2] }, true);
          }
          if (result.segments) {
            segmentsRef.current = result.segments;
          }
          break;
        }

        case 'summoner': {
          const result = updateSummoner(currentEnemy, playerPosArray, delta);
          if (result.projectiles) {
            result.projectiles.forEach((p: any) => addEnemyProjectile(p));
          }
          if (result.summonEnemies) {
            result.summonEnemies.forEach((spawn: any) => {
              console.log(`Summoner spawning ${spawn.type} at ${spawn.position}`);
              spawnEnemy(spawn.type, spawn.position);
            });
          }
          // Summoner moves slowly
          updateMovement(rb, distanceToPlayer, playerPos, enemyVec, enemy.definition.speed);
          break;
        }
      }

      // Rotate to face player
      if (meshRef.current) {
        meshRef.current.lookAt(playerPos.x, currentPositionRef.current[1], playerPos.z);
      }

      return; // Skip default AI
    }

    // Rotate mesh to face target
    if (meshRef.current) {
      meshRef.current.lookAt(targetPos.x, currentPositionRef.current[1], targetPos.z);
    }

    // Growth Bug Logic
    if (enemy.definition.id.startsWith('growth_')) {
      timeAliveRef.current += delta;

      const { scale, speed, damage, healthMultiplier } = calculateGrowthStats(
        enemy.definition.id,
        timeAliveRef.current,
        enemy.definition.size,
        enemy.definition.speed,
        enemy.definition.damage
      );

      // Apply Visual Scale
      if (meshRef.current) {
        meshRef.current.scale.set(scale, scale, scale);
      }

      // Store dynamic stats in refs for use in other closures (movement/attack)
      // Using refs avoids triggering re-renders just for logic updates
      dynamicStatsRef.current = { speed, damage, healthMultiplier: healthMultiplier };
    }

    updateMovement(rb, distanceToTarget, targetPos, enemyVec, dynamicStatsRef.current.speed);

    // Only auto-attack if targeting player (or default behavior)
    // Corrupter handles its own "attack" (sacrifice) in the logic above
    // STRICT GUARD: Corrupter NEVER attacks player
    if (enemy.definition.id !== 'corruption') {
      if (targetPos === playerPos) {
        updateAttack(now, distanceToTarget, targetPos, enemyVec, dynamicStatsRef.current.damage);
      }
    }
  });

  if (enemy.isDead || !active) return null;

  const healthPercent = (enemy.health / enemy.definition.health) * 100;

  const handleHitEffectComplete = (id: number) => {
    setHitEffects(prev => prev.filter(e => e.id !== id));
  };

  const handleIntersection = (_other: any) => {
    // Collision logic moved to Player.tsx for Contact Damage
    // We can keep this empty or use it for specific enemy-side logic if needed later
    if (enemy.isDead || !active) return;
  };

  return (
    <>
      {/* Hit Effects */}
      {hitEffects.map(effect => (
        <HitEffect
          key={effect.id}
          position={effect.position}
          color={enemy.definition.color}
          onComplete={() => handleHitEffectComplete(effect.id)}
        />
      ))}

      {/* Snake Body Rendering (Visual Only) */}
      {enemy.definition.id === 'mega_snake' && (
        <SnakeBody segmentsRef={segmentsRef} color={enemy.definition.color} size={enemy.definition.size} />
      )}

      {/* Enemy */}
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        mass={1}
        position={enemy.position}
        userData={{ isEnemy: true, enemyId: enemy.id, health: enemy.health, damage: enemy.definition.damage, size: enemy.definition.size }}
        enabledTranslations={[true, true, true]}
        lockRotations={true}
        ccd={true}
        onIntersectionEnter={(e) => handleIntersection(e.other)}
      >
        {/* Colliders - bosses get slightly larger hitboxes to match their visual size */}
        {(() => {
          const isBoss = ['weaver', 'corrupter', 'echo_queen', 'chess_queen', 'bomber_king', 'mega_snake', 'summoner'].includes(enemy.definition.id);
          const sizeMultiplier = isBoss ? 1.2 : 1.0;
          const colliderSize = (enemy.definition.size * sizeMultiplier) / 2;
          return (
            <>
              <CuboidCollider args={[colliderSize, colliderSize, colliderSize]} position={[0, colliderSize, 0]} sensor />
              <CuboidCollider args={[colliderSize, colliderSize, colliderSize]} position={[0, colliderSize, 0]} />
            </>
          );
        })()}
        <mesh ref={meshRef} position={[0, enemy.definition.size / 2, 0]} castShadow>
          <boxGeometry args={[enemy.definition.size, enemy.definition.size, enemy.definition.size]} />
          <meshStandardMaterial
            color={damageFlash ? '#ffffff' : enemy.definition.color}
            emissive={damageFlash ? '#ffffff' : enemy.definition.color}
            emissiveIntensity={damageFlash ? 5.0 : isAttacking ? 3.0 : 2.0}
          />
        </mesh>

        {/* Enemy indicator - always visible, brighter */}
        <mesh position={[0, enemy.definition.size + 0.5, 0]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial
            color={enemy.definition.color}
            emissive={enemy.definition.color}
            emissiveIntensity={isAttacking ? 4.0 : 2.5}
          />
        </mesh>
        {/* Text label warning - ALWAYS visible */}
        <Html
          position={[0, enemy.definition.size + 1.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            transition: 'all 0.2s',
          }}
        >
          <div
            style={{
              backgroundColor: distanceToPlayer <= attackRange ? 'rgba(255, 0, 0, 0.9)' : 'rgba(255, 100, 0, 0.8)',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: distanceToPlayer <= attackRange ? '14px' : '12px',
              fontWeight: 'bold',
              border: distanceToPlayer <= attackRange ? '2px solid #ff0000' : '1px solid #ff6600',
              boxShadow: distanceToPlayer <= attackRange ? '0 0 10px rgba(255, 0, 0, 0.8)' : '0 0 5px rgba(255, 100, 0, 0.5)',
              textAlign: 'center',
              whiteSpace: 'nowrap',
            }}
          >
            <div>{distanceToPlayer <= attackRange ? (isRanged ? '⚠ SHOOTING ⚠' : '⚠ ATTACKING ⚠') : enemy.definition.name}</div>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>{Math.ceil(enemy.health)}/{enemy.definition.health} HP</div>
          </div>
        </Html>
        {/* Attack warning indicator - BIG pulsing red sphere when attacking */}
        {/* Attack beam - draw a line from enemy to player when in attack range */}
        {/* Attack range indicator - ALWAYS SHOW when player is nearby */}
        {/* Health bar */}
        <mesh position={[0, enemy.definition.size + 0.8, 0]}>
          <boxGeometry args={[0.6, 0.05, 0.05]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.3 + (healthPercent / 100) * 0.3, enemy.definition.size + 0.8, 0.01]}>
          <boxGeometry args={[(healthPercent / 100) * 0.6, 0.05, 0.05]} />
          <meshStandardMaterial
            color={healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ffff00' : '#ff0000'}
            emissive={healthPercent > 50 ? '#00ff00' : healthPercent > 25 ? '#ffff00' : '#ff0000'}
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* Held Item Indicator */}
        {enemy.heldItem && (
          <mesh position={[0, enemy.definition.size + 0.5, 0]}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial
              color="#ffd700" // Gold color for item
              emissive="#ffd700"
              emissiveIntensity={1.0}
            />
          </mesh>
        )}
      </RigidBody>
    </>
  );
}

// Memoize Enemy component to prevent unnecessary re-renders
// Return true if props are equal (skip re-render), false if different (do re-render)
export default React.memo(Enemy, (prevProps, nextProps) => {
  // Re-render if any of these changed
  if (prevProps.enemy.id !== nextProps.enemy.id) return false;
  if (prevProps.enemy.health !== nextProps.enemy.health) return false;
  if (prevProps.enemy.isDead !== nextProps.enemy.isDead) return false;
  if (prevProps.active !== nextProps.active) return false;

  // Skip expensive player position check if enemy is dead
  if (nextProps.enemy.isDead) return true;

  // Check player position for active enemies
  if (
    prevProps.playerPosition[0] !== nextProps.playerPosition[0] ||
    prevProps.playerPosition[1] !== nextProps.playerPosition[1] ||
    prevProps.playerPosition[2] !== nextProps.playerPosition[2]
  ) return false;

  // Props are equal, skip re-render
  return true;
});

