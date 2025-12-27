import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useState } from 'react';

interface BombProps {
  position: [number, number, number];
  onCollect: () => void;
  playerPosition: [number, number, number];
}

const COLLECT_DISTANCE = 2;
const MAGNET_DISTANCE = 8; // Distance at which magnetism starts
const MAGNET_SPEED = 4; // Speed of attraction

export function Bomb({ position, onCollect, playerPosition }: BombProps) {
  const [pulse, setPulse] = useState(0);
  const [collected, setCollected] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(position);

  useFrame((_, delta) => {
    if (collected) return;

    // Pulse effect
    setPulse((prev) => (prev + delta * 3) % (Math.PI * 2));

    // Calculate distance to player
    const dx = playerPosition[0] - currentPosition[0];
    const dz = playerPosition[2] - currentPosition[2];
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
      console.log('💣 Bomb collected!');
      onCollect();
    }
  });

  if (collected) return null;

  const pulseScale = 1 + Math.sin(pulse) * 0.2;

  return (
    <group position={currentPosition}>
      {/* Bomb body */}
      <mesh position={[0, 0.5, 0]} scale={[pulseScale, pulseScale, pulseScale]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#ff0000"
          emissiveIntensity={1 + Math.sin(pulse) * 0.5}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>

      {/* Fuse */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ff6600"
          emissiveIntensity={2.0}
        />
      </mesh>

      {/* Spark at top of fuse */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={5.0}
        />
      </mesh>

      {/* Danger glow */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff0000"
          emissiveIntensity={1.5}
          transparent
          opacity={0.2 + Math.sin(pulse) * 0.1}
        />
      </mesh>

      {/* Label */}
      <Html position={[0, 1.5, 0]} center>
        <div
          style={{
            backgroundColor: 'rgba(255, 0, 0, 0.8)',
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          💣 BOMB
        </div>
      </Html>
    </group>
  );
}
