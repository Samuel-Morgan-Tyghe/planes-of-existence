import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { $position } from '../../stores/player';

interface CoinProps {
  position: [number, number, number];
  onCollect: () => void;
}

export function Coin({ position, onCollect }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [collected, setCollected] = useState(false);

  useFrame((state, delta) => {
    if (collected) return;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 3;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.5;
    }

    // Collection logic - read directly from store for real-time accuracy
    const playerPos = $position.get();
    const dx = playerPos[0] - position[0];
    const dz = playerPos[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < 2.0) {
      setCollected(true);
      onCollect();
    }
  });

  if (collected) return null;

  return (
    <group position={position}>
      <RigidBody type="fixed" sensor>
        <CuboidCollider args={[0.5, 0.5, 0.5]} />
        <mesh ref={meshRef} castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} emissive="#ffd700" emissiveIntensity={0.5} />
        </mesh>
      </RigidBody>
    </group>
  );
}
