import { Trail } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, useRapier } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { $currentRoomId, $enemyPositions } from '../../stores/game';
import { breakCrate } from '../../stores/loot';
import { emitDrop } from '../../systems/events';
import type { ProjectileData } from '../../types/game';
import { addEffect } from '../Effects/EffectsManager';

interface ProjectileProps {
  data: ProjectileData;
  origin: [number, number, number];
  onDestroy: () => void;
  onHit?: (damage: number, enemyId: number) => void;
}


export function Projectile({ data, origin, onDestroy, onHit }: ProjectileProps) {
  const { world, rapier } = useRapier();
  const meshRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<any>(null);
  const hitEnemies = useRef<Set<number>>(new Set());
  const lifetime = useRef(0);
  const maxLifetime = data.range || 2.0;
  const scale = data.size || 1.0;
  const positionRef = useRef(new Vector3(...origin));
  const directionRef = useRef(new Vector3(...(data.direction || [0, 0, -1])).normalize());

  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setLinvel(directionRef.current.clone().multiplyScalar(data.speed), true);

      // Orient the projectile to face its direction visually
      const dummy = new THREE.Object3D();
      dummy.lookAt(directionRef.current);
      rigidBodyRef.current.setRotation(dummy.quaternion, true);

      if (data.tumble) {
        rigidBodyRef.current.setAngvel({
          x: Math.random() * 10 - 5,
          y: Math.random() * 10 - 5,
          z: Math.random() * 10 - 5
        }, true);
      }
    }
  }, []);

  useFrame((_state, delta) => {
    if (!meshRef.current || !rigidBodyRef.current) return;

    lifetime.current += delta;
    if (lifetime.current > maxLifetime) {
      onDestroy();
      return;
    }

    const currentPosition = rigidBodyRef.current.translation();
    positionRef.current.set(currentPosition.x, currentPosition.y, currentPosition.z);

    // Wobble Mechanic (Sine Wave)
    if (data.wobble) {
      const time = _state.clock.elapsedTime;
      const frequency = 10;
      const offset = Math.sin(time * frequency) * data.wobble;

      // Calculate perpendicular vector
      const up = new Vector3(0, 1, 0);
      let perp = new Vector3().crossVectors(directionRef.current, up).normalize();
      if (perp.lengthSq() < 0.01) perp = new Vector3(1, 0, 0); // Handle straight up/down

      const wobbleDir = directionRef.current.clone().add(perp.multiplyScalar(offset)).normalize();
      rigidBodyRef.current.setLinvel(wobbleDir.multiplyScalar(data.speed), true);
    }

    if (!data.phaseThroughWalls) {
      // ... (Keep existing raycast logic) ...
      const rayOrigin = { x: positionRef.current.x, y: positionRef.current.y, z: positionRef.current.z };
      const rayDir = { x: directionRef.current.x, y: directionRef.current.y, z: directionRef.current.z };
      const ray = new rapier.Ray(rayOrigin, rayDir);
      const maxToi = data.speed * delta * 1.5;

      const hit = world.castRay(ray, maxToi, true);

      if (hit && hit.collider) {
        const rayHit = hit as any; // Bypass TS check for normal/point if missing in types
        const parent = hit.collider.parent();
        const userData = (parent as any)?.userData;
        if (userData?.isPlayer || userData?.isFloor || userData?.isSensor) {
          // continue 
        } else if (!hit.collider.isSensor()) {
          if (userData?.isWall) {
            // Spawn Decal
            const normal = rayHit.normal || { x: 0, y: 1, z: 0 };
            // Calculate rotation from normal (align Y up to normal)
            const dummy = new THREE.Object3D();
            dummy.lookAt(normal.x, normal.y, normal.z);

            const n = new THREE.Vector3(normal.x, normal.y, normal.z);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
            const e = new THREE.Euler().setFromQuaternion(q);

            addEffect({
              type: 'decal',
              position: [rayHit.point.x + normal.x * 0.05, rayHit.point.y + normal.y * 0.05, rayHit.point.z + normal.z * 0.05],
              rotation: [e.x, e.y, e.z],
              color: '#000000',
              size: scale * 1.5
            });

            onDestroy();
            return;
          }
        }
      }
    }

    // ... (Keep existing fallback hit detection) ...
    // Fallback hit detection (proximity)
    const enemyPositionsMap = $enemyPositions.get();
    const realTimeEnemies = Object.entries(enemyPositionsMap).map(([id, pos]) => ({
      id: parseInt(id),
      position: pos as [number, number, number]
    }));

    for (const enemy of realTimeEnemies) {
      const dx = positionRef.current.x - enemy.position[0];
      const dy = positionRef.current.y - enemy.position[1];
      const dz = positionRef.current.z - enemy.position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const baseHitDist = 1.2;
      const hasPierce = (data.pierce || 0) > 0;
      if (distance < baseHitDist * scale) {
        if (hitEnemies.current.has(enemy.id)) continue;
        hitEnemies.current.add(enemy.id);
        onHit?.(data.damage, enemy.id);
        if (!hasPierce) { onDestroy(); return; }
      }
    }

    if (data.behavior === 'homing' && realTimeEnemies.length > 0) {
      // ... (Keep existing homing) ...
      let nearestEnemy = realTimeEnemies[0];
      let nearestDist = positionRef.current.distanceTo(new Vector3(...nearestEnemy.position));
      for (const enemy of realTimeEnemies) {
        const dist = positionRef.current.distanceTo(new Vector3(...enemy.position));
        if (dist < nearestDist) { nearestDist = dist; nearestEnemy = enemy; }
      }
      const targetVec = new Vector3(...nearestEnemy.position);
      const desiredDirection = new Vector3().subVectors(targetVec, positionRef.current).normalize();
      directionRef.current.lerp(desiredDirection, 0.1);
      directionRef.current.normalize();
      rigidBodyRef.current.setLinvel(directionRef.current.clone().multiplyScalar(data.speed), true);
    }
  });

  const color = data.color || (data.behavior === 'homing' ? '#ff00ff' : '#00ffff');
  const hasPierce = (data.pierce || 0) > 0;

  // Logic to determine shape:
  // If explicitly set, use it.
  // Else if tumbler (Dull Prism), default to Cube.
  // Else if pierce, default to Cone.
  // Else Sphere.
  const shape = data.shape || (data.tumble ? 'cube' : (hasPierce ? 'cone' : 'sphere'));

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={origin}
      type="dynamic"
      sensor
      userData={{ isPlayerProjectile: true, pierce: hasPierce }}
      gravityScale={data.hasGravity ? 3.0 : 0}
      linearDamping={data.hasGravity ? 0.5 : 0}
      angularDamping={data.tumble ? 0 : 0.5} // Allow tumblers to spin freely
      ccd={true}
      onIntersectionEnter={({ other }) => {
        // ... (Keep existing intersection logic, just ensuring no syntax error in wrap)
        const userData = other.rigidBodyObject?.userData;
        if (data.hasGravity && (userData?.isFloor || userData?.isWall || !userData)) {
          const t = rigidBodyRef.current?.translation();
          if (t) addEffect({ type: 'impact', position: [t.x, t.y + 0.1, t.z], color: data.color || '#00CED1', size: 2.0, duration: 0.5 });
        }

        if (userData?.isEnemy) {
          const enemyId = userData.enemyId;
          if (hitEnemies.current.has(enemyId)) return;
          hitEnemies.current.add(enemyId);
          onHit?.(data.damage, enemyId);
          const enemyBody = other.rigidBody;
          if (enemyBody) {
            const kbForce = data.knockback || 5;
            const impulse = directionRef.current.clone().multiplyScalar(kbForce);
            impulse.y += kbForce * 0.2;
            enemyBody.applyImpulse(impulse, true);
          }
          if (!hasPierce) { onDestroy(); } else {
            const t = rigidBodyRef.current?.translation();
            if (t) addEffect({ type: 'impact', position: [t.x, t.y, t.z], color: '#ffffff', size: 0.5 });
          }
        } else if (userData?.isBomb) {
          const bombRigidBody = other.rigidBody;
          if (bombRigidBody) {
            const pushForce = data.damage * 0.2;
            const impulse = directionRef.current.clone().multiplyScalar(pushForce);
            bombRigidBody.applyImpulse(impulse, true);
          }
          onDestroy();
        } else if (userData?.isEnemyProjectile) {
          addEffect({ type: 'impact', position: [other.rigidBody?.translation().x || 0, other.rigidBody?.translation().y || 0, other.rigidBody?.translation().z || 0], color: '#ffff00' });
          onDestroy();
        } else if (userData?.isBreakable) {
          breakCrate(userData.crateId);
          const t = other.rigidBody?.translation();
          if (t) emitDrop([t.x, 0.1, t.z], $currentRoomId.get());
          addEffect({ type: 'impact', position: [t?.x || 0, t?.y || 0, t?.z || 0], color: '#8B4513' });
          onDestroy();
        } else if (userData?.isWall || (!data.hasGravity && !userData)) {
          // Ignore floor if no gravity (prevent popping on ground spawn)
          if (userData?.isFloor) return;

          const isSensor = (other.collider as any)?.isSensor?.() || userData?.isSensor;
          if (!isSensor) {
            const t = rigidBodyRef.current?.translation();
            if (t) {
              addEffect({ type: 'impact', position: [t.x, t.y, t.z], color: '#ffffff' });

              // Approximate normal is opposite of velocity
              const n = directionRef.current.clone().negate().normalize();
              const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
              const e = new THREE.Euler().setFromQuaternion(q);

              addEffect({
                type: 'decal',
                position: [t.x - directionRef.current.x * 0.2, t.y - directionRef.current.y * 0.2, t.z - directionRef.current.z * 0.2],
                rotation: [e.x, e.y, e.z],
                color: '#000000',
                size: scale * 1.5
              });
            }
            onDestroy();
          }
        }
      }}
    >
      <Trail
        width={0.4 * scale}
        length={4}
        color={color}
        attenuation={(t) => t * t}
      >
        <mesh ref={meshRef} castShadow scale={[scale, scale, scale]} rotation={shape === 'cone' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
          {shape === 'cone' && <coneGeometry args={[0.2, 0.8, 16]} />}
          {shape === 'cube' && <boxGeometry args={[0.4, 0.4, 0.4]} />}
          {shape === 'sphere' && <sphereGeometry args={[0.2, 16, 16]} />}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
          />
        </mesh>
      </Trail>
      <CuboidCollider args={[0.2 * scale, 0.2 * scale, (shape === 'cone' ? 0.4 : 0.2) * scale]} />
    </RigidBody>
  );
}
