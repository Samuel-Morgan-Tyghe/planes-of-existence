import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { takeDamage } from '../../stores/player';

interface SoundWaveProps {
  origin: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  color: string;
  onDestroy: () => void;
  playerPosition: [number, number, number];
}

const PROJECTILE_LIFETIME = 6;
const HIT_DISTANCE = 1.0;

export function SoundWave({
  origin,
  direction,
  speed,
  damage,
  color,
  onDestroy,
  playerPosition,
}: SoundWaveProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lifetimeRef = useRef(0);
  const bounceCountRef = useRef(0);
  const hitRef = useRef(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(origin);
  const directionRef = useRef(new THREE.Vector3(...direction).normalize());

  // Initialize velocity
  useEffect(() => {
    if (!rigidBodyRef.current) return;
    const velocity = directionRef.current.clone().multiplyScalar(speed);
    rigidBodyRef.current.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
  }, [speed]);

  // Main update loop
  useFrame((state, delta) => {
    if (hitRef.current) return;

    if (rigidBodyRef.current) {
      const pos = rigidBodyRef.current.translation();
      setCurrentPosition([pos.x, pos.y, pos.z]);
      
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

    // Check collision with player
    const projVec = new THREE.Vector3(...currentPosition);
    const playerVec = new THREE.Vector3(...playerPosition);
    const distance = projVec.distanceTo(playerVec);

    if (distance < HIT_DISTANCE) {
      hitRef.current = true;
      takeDamage(damage);
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
      sensor={false}
      linearDamping={0}
      angularDamping={0}
      gravityScale={0}
      ccd={true}
      userData={{ isEnemyProjectile: true, damage, isSoundWave: true }}
      onCollisionEnter={(e) => {
        const userData = e.other.rigidBody?.userData as any;
        if (userData?.isWall) {
          if (bounceCountRef.current < 1) {
            // Reflect direction
            const contactNormal = e.manifold.normal();
            if (contactNormal) {
              const normal = new THREE.Vector3(contactNormal.x, contactNormal.y, contactNormal.z);
              directionRef.current.reflect(normal).normalize();
              
              const velocity = directionRef.current.clone().multiplyScalar(speed);
              rigidBodyRef.current?.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
              
              bounceCountRef.current++;
              console.log('🔊 SoundWave bounced! Remaining bounces: 0');
            }
          } else {
            onDestroy();
          }
        }
      }}
    >
      {/* Sound wave visual - a ring or disc */}
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
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
          opacity={0.3}
        />
      </mesh>
    </RigidBody>
  );
}
