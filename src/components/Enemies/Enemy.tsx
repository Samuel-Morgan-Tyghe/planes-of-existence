import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { calculateGrowthStats } from '../../logic/growthLogic';
import { $isInvulnerable, takeDamage } from '../../stores/player';
import { addEnemyProjectile } from '../../stores/projectiles';
import type { EnemyState } from '../../types/enemies';
import { ITEM_DEFINITIONS } from '../../types/items';
import { calculateProjectileStats } from '../../utils/combat';
import { HitEffect } from '../Effects/HitEffect';

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
  const dynamicStatsRef = useRef({ speed: enemy.definition.speed, damage: enemy.definition.damage });

  const isRanged = enemy.definition.attackType === 'ranged' || !!enemy.heldItem;
  const attackRange = isRanged ? (enemy.definition.attackRange || 15) : ENEMY_ATTACK_RANGE;
  const detectionRange = Math.max(ENEMY_DETECTION_RANGE, attackRange + 5);

  // Handle damage from projectiles
  // Legacy hack removed - using event system now

  useEffect(() => {
    if (enemy.isDead && !isDeadRef.current) {
      isDeadRef.current = true;
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
      const effectPos: [number, number, number] = [currentPos[0], currentPos[1] + enemy.definition.size/2, currentPos[2]];
      setHitEffects(prev => [...prev, { id, position: effectPos }]);
    }
    lastHealthRef.current = enemy.health;
  }, [enemy.health, enemy.id, currentPositionRef, enemy.definition.size]);

  // Update position from mesh (synced with physics, safe to read)
  useFrame(() => {
    if (!active || enemy.isDead || !rigidBodyRef.current) return;
    
    if (meshRef.current) {
      // Get world position from mesh which is updated by Rapier
      const worldPos = new Vector3();
      meshRef.current.getWorldPosition(worldPos);
      
      const newPos: [number, number, number] = [worldPos.x, worldPos.y, worldPos.z];
      currentPositionRef.current = newPos;
      
      // Update parent spawner with current position for projectile collision
      // Ensure this is called every frame to keep global state fresh
      onPositionUpdate?.(enemy.id, newPos);
    }

  });

  const updateMovement = (
    rb: RapierRigidBody,
    distance: number,
    playerPos: Vector3,
    enemyVec: Vector3,
    dynamicSpeed?: number
  ) => {
    if (enemy.definition.id === 'turret') {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else if (distance < detectionRange && distance > attackRange) {
      const velocity = new Vector3()
        .subVectors(playerPos, enemyVec)
        .normalize()
        .multiplyScalar(dynamicSpeed || enemy.definition.speed);
      rb.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    } else if (isRanged && distance > attackRange * 0.7 && distance <= attackRange) {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else if (distance <= attackRange && !isRanged) {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
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
          const direction = new Vector3().subVectors(playerPos, enemyVec).normalize();
          const currentPos = currentPositionRef.current;
          const spawnOffset = enemy.definition.size * 2.0;
          const projectileOrigin: [number, number, number] = [
            currentPos[0] + direction.x * spawnOffset,
            1.0,
            currentPos[2] + direction.z * spawnOffset,
          ];

          const type = enemy.definition.id === 'echoer' ? 'soundwave' : 'normal';
          
          // Calculate stats based on held item using utility
          const { damage, speed, size, color } = calculateProjectileStats(
            {
              damage: enemy.definition.damage,
              speed: enemy.definition.projectileSpeed || 10,
              size: 1.0,
              color: enemy.definition.color,
            },
            enemy.heldItem,
            ITEM_DEFINITIONS
          );

          console.log(`🚀 Enemy ${enemy.id} firing ${type} projectile at ${projectileOrigin} with item ${enemy.heldItem}`);
          
          addEnemyProjectile({
            origin: projectileOrigin,
            direction: [direction.x, direction.y, direction.z],
            type: type as 'normal' | 'soundwave',
            damage: damage,
            speed: speed,
            color: color,
            size: size,
          });
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
    const distance = enemyVec.distanceTo(playerPos);
    setDistanceToPlayer(distance);

    // Rotate mesh to face player
    if (meshRef.current) {
      meshRef.current.lookAt(playerPos.x, currentPositionRef.current[1], playerPos.z);
    }

    // Growth Bug Logic
    if (enemy.definition.id.startsWith('growth_')) {
      timeAliveRef.current += delta;
      
      const { scale, speed, damage } = calculateGrowthStats(
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
      dynamicStatsRef.current = { speed, damage };
    }

    updateMovement(rb, distance, playerPos, enemyVec, dynamicStatsRef.current.speed);
    updateAttack(now, distance, playerPos, enemyVec, dynamicStatsRef.current.damage);
  });

  if (enemy.isDead || !active) return null;

  const healthPercent = (enemy.health / enemy.definition.health) * 100;

  const handleHitEffectComplete = (id: number) => {
    setHitEffects(prev => prev.filter(e => e.id !== id));
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

      {/* Enemy */}
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      mass={1}
      position={enemy.position}
      userData={{ isEnemy: true, enemyId: enemy.id, health: enemy.health, size: enemy.definition.size }}
      enabledTranslations={[true, true, true]}
      lockRotations={true}
      ccd={true}
    >
      <CuboidCollider args={[enemy.definition.size / 2, enemy.definition.size / 2, enemy.definition.size / 2]} />
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[enemy.definition.size, enemy.definition.size, enemy.definition.size]} />
        <meshStandardMaterial
          color={damageFlash ? '#ffffff' : enemy.definition.color}
          emissive={damageFlash ? '#ffffff' : enemy.definition.color}
          emissiveIntensity={damageFlash ? 5.0 : isAttacking ? 3.0 : 2.0}
        />
      </mesh>
      
      {/* Enemy indicator - always visible, brighter */}
      <mesh position={[0, enemy.definition.size / 2 + 0.5, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color={enemy.definition.color}
          emissive={enemy.definition.color}
          emissiveIntensity={isAttacking ? 4.0 : 2.5}
        />
      </mesh>
      {/* Text label warning - ALWAYS visible */}
      <Html
        position={[0, enemy.definition.size / 2 + 1.5, 0]}
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
      <mesh position={[0, enemy.definition.size / 2 + 0.8, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.3 + (healthPercent / 100) * 0.3, enemy.definition.size / 2 + 0.8, 0.01]}>
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

