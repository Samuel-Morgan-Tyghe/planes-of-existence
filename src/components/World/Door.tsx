import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useState } from 'react';

interface DoorProps {
  position: [number, number, number];
  direction: 'north' | 'south' | 'east' | 'west';
  locked: boolean;
  playerPosition: [number, number, number];
  onEnter: () => void;
  onNear?: () => void; // Callback when player gets near (for revealing room)
  visible?: boolean;
}

const ACTIVATION_DISTANCE = 2.5;
const REVEAL_DISTANCE = 5; // Distance to reveal the adjacent room

export function Door({ position, direction, locked, playerPosition, onEnter, onNear, visible = true }: DoorProps) {
  const [isNear, setIsNear] = useState(false);
  const [pulse, setPulse] = useState(0);

  useFrame((_, delta) => {
    setPulse((prev) => (prev + delta * 2) % (Math.PI * 2));

    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    const wasNear = isNear;
    const nowNear = distance < ACTIVATION_DISTANCE;
    setIsNear(nowNear);

    if (!wasNear && nowNear && !locked) {
      console.log(`🚪 Door ${direction} activated! Position: [${position[0].toFixed(1)}, ${position[2].toFixed(1)}], Player: [${playerPosition[0].toFixed(1)}, ${playerPosition[2].toFixed(1)}], Distance: ${distance.toFixed(2)}`);
      onEnter();
    }
  });

  // Door orientation based on direction
  const rotation: [number, number, number] =
    direction === 'north' || direction === 'south' ? [0, 0, 0] : [0, Math.PI / 2, 0];

  const color = locked ? '#ff0000' : '#00ffff';
  const pulseIntensity = 1 + Math.sin(pulse) * 0.3;

  return (
    <group position={position} visible={visible}>
      {/* Door frame - sensor collider if unlocked (trigger), solid if locked */}
      <RigidBody key={`door-rb-${locked}`} type="fixed" sensor={!locked}>
        <CuboidCollider args={[1.5, 2, 0.15]} rotation={rotation} />
        <mesh rotation={rotation}>
          <boxGeometry args={[3, 4, 0.3]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={isNear ? 2.0 * pulseIntensity : 1.0}
            transparent
            opacity={locked ? 0.7 : 0.2} // Make unlocked doors more transparent
          />
        </mesh>
      </RigidBody>

      {/* Glow effect */}
      {isNear && locked && (
        <mesh position={[0, 0, 0]} rotation={rotation}>
          <boxGeometry args={[4, 5, 0.5]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={3.0}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Label */}
      {locked && (
        <Html position={[0, 3, 0]} center>
          <div
            style={{
              backgroundColor: `rgba(${locked ? '200, 0, 0' : '0, 200, 200'}, 0.7)`,
              color: locked ? '#ffffff' : '#000000',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
              border: `1px solid ${color}`,
              transition: 'all 0.2s',
              display: visible ? 'block' : 'none', // Hide HTML label when invisible
            }}
          >
            {locked ? '🔒 LOCKED' : '🚪 DOOR'}
          </div>
        </Html>
      )}
    </group>
  );
}
