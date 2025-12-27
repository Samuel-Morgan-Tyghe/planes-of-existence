import { useFrame } from '@react-three/fiber';
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
const HIT_DISTANCE = 1.2; // Distance to consider a hit

export function Projectile({ data, origin, onDestroy, onHit, enemyPositions = [] }: ProjectileProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lifetimeRef = useRef(0);
  const hitRef = useRef(false);
  const positionRef = useRef(new Vector3(...origin));
  const directionRef = useRef(new Vector3(...(data.direction || [0, 0, -1])).normalize());

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

    lifetimeRef.current += delta;

    // Destroy when lifetime expires
    if (lifetimeRef.current >= PROJECTILE_LIFETIME) {
      onDestroy();
      return;
    }

    // Check collision with enemies (skip first 0.1s to avoid spawn hits)
    if (enemyPositions.length > 0 && lifetimeRef.current > 0.1) {
      for (const enemy of enemyPositions) {
        const enemyVec = new Vector3(...enemy.position);
        const distance = positionRef.current.distanceTo(enemyVec);

        if (distance < HIT_DISTANCE) {
          hitRef.current = true;
          onHit?.(data.damage, enemy.id);
          onDestroy();
          return;
        }
      }
    }

    // Homing behavior
    if (data.behavior === 'homing' && enemyPositions.length > 0) {
      let nearestEnemy = enemyPositions[0];
      let nearestDist = positionRef.current.distanceTo(new Vector3(...nearestEnemy.position));

      for (const enemy of enemyPositions) {
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
    <mesh ref={meshRef} position={origin}>
      <sphereGeometry args={[0.3, 8, 8]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}
