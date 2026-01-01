import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
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
          // console.log('🔊 SoundWave hit wall');
          onDestroy();
        } else if (userData?.isPlayer) {
          console.log('🔊 SoundWave hit player!');
          hitRef.current = true;
          takeDamage(damage);
          onDestroy();
        }
      }}
    >
      {/* No mesh - rendered via InstancedMesh in ProjectileManager */}
    </RigidBody>
  );
}
