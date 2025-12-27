import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useState } from 'react';

interface ChestProps {
  position: [number, number, number];
  variety: number; // How many items in the chest
  onCollect: () => void;
  playerPosition: [number, number, number];
}

const COLLECT_DISTANCE = 2;

export function Chest({ position, variety, onCollect, playerPosition }: ChestProps) {
  const [bob, setBob] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [collected, setCollected] = useState(false);

  useFrame((_, delta) => {
    if (collected) return;

    // Bob up and down
    setBob((prev) => (prev + delta * 2) % (Math.PI * 2));

    // Slow rotation
    setRotation((prev) => prev + delta * 0.5);

    // Check distance to player
    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < COLLECT_DISTANCE) {
      setCollected(true);
      console.log(`💎 Chest opened! Got ${variety} items!`);
      onCollect();
    }
  });

  if (collected) return null;

  const bobOffset = Math.sin(bob) * 0.2;

  return (
    <group position={position}>
      <group position={[0, 0.5 + bobOffset, 0]} rotation={[0, rotation, 0]}>
        {/* Chest base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.4]} />
          <meshStandardMaterial
            color="#8B4513"
            emissive="#442200"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Chest lid */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.4]} />
          <meshStandardMaterial
            color="#A0522D"
            emissive="#553311"
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Golden lock */}
        <mesh position={[0, 0, 0.21]}>
          <boxGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial
            color="#FFD700"
            emissive="#FFD700"
            emissiveIntensity={2.0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Sparkles for variety */}
        {[...Array(variety)].map((_, i) => {
          const angle = (i / variety) * Math.PI * 2 + rotation * 2;
          const radius = 0.6;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                0.5 + Math.sin(bob * 2 + i) * 0.1,
                Math.sin(angle) * radius,
              ]}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial
                color="#FFD700"
                emissive="#FFD700"
                emissiveIntensity={4.0}
                transparent
                opacity={0.8}
              />
            </mesh>
          );
        })}
      </group>

      {/* Glow effect */}
      <mesh position={[0, 0.5 + bobOffset, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color="#FFD700"
          emissive="#FFD700"
          emissiveIntensity={1.5}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Label */}
      <Html position={[0, 1.5 + bobOffset, 0]} center>
        <div
          style={{
            backgroundColor: 'rgba(255, 215, 0, 0.8)',
            color: '#000000',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}
        >
          💎 CHEST ({variety})
        </div>
      </Html>
    </group>
  );
}
