/* eslint-disable react/no-unknown-property */
import { useStore } from '@nanostores/react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { $brokenCrates } from '../../stores/loot';

interface CrateProps {
  id: string; // Unique ID derived from grid position
  position: [number, number, number];
}

export function Crate({ id, position }: CrateProps) {
  const brokenCrates = useStore($brokenCrates);
  const isBroken = brokenCrates[id];

  if (isBroken) return null;

  return (
    <RigidBody 
      type="fixed" 
      position={position} 
      // CuboidCollider explicit to be sure
      colliders={false}
      userData={{ isBreakable: true, crateId: id, isWall: true }} 
    >
      <CuboidCollider args={[0.5, 0.5, 0.5]} position={[0, 0.5, 0]} />
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}
