import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { consumeItem } from '../../stores/game';
import { $position } from '../../stores/player';

interface ChestProps {
  position: [number, number, number];
  variety: number; // How many items in the chest
  type?: 'gray' | 'gold';
  onCollect: () => void;
}

const COLLECT_DISTANCE = 2;

export function Chest({ position, variety, type = 'gray', onCollect }: ChestProps) {
  const [bob, setBob] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [collected, setCollected] = useState(false);
  const [showLockedMessage, setShowLockedMessage] = useState(false);

  // Cooldown for key check so we don't spam locked message
  const lockedCooldownRef = useRef(0);

  const colors = type === 'gold' ? {
    body: '#fbbf24', // Gold
    lid: '#d97706',
    lock: '#ef4444', // Red lock (needs key)
    emissive: '#f59e0b'
  } : {
    body: '#6b7280', // Gray
    lid: '#4b5563',
    lock: '#9ca3af', // Silver lock
    emissive: '#374151'
  };

  useFrame((_, delta) => {
    if (collected) return;

    // Bob up and down
    setBob((prev) => (prev + delta * 2) % (Math.PI * 2));

    // Slow rotation
    setRotation((prev) => prev + delta * 0.5);

    if (lockedCooldownRef.current > 0) {
      lockedCooldownRef.current -= delta;
      if (lockedCooldownRef.current <= 0) setShowLockedMessage(false);
    }

    // Check distance to player - read directly from store for real-time accuracy
    const playerPos = $position.get();
    const dx = playerPos[0] - position[0];
    const dz = playerPos[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < COLLECT_DISTANCE && lockedCooldownRef.current <= 0) {
      if (type === 'gold') {
        if (consumeItem('key', 1)) {
          setCollected(true);
          console.log(`💎 Gold Chest opened! Got ${variety} items!`);
          onCollect();
        } else {
          // Locked
          console.log('🔒 Chest Locked: Needs Key');
          setShowLockedMessage(true);
          lockedCooldownRef.current = 2.0; // 2 seconds cooldown
        }
      } else {
        setCollected(true);
        console.log(`💎 Chest opened! Got ${variety} items!`);
        onCollect();
      }
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
            color={colors.body}
            emissive={colors.emissive}
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Chest lid */}
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[0.6, 0.1, 0.4]} />
          <meshStandardMaterial
            color={colors.lid}
            emissive={colors.emissive}
            emissiveIntensity={0.2}
          />
        </mesh>

        {/* Lock */}
        <mesh position={[0, 0, 0.21]}>
          <boxGeometry args={[0.15, 0.15, 0.05]} />
          <meshStandardMaterial
            color={colors.lock}
            emissive={colors.lock}
            emissiveIntensity={type === 'gold' ? 0.5 : 0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Sparkles depending on type */}
        {type === 'gold' && [...Array(variety)].map((_, i) => {
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

      {showLockedMessage && (
        <Html position={[0, 1.8 + bobOffset, 0]} center>
          <div style={{
            color: '#ff4444',
            fontWeight: 'bold',
            textShadow: '0 0 4px black',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}>🔒 Locked (Need Key)</div>
        </Html>
      )}

      {/* Label (Optional? Maybe remove generic label or update it) */}
      {!showLockedMessage && (
        <Html position={[0, 1.5 + bobOffset, 0]} center>
          <div
            style={{
              backgroundColor: type === 'gold' ? 'rgba(255, 215, 0, 0.8)' : 'rgba(100, 100, 100, 0.8)',
              color: '#000000',
              padding: '4px 8px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              fontWeight: 'bold',
              whiteSpace: 'nowrap',
            }}
          >
            {type === 'gold' ? '🏆 GOLD CHEST' : '📦 CHEST'} ({variety})
          </div>
        </Html>
      )}
    </group>
  );
}
