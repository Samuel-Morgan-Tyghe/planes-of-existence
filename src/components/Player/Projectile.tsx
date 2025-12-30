import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { $enemyPositions } from '../../stores/game';
import type { ProjectileData } from '../../types/game';

interface ProjectileProps {
  data: ProjectileData;
  origin: [number, number, number];
  onDestroy: () => void;
  onHit?: (damage: number, enemyId: number) => void;
}

const PROJECTILE_LIFETIME = 3; // seconds
const HIT_DISTANCE = 0.8; // Reduced to prevent false positives

export function Projectile({ data, origin, onDestroy, onHit }: ProjectileProps) {
  const { world, rapier } = useRapier();
  const meshRef = useRef<THREE.Mesh>(null);
  const lifetimeRef = useRef(0);
  const hitRef = useRef(false);
  const positionRef = useRef(new Vector3(...origin));
  const directionRef = useRef(new Vector3(...(data.direction || [0, 0, -1])).normalize());

  useEffect(() => {
    console.log(`🚀 Projectile created at`, origin);
    return () => console.log(`💥 Projectile destroyed`);
  }, []);

  // Main update loop
  useFrame((_state, delta) => {
    if (hitRef.current) return;

    // Update position
    const movement = directionRef.current.clone().multiplyScalar(data.speed * delta);
    positionRef.current.add(movement);

    // Update mesh position
    if (meshRef.current) {
      meshRef.current.position.copy(positionRef.current);
    }

    // Check for wall collisions (if not phasing)
    if (!data.phaseThroughWalls) {
      const rayOrigin = { x: positionRef.current.x, y: positionRef.current.y, z: positionRef.current.z };
      const rayDir = { x: directionRef.current.x, y: directionRef.current.y, z: directionRef.current.z };
      const ray = new rapier.Ray(rayOrigin, rayDir);
      // Cast ray for the distance moved this frame + small buffer
      const maxToi = data.speed * delta * 1.5;
      
      // 0x0004 is WALL group (from PRD)
      // But we can just check everything and filter by userData if needed
      // For now, let's assume anything static that isn't an enemy is a wall
      const hit = world.castRay(ray, maxToi, true);
      
      if (hit && hit.collider) {
        const parent = hit.collider.parent();
        const userData = (parent as any)?.userData;
        
        // Ignore player and floor
        if (userData?.isPlayer || userData?.isFloor) {
          return;
        }

        // Only destroy if it's a wall or something solid that isn't a sensor
        if (!hit.collider.isSensor()) {
          if (userData?.isWall) {
            console.log('🧱 Projectile hit wall');
            onDestroy();
            return;
          }
          
          // If it's solid but not a wall/player/floor, and not an enemy (handled below), destroy it
          // But let's be safe and only destroy on walls for now to avoid invisible collisions
          // console.log('🧱 Projectile hit unknown solid object', userData);
        }
      }
    }

    lifetimeRef.current += delta;

    // Destroy when lifetime expires
    if (lifetimeRef.current >= PROJECTILE_LIFETIME) {
      onDestroy();
      return;
    }

    // Check for enemy hits - use Nanostore for real-time positions
    const enemyPositionsMap = $enemyPositions.get();
    const realTimeEnemies = Object.entries(enemyPositionsMap).map(([id, pos]) => ({
      id: parseInt(id),
      position: pos
    }));
    
    for (const enemy of realTimeEnemies) {
      const dx = positionRef.current.x - enemy.position[0];
      const dy = positionRef.current.y - enemy.position[1];
      const dz = positionRef.current.z - enemy.position[2];
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < HIT_DISTANCE) {
        hitRef.current = true;
        console.log(`🎯 Projectile HIT Enemy ${enemy.id} at distance ${distance.toFixed(2)}`);
        onHit?.(data.damage, enemy.id);
        onDestroy();
        return;
      }
    }

    // Homing behavior
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

      // Steer toward nearest enemy (gradual steering)
      const targetVec = new Vector3(...nearestEnemy.position);
      const desiredDirection = new Vector3().subVectors(targetVec, positionRef.current).normalize();
      directionRef.current.lerp(desiredDirection, 0.1);
      directionRef.current.normalize();
    }
  });

  const color = data.color || (data.behavior === 'homing' ? '#ff00ff' : '#00ffff');

  return (
    <mesh ref={meshRef} position={origin} frustumCulled={false}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
