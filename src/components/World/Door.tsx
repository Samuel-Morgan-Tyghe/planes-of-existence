import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';

interface DoorProps {
  position: [number, number, number];
  direction: 'north' | 'south' | 'east' | 'west';
  locked: boolean;
  requiresKey?: boolean; // If true, requires key to open (and must be locked)
  onUnlock?: () => boolean; // Function to attempt unlock (consumes key)
  playerPosition: [number, number, number];
  onEnter: () => void;
  visible?: boolean;
}

const ACTIVATION_DISTANCE = 2.5;

export function Door({ position, direction, locked, requiresKey, onUnlock, playerPosition, onEnter, visible = true }: DoorProps) {
  const [isNear, setIsNear] = useState(false);
  const [pulse, setPulse] = useState(0);
  const unlockAttempt = useRef(0);

  useFrame((_, delta) => {
    setPulse((prev) => (prev + delta * 2) % (Math.PI * 2));

    if (unlockAttempt.current > 0) unlockAttempt.current -= delta;

    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    const wasNear = isNear;
    const nowNear = distance < ACTIVATION_DISTANCE;

    setIsNear(nowNear);

    // If locked and requires key, try to unlock on approach
    if (nowNear && locked && requiresKey && unlockAttempt.current <= 0) {
      if (onUnlock?.()) {
        console.log(`🔑 Used Key to unlock door!`);
        // Unlock successful - parent will update 'locked' prop to false
        // We set cooldown to prevent double consumption (though onUnlock should handle checks)
        unlockAttempt.current = 1.0;
      } else {
        // Failed (No key)
        if (unlockAttempt.current <= 0) { // Only log occasionally
          console.log(`🔒 Door is locked (Needs Key)`);
          unlockAttempt.current = 2.0; // Cooldown for message
        }
      }
    }

    if (!wasNear && nowNear && !locked) {
      console.log(`🚪 Door ${direction} activated! Position: [${position[0].toFixed(1)}, ${position[2].toFixed(1)}], Player: [${playerPosition[0].toFixed(1)}, ${playerPosition[2].toFixed(1)}], Distance: ${distance.toFixed(2)}`);
      onEnter();
    }
  });

  // Door orientation based on direction
  const rotation: [number, number, number] =
    direction === 'north' || direction === 'south' ? [0, 0, 0] : [0, Math.PI / 2, 0];

  const color = locked ? (requiresKey ? '#FFD700' : '#ff0000') : '#00ffff'; // Gold for Key Lock, Red for Combat Lock
  const pulseIntensity = 1 + Math.sin(pulse) * 0.3;

  return (
    <group position={position} visible={visible}>
      {/* 1. Permanent Sensor for Teleportation */}
      <RigidBody
        type="fixed"
        sensor
        userData={{ isSensor: true }}
        onIntersectionEnter={() => {
          if (!locked) {
            console.log(`🚪 Door ${direction} triggered!`);
            onEnter();
          }
        }}
      >
        {/* Slightly larger sensor to ensure detection - covers full 3-tile corridor (6.0 width) */}
        <CuboidCollider args={[3.5, 2, 0.5]} rotation={rotation} />
      </RigidBody>

      {/* 2. Conditional Physical Barrier when Locked */}
      {locked && (
        <RigidBody type="fixed" userData={{ isWall: true }}>
          <CuboidCollider args={[1.5, 2, 0.15]} rotation={rotation} />
        </RigidBody>
      )}

      {/* Visuals */}
      <mesh rotation={rotation}>
        <boxGeometry args={[3, 4, 0.3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isNear ? 2.0 * pulseIntensity : 1.0}
          transparent
          opacity={locked ? 0.7 : 0.2}
        />
      </mesh>

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
              backgroundColor: `rgba(${locked ? (requiresKey ? '200, 150, 0' : '200, 0, 0') : '0, 200, 200'}, 0.7)`,
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
            {locked ? (requiresKey ? '🔒 KEY REQUIRED' : '🔒 LOCKED') : '🚪 DOOR'}
          </div>
        </Html>
      )}
    </group>
  );
}
