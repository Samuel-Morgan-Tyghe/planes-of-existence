import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { $position } from '../../stores/player';
import { ITEM_DEFINITIONS } from '../../types/items';

interface ItemProps {
  position: [number, number, number];
  itemId: string;
  onCollect: () => void;
}

const COLLECT_DISTANCE = 1.5;
const MAGNET_DISTANCE = 6;
const MAGNET_SPEED = 5;

export function Item({ position, itemId, onCollect }: ItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [collected, setCollected] = useState(false);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>(position);

  const itemDef = ITEM_DEFINITIONS[itemId];
  const visualType = itemDef?.visualType || 'range';

  const getVisuals = () => {
    switch (visualType) {
      case 'range': return { color: '#0088ff', geometry: <torusGeometry args={[0.4, 0.1, 16, 32]} /> };
      case 'rate': return { color: '#ffff00', geometry: <octahedronGeometry args={[0.5]} /> };
      case 'size': return { color: '#00ff00', geometry: <boxGeometry args={[0.6, 0.6, 0.6]} /> };
      case 'damage': return { color: '#ff0000', geometry: <coneGeometry args={[0.4, 0.8, 16]} /> };
      case 'speed': return { color: '#00ffff', geometry: <tetrahedronGeometry args={[0.5]} /> };
      default: return { color: '#ffffff', geometry: <sphereGeometry args={[0.4, 16, 16]} /> };
    }
  };

  const { color, geometry } = getVisuals();

  useFrame((state, delta) => {
    if (collected) return;

    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.rotation.x += delta * 1.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.3 + 1.0;
    }

    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
    }

    // Magnetism and manual distance fallback
    const playerPos = $position.get();
    const dx = playerPos[0] - currentPos[0];
    const dz = playerPos[2] - currentPos[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < MAGNET_DISTANCE && distance > COLLECT_DISTANCE) {
      const dirX = dx / distance;
      const dirZ = dz / distance;
      const strength = 1 - (distance / MAGNET_DISTANCE);
      const move = MAGNET_SPEED * strength * delta;
      
      setCurrentPos([
        currentPos[0] + dirX * move,
        currentPos[1],
        currentPos[2] + dirZ * move
      ]);
    }

    if (distance < COLLECT_DISTANCE) {
      setCollected(true);
      console.log(`✨ Item ${itemId} collected via distance!`);
      onCollect();
    }
  });

  if (collected) return null;

  return (
    <group position={currentPos}>
      <RigidBody 
        type="fixed" 
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.userData?.isPlayer && !collected) {
            setCollected(true);
            console.log(`✨ Item ${itemId} collected via collision!`);
            onCollect();
          }
        }}
      >
        <CuboidCollider args={[1.0, 1.0, 1.0]} />
        <mesh ref={meshRef} castShadow>
          {geometry}
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Floating Glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.15}
          />
        </mesh>

        {/* Point Light */}
        <pointLight color={color} intensity={2} distance={5} />
      </RigidBody>
    </group>
  );
}
