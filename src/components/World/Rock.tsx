/* eslint-disable react/no-unknown-property */
import { useStore } from '@nanostores/react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { $brokenRocks } from '../../stores/rock';

interface RockProps {
  position: [number, number, number];
  height: number;
  id: string;
}

export function Rock({ position, height, id }: RockProps) {
  const brokenRocks = useStore($brokenRocks);

  if (brokenRocks[id]) return null;

  return (
    <RigidBody position={position} type="fixed" colliders={false} userData={{ isRock: true, rockId: id }}>
      <CuboidCollider args={[0.4, height / 2, 0.4]} position={[0, height / 2, 0]} />
      <mesh castShadow receiveShadow position={[0, height / 2, 0]} scale={[0.8, height, 0.8]}>
        <dodecahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color="#808080" roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}
