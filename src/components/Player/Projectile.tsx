import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody, useRapier } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
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
  const hitRef = useRef(false);
  const lifetime = useRef(0);
  const maxLifetime = data.range || 2.0;
  const scale = data.size || 1.0;
  const positionRef = useRef(new Vector3(...origin));
  const directionRef = useRef(new Vector3(...(data.direction || [0, 0, -1])).normalize());

  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.setLinvel(directionRef.current.clone().multiplyScalar(data.speed), true);
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

    if (!data.phaseThroughWalls) {
      const rayOrigin = { x: positionRef.current.x, y: positionRef.current.y, z: positionRef.current.z };
      const rayDir = { x: directionRef.current.x, y: directionRef.current.y, z: directionRef.current.z };
      const ray = new rapier.Ray(rayOrigin, rayDir);
      const maxToi = data.speed * delta * 1.5;

      const hit = world.castRay(ray, maxToi, true);

      if (hit && hit.collider) {
        const parent = hit.collider.parent();
        const userData = (parent as any)?.userData;

        if (userData?.isPlayer || userData?.isFloor || userData?.isSensor) return;

        if (!hit.collider.isSensor()) {
          if (userData?.isWall) {
            onDestroy();
            return;
          }
        }
      }
    }

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

      // More generous fallback for large enemies
      // We don't have size in the map yet, so we use a slightly larger base distance
      const baseHitDist = 1.2; 
      if (distance < baseHitDist * scale && !hitRef.current) {
        hitRef.current = true;
        onHit?.(data.damage, enemy.id);
        onDestroy();
        return;
      }
    }

    if (data.behavior === 'homing' && realTimeEnemies.length > 0) {
      let nearestEnemy = realTimeEnemies[0];
      let nearestDist = positionRef.current.distanceTo(new Vector3(...nearestEnemy.position));

      for (const enemy of realTimeEnemies) {
        const dist = positionRef.current.distanceTo(new Vector3(...enemy.position));
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestEnemy = enemy;
        }
      }

      const targetVec = new Vector3(...nearestEnemy.position);
      const desiredDirection = new Vector3().subVectors(targetVec, positionRef.current).normalize();
      directionRef.current.lerp(desiredDirection, 0.1);
      directionRef.current.normalize();
      
      rigidBodyRef.current.setLinvel(directionRef.current.clone().multiplyScalar(data.speed), true);
    }
  });

  const color = data.color || (data.behavior === 'homing' ? '#ff00ff' : '#00ffff');

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={origin}
      type="dynamic"
      sensor
      userData={{ isPlayerProjectile: true }}
      // Ensure we detect everything including Fixed bodies
      // activeCollisionTypes={ActiveCollisionTypes.DEFAULT | ActiveCollisionTypes.FIXED} // This might be needed if defaults changed
      onIntersectionEnter={({ other }) => {
        const userData = other.rigidBodyObject?.userData;
        console.log('Project hit:', userData);
        
        
        if (userData?.isEnemy && !hitRef.current) {
          hitRef.current = true;
          onHit?.(data.damage, userData.enemyId);
          onDestroy();
        } else if (userData?.isBomb) {
          // Push the bomb slightly (bombs are heavy)
          const bombRigidBody = other.rigidBody;
          if (bombRigidBody) {
            const pushForce = data.damage * 0.2; // Reduced force for heavy bombs
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
        } else if (userData?.isWall || userData?.isFloor || !userData) {
           // Hit wall, floor, or untagged geometry (Rock?)
           // If it's not a sensor, we stop.
           // Check if it's a sensor via userData or collider method if available
           const isSensor = (other.collider as any)?.isSensor?.() || userData?.isSensor;
           
           if (!isSensor) {
               const t = rigidBodyRef.current?.translation();
               if (t) addEffect({ type: 'impact', position: [t.x, t.y, t.z], color: '#ffffff' });
               onDestroy();
           }
        }
      }}
      gravityScale={0}
      ccd={true}
    >
      <mesh ref={meshRef} castShadow scale={[scale, scale, scale]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
        />
      </mesh>
      <CuboidCollider args={[0.2 * scale, 0.2 * scale, 0.2 * scale]} />
    </RigidBody>
  );
}
