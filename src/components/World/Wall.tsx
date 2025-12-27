import { RigidBody } from '@react-three/rapier';

interface WallProps {
  position: [number, number, number];
}

export function Wall({ position }: WallProps) {
  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      collisionGroups={0x00010001}
      userData={{ isWall: true }}
    >
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[1.8, 3, 1.8]} />
        <meshStandardMaterial color="#666666" wireframe />
      </mesh>
    </RigidBody>
  );
}

