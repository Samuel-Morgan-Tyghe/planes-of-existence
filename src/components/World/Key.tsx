import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useState } from 'react';
import { $position } from '../../stores/player';

interface KeyProps {
  position: [number, number, number];
  onCollect: () => void;
}

const COLLECT_DISTANCE = 2;
const MAGNET_DISTANCE = 8; // Distance at which magnetism starts
const MAGNET_SPEED = 4; // Speed of attraction

export function Key({ position, onCollect }: KeyProps) {
  const [rotation, setRotation] = useState(0);
  const [collected, setCollected] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(position);

  useFrame((_, delta) => {
    if (collected) return;

    // Rotate key
    setRotation((prev) => prev + delta * 2);

    // Calculate distance to player - read directly from store for real-time accuracy
    const playerPos = $position.get();
    const dx = playerPos[0] - currentPosition[0];
    const dz = playerPos[2] - currentPosition[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    // Magnetism - pull toward player if within range
    if (distance < MAGNET_DISTANCE && distance > COLLECT_DISTANCE) {
      const dirX = dx / distance;
      const dirZ = dz / distance;
      const magnetStrength = 1 - (distance / MAGNET_DISTANCE); // Stronger when closer
      const moveSpeed = MAGNET_SPEED * magnetStrength * delta;

      setCurrentPosition([
        currentPosition[0] + dirX * moveSpeed,
        currentPosition[1],
        currentPosition[2] + dirZ * moveSpeed,
      ]);
    }

    // Check if collected
    if (distance < COLLECT_DISTANCE) {
      setCollected(true);
      console.log('🔑 Key collected!');
      onCollect();
    }
  });

  if (collected) return null;

  return (
    <group position={currentPosition}>
      {/* Key body */}
      <mesh position={[0, 1, 0]} rotation={[0, rotation, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={3.0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Key head */}
      <mesh position={[0, 1.3, 0]} rotation={[0, rotation, 0]}>
        <torusGeometry args={[0.2, 0.05, 8, 16]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={3.0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Glow effect */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={2.0}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Label */}
      <Html position={[0, 2, 0]} center>
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 0, 0.8)',
            color: '#000000',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          🔑 KEY
        </div>
      </Html>
    </group>
  );
}
