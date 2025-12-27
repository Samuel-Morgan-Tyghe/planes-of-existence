import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '@nanostores/react';
import { Vector3 } from 'three';
import { addItem } from '../../stores/game';
import { addPixels } from '../../stores/meta';
import { $position } from '../../stores/player';

interface LootProps {
  position: [number, number, number];
  type: 'item' | 'pixel' | 'upgrade';
  itemId?: string;
  value?: number;
  onCollect: () => void;
}

const COLLECTION_RANGE = 2;

export function Loot({ position, type, itemId, value, onCollect }: LootProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const collectedRef = useRef(false);
  const playerPosition = useStore($position);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(position);

  // Update position from mesh (safer than rigid body during physics step)
  useFrame(() => {
    if (meshRef.current && !collectedRef.current) {
      const pos = meshRef.current.position;
      setCurrentPosition([pos.x, pos.y, pos.z]);
    }
  });

  useFrame(() => {
    if (collectedRef.current) return;

    // Check for player proximity using mesh position
    const lootVec = new Vector3(...currentPosition);
    const playerPos = new Vector3(...playerPosition);
    const distance = lootVec.distanceTo(playerPos);

    if (distance < COLLECTION_RANGE) {
      collectedRef.current = true;
      
      if (type === 'item' && itemId) {
        addItem(itemId);
      } else if (type === 'pixel' && value) {
        addPixels(value);
      }
      
      onCollect();
    }
  });

  const getColor = () => {
    switch (type) {
      case 'item':
        return '#00ff00';
      case 'pixel':
        return '#ffff00';
      case 'upgrade':
        return '#00ffff';
      default:
        return '#ffffff';
    }
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="ball"
      type="kinematicPosition"
      position={position}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial 
          color={getColor()}
          emissive={getColor()}
          emissiveIntensity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}

