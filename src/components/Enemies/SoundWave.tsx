import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { takeDamage } from '../../stores/player';

interface SoundWaveProps {
  origin: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  color: string;
  onDestroy: () => void;
}

const PROJECTILE_LIFETIME = 6;

export function SoundWave({
  origin,
  direction,
  speed,
  damage,
  color,
  onDestroy,
}: SoundWaveProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lifetimeRef = useRef(0);
  const hitRef = useRef(false);
  console.log(`🌊 SoundWave ${origin} component rendering. Hit: ${hitRef.current}`);
  const directionRef = useRef(new THREE.Vector3(...direction).normalize());

  // Initialize velocity
  useEffect(() => {
    if (!rigidBodyRef.current) return;
    const velocity = directionRef.current.clone().multiplyScalar(speed);
    rigidBodyRef.current.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    console.log('🔊 SoundWave spawned at', origin, 'direction', direction);
  }, [speed]);

  // Main update loop
  useFrame((state, delta) => {
    if (hitRef.current) return;

    if (rigidBodyRef.current) {
      // Keep velocity constant (no friction/damping)
      const currentVel = rigidBodyRef.current.linvel();
      const velMag = Math.sqrt(currentVel.x ** 2 + currentVel.y ** 2 + currentVel.z ** 2);
      if (velMag < speed * 0.9) {
        const velocity = directionRef.current.clone().multiplyScalar(speed);
        rigidBodyRef.current.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
      }
    }

    lifetimeRef.current += delta;
    if (lifetimeRef.current >= PROJECTILE_LIFETIME) {
      onDestroy();
      return;
    }

    // Animate mesh (pulsing effect)
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="ball"
      mass={0.1}
      position={origin}
      sensor={true}
      linearDamping={0}
      angularDamping={0}
      gravityScale={0}
      ccd={true}
      userData={{ isEnemyProjectile: true, damage, isSoundWave: true }}
      onIntersectionEnter={(e) => {
        const userData = e.other.rigidBody?.userData as any;
        if (userData?.isWall) {
          console.log('🔊 SoundWave hit wall');
          onDestroy();
        } else if (userData?.isPlayer) {
          console.log('🔊 SoundWave hit player!');
          hitRef.current = true;
          takeDamage(damage);
          onDestroy();
        }
      }}
    >
      {/* Sound wave visual - a ring or disc */}
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.15, 16, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={4}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Inner glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </RigidBody>
  );
}
