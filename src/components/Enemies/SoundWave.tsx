import { useFrame } from '@react-three/fiber';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { takeDamage } from '../../stores/player';
import { projectileBodies } from '../../stores/projectiles';

interface SoundWaveProps {
  origin: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  color: string;
  size: number;
  lifetime?: number;
  onDestroy: () => void;
}

const PROJECTILE_LIFETIME = 6;

export function SoundWave({
  id,
  origin,
  direction,
  speed,
  damage,
  onDestroy,
  size,
  lifetime,
}: SoundWaveProps & { id: number }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const lifetimeRef = useRef(0);
  const hitRef = useRef(false);
  const directionRef = useRef(new THREE.Vector3(...direction).normalize());

  // Register physics body for instanced rendering
  useEffect(() => {
    if (rigidBodyRef.current) {
      projectileBodies.set(id, rigidBodyRef.current);
    }
    return () => {
      projectileBodies.delete(id);
    };
  }, [id]);

  // Initialize velocity
  useEffect(() => {
    if (!rigidBodyRef.current) return;
    const velocity = directionRef.current.clone().multiplyScalar(speed);
    rigidBodyRef.current.setLinvel({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
    // console.log('🔊 SoundWave spawned at', origin, 'direction', direction);
  }, [speed]);

  // Main update loop
  useFrame((_state, delta) => {
    if (hitRef.current) return;

    if (rigidBodyRef.current) {
      // Keep speed constant but respect current physics direction (bounce)
      const currentVel = rigidBodyRef.current.linvel();
      const velMag = Math.sqrt(currentVel.x ** 2 + currentVel.y ** 2 + currentVel.z ** 2);
      
      // If moving too slow or speed needs normalization to target speed
      if (Math.abs(velMag - speed) > 0.1 || velMag < 0.1) {
          // Normalize current velocity vector
          let dir = new THREE.Vector3(currentVel.x, currentVel.y, currentVel.z);
          if (velMag < 0.1) {
              // Fallback to original direction if stopped
              dir = directionRef.current.clone(); 
          } else {
              dir.normalize();
          }
          
          const newVel = dir.multiplyScalar(speed);
          rigidBodyRef.current.setLinvel({ x: newVel.x, y: newVel.y, z: newVel.z }, true);
      }
    }

    lifetimeRef.current += delta;
    const maxLifetime = lifetime !== undefined ? lifetime : PROJECTILE_LIFETIME;
    if (lifetimeRef.current >= maxLifetime) {
      onDestroy();
      return;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      mass={0.1}
      position={origin}
      sensor={false}
      linearDamping={0}
      angularDamping={0}
      gravityScale={0}
      restitution={1.0}
      friction={0}
      ccd={true}
      userData={{ isEnemyProjectile: true, damage, isSoundWave: true }}
      onCollisionEnter={(e) => {
        const userData = e.other.rigidBody?.userData as any;
        if (userData?.isWall) {
          // Bounce
        } else if (userData?.isPlayer) {
          console.log('🔊 SoundWave hit player!');
          hitRef.current = true;
          takeDamage(damage);
          onDestroy();
        }
      }}
    >
      <BallCollider args={[0.5 * size]} />
      {/* Visual representation */}
      <mesh castShadow>
        <sphereGeometry args={[0.5 * size, 8, 8]} />
        <meshStandardMaterial 
          color="#00ffff" 
          emissive="#00ffff"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>
    </RigidBody>
  );
}
