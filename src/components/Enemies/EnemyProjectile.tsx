import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { takeDamage } from '../../stores/player';

interface EnemyProjectileProps {
  origin: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  color: string;
  onDestroy: () => void;
  playerPosition: [number, number, number];
}

const PROJECTILE_LIFETIME = 5; // 5 seconds
const HIT_DISTANCE = 0.8; // Distance to consider a hit on player

export function EnemyProjectile({
  origin,
  direction,
  speed,
  damage,
  color,
  onDestroy,
  playerPosition,
}: EnemyProjectileProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lifetimeRef = useRef(0);
  const hitRef = useRef(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(origin);
  const directionRef = useRef(new Vector3(...direction).normalize());

  // Initialize velocity once
  useEffect(() => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;
    const dir = directionRef.current.clone().normalize();
    const velocity = dir.multiplyScalar(speed);
    rb.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
  }, [speed]);

  // Maintain velocity every frame
  useFrame(() => {
    if (!rigidBodyRef.current || hitRef.current) return;

    const rb = rigidBodyRef.current;
    const currentVel = rb.linvel();

    // If velocity is too low, reapply it
    const velMag = Math.sqrt(currentVel.x ** 2 + currentVel.y ** 2 + currentVel.z ** 2);
    if (velMag < speed * 0.9) {
      const dir = directionRef.current.clone().normalize();
      const velocity = dir.multiplyScalar(speed);
      rb.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    }
  });

  // Main update loop - track position, lifetime, and collision
  useFrame((_state, delta) => {
    if (hitRef.current) return;

    // Track position from rigid body (world position)
    if (rigidBodyRef.current) {
      const pos = rigidBodyRef.current.translation();
      const newPos: [number, number, number] = [pos.x, pos.y, pos.z];
      setCurrentPosition(newPos);
    }

    lifetimeRef.current += delta;

    // Destroy when lifetime expires
    if (lifetimeRef.current >= PROJECTILE_LIFETIME) {
      onDestroy();
      return;
    }

    // Check collision with player
    const projVec = new Vector3(...currentPosition);
    const playerVec = new Vector3(...playerPosition);
    const distance = projVec.distanceTo(playerVec);

    if (distance < HIT_DISTANCE) {
      hitRef.current = true;
      takeDamage(damage);
      onDestroy();
      return;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="ball"
      mass={0.1}
      position={origin}
      sensor={false}
      linearDamping={0}
      angularDamping={0}
      gravityScale={0}
      collisionGroups={0x00020003}
      userData={{ isEnemyProjectile: true, damage }}
      onCollisionEnter={(e) => {
        // Destroy projectile on wall collision
        const userData = e.other.rigidBody?.userData;
        if (userData && (userData as any).isWall) {
          onDestroy();
        }
      }}
    >
      {/* Main projectile - glowing sphere */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={5.0}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={3.0}
          transparent
          opacity={0.4}
        />
      </mesh>
    </RigidBody>
  );
}
