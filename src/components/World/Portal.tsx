import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useState } from 'react';

interface PortalProps {
  position: [number, number, number];
  onEnter: () => void;
  playerPosition: [number, number, number];
}

const ACTIVATION_DISTANCE = 2; // Distance to activate portal

export function Portal({ position, onEnter, playerPosition }: PortalProps) {
  const [isNear, setIsNear] = useState(false);
  const [rotation, setRotation] = useState(0);

  useFrame((_, delta) => {
    // Rotate portal
    setRotation((prev) => prev + delta);

    // Check distance to player
    const dx = playerPosition[0] - position[0];
    const dz = playerPosition[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    const wasNear = isNear;
    const nowNear = distance < ACTIVATION_DISTANCE;
    setIsNear(nowNear);

    // Trigger portal when player gets close
    if (!wasNear && nowNear) {
      console.log('🌀 Player entered portal!');
      onEnter();
    }
  });

  return (
    <group position={position}>
      {/* Portal base platform */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={isNear ? 3.0 : 1.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      </RigidBody>

      {/* Rotating outer ring */}
      <mesh position={[0, 1.5, 0]} rotation={[0, rotation, 0]}>
        <torusGeometry args={[1.2, 0.1, 16, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={isNear ? 5.0 : 3.0}
        />
      </mesh>

      {/* Inner rotating ring (opposite direction) */}
      <mesh position={[0, 1.5, 0]} rotation={[0, -rotation * 1.5, 0]}>
        <torusGeometry args={[0.8, 0.08, 16, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={isNear ? 6.0 : 4.0}
        />
      </mesh>

      {/* Central sphere */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={isNear ? 8.0 : 5.0}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Glowing particles effect */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2 + rotation * 2;
        const radius = 1.0;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              1.5 + Math.sin(rotation * 3 + i) * 0.3,
              Math.sin(angle) * radius,
            ]}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={10.0}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}

      {/* Label */}
      <Html position={[0, 3, 0]} center>
        <div
          style={{
            backgroundColor: isNear ? 'rgba(0, 255, 255, 0.9)' : 'rgba(0, 200, 200, 0.7)',
            color: '#000000',
            padding: '8px 16px',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: isNear ? '16px' : '14px',
            fontWeight: 'bold',
            border: isNear ? '3px solid #00ffff' : '2px solid #00aaaa',
            boxShadow: isNear ? '0 0 20px rgba(0, 255, 255, 0.8)' : '0 0 10px rgba(0, 200, 200, 0.5)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            transition: 'all 0.3s',
          }}
        >
          {isNear ? '🌀 ENTERING... 🌀' : 'EXIT'}
        </div>
      </Html>
    </group>
  );
}
