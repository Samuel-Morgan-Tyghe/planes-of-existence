import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { $position } from '../../stores/player';

interface CoinProps {
  position: [number, number, number];
  value?: number;
  onCollect: () => void;
}

const COLLECT_DISTANCE = 1.8;
const MAGNET_DISTANCE = 6;
const MAGNET_SPEED = 6;

export function Coin({ position, value = 1, onCollect }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const [collected, setCollected] = useState(false);
  const collectedRef = useRef(false);
  const isCollectableRef = useRef(false);

  // Determine appearance based on value
  const color = value >= 50 ? '#ff00ff' : value >= 10 ? '#ffd700' : value >= 5 ? '#c0c0c0' : '#b87333';
  const scale = value >= 50 ? 1.5 : value >= 10 ? 1.2 : 1.0;

  useEffect(() => {
    const timer = setTimeout(() => {
      isCollectableRef.current = true;
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const setBodyRef = (body: RapierRigidBody | null) => {
    rigidBodyRef.current = body;
    if (body) {
      const angle = Math.random() * Math.PI * 2;
      const force = 3 + Math.random() * 2;
      try {
        body.applyImpulse({
          x: Math.cos(angle) * force,
          y: 5 + Math.random() * 3,
          z: Math.sin(angle) * force
        }, true);
      } catch (e) { /* ignore */ }
    }
  };

  useFrame((_state, delta) => {
    if (collectedRef.current || !rigidBodyRef.current) return;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 4;
    }

    const playerPos = $position.get();
    const rbPosition = rigidBodyRef.current.translation();

    const dx = playerPos[0] - rbPosition.x;
    const dy = playerPos[1] - rbPosition.y;
    const dz = playerPos[2] - rbPosition.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < MAGNET_DISTANCE && isCollectableRef.current) {
      const strength = 1 - (distance / MAGNET_DISTANCE);
      const force = MAGNET_SPEED * strength * 25.0;

      rigidBodyRef.current.applyImpulse({
        x: (dx / distance) * force * delta,
        y: dy * force * delta + 5.0 * delta,
        z: (dz / distance) * force * delta
      }, true);
      rigidBodyRef.current.setLinearDamping(2.0);
    } else {
      rigidBodyRef.current.setLinearDamping(1.0);
    }

    if (distance < COLLECT_DISTANCE && isCollectableRef.current) {
      collectedRef.current = true;
      setCollected(true);
      onCollect();
    }
  });

  if (collected) return null;

  return (
    <RigidBody
      ref={setBodyRef}
      position={position}
      type="dynamic"
      colliders={false}
      restitution={0.7}
      friction={0.5}
      userData={{ type: 'pickup_coin' }}
    >
      <BallCollider args={[0.3]} />
      <BallCollider
        args={[1.5]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.userData?.isPlayer && isCollectableRef.current && !collectedRef.current) {
            collectedRef.current = true;
            setCollected(true);
            onCollect();
          }
        }}
      />
      <mesh ref={meshRef} castShadow rotation={[Math.PI / 2, 0, 0]} scale={[scale, scale, scale]}>
        <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <Html position={[0, 0.8, 0]} center>
        <div style={{ color: color, fontWeight: 'bold', fontSize: '12px', textShadow: '0 0 4px black' }}>${value}</div>
      </Html>
    </RigidBody>
  );
}
