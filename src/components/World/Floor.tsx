import { RigidBody } from '@react-three/rapier';
import { useRef } from 'react';

export function Floor() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <boxGeometry args={[100, 100, 1]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </RigidBody>
  );
}

