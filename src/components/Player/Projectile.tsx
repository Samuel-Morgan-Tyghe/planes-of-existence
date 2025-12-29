import { useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import { useRef } from 'react';
import { Vector3 } from 'three';
import type { ProjectileData } from '../../types/game';

interface ProjectileProps {
  data: ProjectileData;
  origin: [number, number, number];
  onDestroy: () => void;
  onHit?: (damage: number, enemyId?: number) => void;
  enemyPositions?: Array<{ id: number; position: [number, number, number] }>;
}

const PROJECTILE_LIFETIME = 3; // seconds
const HIT_DISTANCE = 2.0; // Increased to ensure hits register

export function Projectile({ data, origin, onDestroy, onHit, enemyPositions = [] }: ProjectileProps) {
  const { world, rapier } = useRapier();
  const meshRef = useRef<THREE.Mesh>(null);
  const lifetimeRef = useRef(0);
  const hitRef = useRef(false);
  const positionRef = useRef(new Vector3(...origin));
  const directionRef = useRef(new Vector3(...(data.direction || [0, 0, -1])).normalize());
  const enemyPositionsRef = useRef(enemyPositions);

  // Update enemy positions ref on every render
  enemyPositionsRef.current = enemyPositions;

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
        // Check if we hit a wall
        // Note: Rapier colliders might not have userData directly accessible easily in all versions
        // But we can check collision groups or just assume static hits are walls
        // Let's rely on the fact that enemies are dynamic and we're mostly worried about static walls
        // Or check if the collider is a sensor (triggers shouldn't stop bullets)
        
        if (!hit.collider.isSensor()) {
           // We hit something solid
           // Check if it's an enemy (we handle enemy collision separately for now, but raycast might hit them too)
           // If we want to be precise, we should check what we hit.
           // For now, let's just destroy on wall hit.
           // To distinguish walls from enemies (which are also solid), we can check collision groups if we set them up.
           // Enemies are group 0x0002. Walls are 0x0004.
           // Let's try to access collision group if possible, or just destroy.
           // Actually, enemies are RigidBodies too.
           
           // Simple hack: If we hit something, and it's NOT an enemy (which we check by distance below), it's likely a wall.
           // But wait, the raycast might hit an enemy before we check distance.
           
           // Let's refine: Only stop if we hit something that is NOT an enemy.
           // We can check the interaction groups or userData if we attached it to the collider.
           
           // For this implementation, let's assume walls are the main static obstacles.
           // We can check `hit.collider.parent()?.userData` if we attached it to the RigidBody.
           
           const userData = (hit.collider.parent() as any)?.userData;
           if (userData?.isWall) {
             console.log('🧱 Hit wall');
             onDestroy();
             return;
           }
        }
      }
    }

    lifetimeRef.current += delta;

    // Destroy when lifetime expires
    if (lifetimeRef.current >= PROJECTILE_LIFETIME) {
      onDestroy();
      return;
    }

    const currentEnemies = enemyPositionsRef.current;


    // Check collision with enemies (immediate, no delay)
    if (currentEnemies.length > 0) {
      for (const enemy of currentEnemies) {
        const enemyVec = new Vector3(...enemy.position);
        const distance = positionRef.current.distanceTo(enemyVec);

        if (distance < HIT_DISTANCE) {
          hitRef.current = true;
          console.log(`💥 HIT Enemy ${enemy.id}`);
          onHit?.(data.damage, enemy.id);
          onDestroy();
          return;
        }
      }
    }

    // Homing behavior
    if (data.behavior === 'homing' && currentEnemies.length > 0) {
      let nearestEnemy = currentEnemies[0];
      let nearestDist = positionRef.current.distanceTo(new Vector3(...nearestEnemy.position));

      for (const enemy of currentEnemies) {
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
