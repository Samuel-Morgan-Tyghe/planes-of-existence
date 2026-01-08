import { useFrame } from '@react-three/fiber';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { takeDamage } from '../../stores/player';
import { projectileBodies } from '../../stores/projectiles';

interface EnemyProjectileProps {
  origin: [number, number, number];
  direction: [number, number, number];
  speed: number;
  damage: number;
  color: string;
  size: number;
  lifetime?: number;
  gravityScale?: number;
  maintainVelocity?: boolean;
  onDestroy: () => void;
}

const PROJECTILE_LIFETIME = 5; // 5 seconds

export function EnemyProjectile({
  id,
  origin,
  direction,
  speed,
  damage,
  color,
  onDestroy,
  size,
  lifetime,
  gravityScale = 0,
  maintainVelocity = true,
}: EnemyProjectileProps & { id: number }) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const lifetimeRef = useRef(0);
  const hitRef = useRef(false);
  const directionRef = useRef(new Vector3(...direction).normalize());

  // Register physics body for instanced rendering
  useEffect(() => {
    if (rigidBodyRef.current) {
      projectileBodies.set(id, rigidBodyRef.current);
    }
    return () => {
      projectileBodies.delete(id);
    };
  }, [id]);

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
    if (!rigidBodyRef.current || hitRef.current || !maintainVelocity) return;

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

  // Main update loop - track lifetime
  useFrame((_state, delta) => {
    if (hitRef.current) return;

    lifetimeRef.current += delta;

    // Destroy when lifetime expires
    const maxLifetime = lifetime !== undefined ? lifetime : PROJECTILE_LIFETIME;
    if (lifetimeRef.current >= maxLifetime) {
      onDestroy();
      return;
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false} // Use explicit collider below
      mass={0.1}
      position={origin}
      sensor={false} // Physical object for CCD
      linearDamping={0}
      angularDamping={0}
      gravityScale={gravityScale}
      ccd={true} // Continuous Collision Detection
      userData={{ isEnemyProjectile: true, damage }}
      onCollisionEnter={(e) => {
        const userData = e.other.rigidBody?.userData as any;
        if (userData?.isWall) {
          // console.log('🧱 EnemyProjectile hit wall');
          onDestroy();
        } else if (userData?.isPlayerProjectile) {
          console.log('⚔️ Enemy projectile shot down!');
          onDestroy();
        } else if (userData?.isPlayer) {
          console.log('💥 EnemyProjectile hit player!');
          hitRef.current = true;
          takeDamage(damage);
          onDestroy();
        }
      }}
    >
      <BallCollider args={[0.5 * size]} />
      {/* Direct Visual Rendering - Bypassing InstancedMesh for reliability */}
      <mesh castShadow>
        <sphereGeometry args={[0.5 * size, 8, 8]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </RigidBody>
  );
}
