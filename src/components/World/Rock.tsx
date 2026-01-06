/* eslint-disable react/no-unknown-property */
import { useStore } from '@nanostores/react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { $brokenRocks } from '../../stores/rock';

interface RockProps {
  position: [number, number, number];
  height: number;
  id: string;
  type?: 'normal' | 'secret';
}

export function Rock({ position, height, id, type = 'normal' }: RockProps) {
  const brokenRocks = useStore($brokenRocks);

  if (brokenRocks[id]) return null;

  const isSecret = type === 'secret';
  const rockColor = isSecret ? '#6b7b8c' : '#808080'; // Tinted rock is more blue-slate

  return (
    <RigidBody position={position} type="fixed" colliders={false} userData={{ isRock: true, rockId: id, isSecret }}>
      <CuboidCollider args={[0.4, height / 2, 0.4]} position={[0, height / 2, 0]} />
      <group position={[0, height / 2, 0]}>
        <mesh castShadow receiveShadow scale={[0.8, height, 0.8]}>
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color={rockColor} roughness={0.8} />
        </mesh>
        
        {/* Render "Cracks" if it's a secret rock */}
        {isSecret && (
          <group scale={[0.8, height, 0.8]}>
            <mesh position={[0.2, 0.1, 0.3]} rotation={[0.2, 0.5, 0.1]}>
              <boxGeometry args={[0.4, 0.05, 0.05]} />
              <meshBasicMaterial color="#222222" />
            </mesh>
            <mesh position={[-0.2, -0.2, 0.3]} rotation={[-0.4, -0.2, 0.9]}>
              <boxGeometry args={[0.3, 0.04, 0.04]} />
              <meshBasicMaterial color="#222222" />
            </mesh>
            <mesh position={[0, 0.3, 0.2]} rotation={[1.1, 0.4, -0.5]}>
              <boxGeometry args={[0.3, 0.05, 0.05]} />
              <meshBasicMaterial color="#222222" />
            </mesh>
          </group>
        )}
      </group>
    </RigidBody>
  );
}
