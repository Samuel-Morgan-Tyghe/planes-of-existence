import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { $isInvulnerable, takeDamage } from '../../stores/player';
import type { EnemyState } from '../../types/enemies';
import { HitEffect } from '../Effects/HitEffect';
import { EnemyProjectile } from './EnemyProjectile';

interface EnemyProps {
  enemy: EnemyState;
  active: boolean;
  playerPosition: [number, number, number];
  onDeath: (enemyId: number) => void;

  onPositionUpdate?: (enemyId: number, position: [number, number, number]) => void;
}

const ENEMY_DETECTION_RANGE = 10;
const ENEMY_ATTACK_RANGE = 2;
const ENEMY_ATTACK_COOLDOWN = 1000; // ms
const ENEMY_SPAWN_DELAY = 6000; // 6 seconds before enemy can attack (increased for player safety)

export function Enemy({ enemy, active, playerPosition, onDeath, onPositionUpdate }: EnemyProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackPulse, setAttackPulse] = useState(0);
  const [distanceToPlayer, setDistanceToPlayer] = useState(999);
  const currentPositionRef = useRef<[number, number, number]>(enemy.position);
  const [damageFlash, setDamageFlash] = useState(false);
  const lastHealthRef = useRef(enemy.health);
  const lastAttackTime = useRef(0);
  const spawnTime = useRef(Date.now());
  const isDeadRef = useRef(false);
  const SPAWN_INVULNERABILITY_TIME = ENEMY_SPAWN_DELAY; // Delay before enemy can attack

  // Projectile management for ranged enemies
  const [projectiles, setProjectiles] = useState<Array<{ id: number; origin: [number, number, number]; direction: [number, number, number] }>>([]);
  const projectileIdCounter = useRef(0);
  const [hitEffects, setHitEffects] = useState<Array<{ id: number; position: [number, number, number] }>>([]);
  const hitEffectIdCounter = useRef(0);

  const isRanged = enemy.definition.attackType === 'ranged';
  const attackRange = isRanged ? (enemy.definition.attackRange || 15) : ENEMY_ATTACK_RANGE;

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
    if (!active || enemy.isDead) return;
    
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

    // Animate attack pulse
    if (attackPulse > 0) {
      setAttackPulse((prev) => Math.max(0, prev - 0.05));
    }
  });

  useFrame(() => {
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

    // Removed excessive logging for performance

    // Move toward player if in range (but ranged enemies keep distance)
    // Rotate mesh to face player
    if (meshRef.current) {
      meshRef.current.lookAt(playerPos.x, currentPositionRef.current[1], playerPos.z);
    }

    // Move toward player if in range (but ranged enemies keep distance)
    if (enemy.definition.id === 'turret') {
       // Turrets don't move
       rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else if (distance < ENEMY_DETECTION_RANGE && distance > attackRange) {
      const direction = new Vector3()
        .subVectors(playerPos, enemyVec)
        .normalize()
        .multiplyScalar(enemy.definition.speed);

      rb.setLinvel({ x: direction.x, y: 0, z: direction.z }, true);
    } else if (isRanged && distance > attackRange * 0.7 && distance <= attackRange) {
      // Ranged enemies stay at distance and stop moving when in range
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else if (distance <= attackRange) {
      // Attack player (only after spawn invulnerability AND player invulnerability check)
      // Double-check player invulnerability before attacking
      if ($isInvulnerable.get()) {
        // Player is invulnerable, don't attack
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        return;
      }

      const fireRate = isRanged ? (enemy.definition.fireRate || 2000) : ENEMY_ATTACK_COOLDOWN;

      if (now - lastAttackTime.current > fireRate) {
        console.log('🔴 Enemy', enemy.id, 'attacking player! Distance:', distance.toFixed(2), 'Damage:', enemy.definition.damage, 'Type:', isRanged ? 'RANGED' : 'melee');

        if (isRanged) {
          // Fire projectile at player
          const direction = new Vector3().subVectors(playerPos, enemyVec).normalize();
          const currentPos = currentPositionRef.current;
          const projectileOrigin: [number, number, number] = [
            currentPos[0] + direction.x * 1,
            currentPos[1],
            currentPos[2] + direction.z * 1,
          ];

          const id = projectileIdCounter.current++;
          setProjectiles(prev => [...prev, {
            id,
            origin: projectileOrigin,
            direction: [direction.x, direction.y, direction.z],
          }]);
        } else {
          // Melee attack
          takeDamage(enemy.definition.damage);
        }

        lastAttackTime.current = now;
        
        // Visual feedback - flash red when attacking
        setIsAttacking(true);
        setAttackPulse(1.0);
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
      } else {
        // Show attack warning when in range but on cooldown
        const timeUntilAttack = ENEMY_ATTACK_COOLDOWN - (now - lastAttackTime.current);
        if (timeUntilAttack < 500) {
          setAttackPulse(Math.max(0, timeUntilAttack / 500));
        } else {
          setAttackPulse(0);
        }
      }
      
      // Stop moving when attacking
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else {
      // Idle
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  });

  const handleProjectileDestroy = useCallback((id: number) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  }, []);

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
      {/* Render enemy projectiles */}
      {projectiles.map((proj) => (
        <EnemyProjectile
          key={proj.id}
          origin={proj.origin}
          direction={proj.direction}
          speed={enemy.definition.projectileSpeed || 10}
          damage={enemy.definition.damage}
          color={enemy.definition.color}
          onDestroy={() => handleProjectileDestroy(proj.id)}
          playerPosition={playerPosition}
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
          <div>{distanceToPlayer <= attackRange ? (isRanged ? '⚠ SHOOTING ⚠' : '⚠ ATTACKING ⚠') : (isRanged ? 'SNIPER' : 'ENEMY')}</div>
          <div style={{ fontSize: '10px', marginTop: '2px' }}>{Math.ceil(enemy.health)}/{enemy.definition.health} HP</div>
        </div>
      </Html>
      {/* Attack warning indicator - BIG pulsing red sphere when attacking */}
      {attackPulse > 0 && (
        <>
          <mesh position={[0, enemy.definition.size / 2 + 0.5, 0]}>
            <sphereGeometry args={[1.5 * (1 + attackPulse * 0.5), 16, 16]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={attackPulse * 5.0}
              transparent
              opacity={attackPulse * 0.6}
            />
          </mesh>
          {/* Inner bright core */}
          <mesh position={[0, enemy.definition.size / 2 + 0.5, 0]}>
            <sphereGeometry args={[0.8 * attackPulse, 12, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={attackPulse * 8.0}
              transparent
              opacity={attackPulse * 0.9}
            />
          </mesh>
        </>
      )}
      {/* Attack beam - draw a line from enemy to player when in attack range */}
      {distanceToPlayer <= ENEMY_ATTACK_RANGE && (
        <line>
          <bufferGeometry attach="geometry">
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                0, enemy.definition.size / 2, 0,
                playerPosition[0] - currentPositionRef.current[0],
                playerPosition[1] - currentPositionRef.current[1],
                playerPosition[2] - currentPositionRef.current[2]
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            attach="material"
            color="#ff0000"
            linewidth={5}
            opacity={isAttacking ? 1.0 : 0.5}
            transparent
          />
        </line>
      )}
      {/* Attack range indicator - ALWAYS SHOW when player is nearby */}
      {distanceToPlayer <= ENEMY_DETECTION_RANGE && (
        <>
          {/* Show detection range as yellow */}
          {distanceToPlayer > attackRange && distanceToPlayer <= ENEMY_DETECTION_RANGE && (
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[attackRange - 0.1, attackRange + 0.1, 32]} />
              <meshStandardMaterial
                color={isRanged ? "#ffff00" : "#ffff00"}
                emissive={isRanged ? "#ffff00" : "#ffff00"}
                emissiveIntensity={1.5}
                transparent
                opacity={0.5}
                side={2}
              />
            </mesh>
          )}

          {/* RED DANGER ZONE - Attack range circle */}
          {distanceToPlayer <= attackRange && (
            <>
              {/* Outer ring - bright red (or yellow for ranged) */}
              <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[attackRange - 0.2, attackRange, 32]} />
                <meshStandardMaterial
                  color={isRanged ? "#ffff00" : "#ff0000"}
                  emissive={isRanged ? "#ffff00" : "#ff0000"}
                  emissiveIntensity={5.0}
                  transparent
                  opacity={0.9}
                  side={2}
                />
              </mesh>
              {/* Filled danger zone */}
              <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[attackRange, 32]} />
                <meshStandardMaterial
                  color={isRanged ? "#ffff00" : "#ff0000"}
                  emissive={isRanged ? "#ffff00" : "#ff0000"}
                  emissiveIntensity={3.0}
                  transparent
                  opacity={0.4}
                  side={2}
                />
              </mesh>
              {/* Pulsing inner core */}
              <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[attackRange * 0.5, 32]} />
                <meshStandardMaterial
                  color="#ffffff"
                  emissive="#ffffff"
                  emissiveIntensity={attackPulse > 0 ? 8.0 : 4.0}
                  transparent
                  opacity={attackPulse > 0 ? 0.8 : 0.4}
                  side={2}
                />
              </mesh>
            </>
          )}
        </>
      )}
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
    </RigidBody>
    </>
  );
}

