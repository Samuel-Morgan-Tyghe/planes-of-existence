import { RigidBody } from '@react-three/rapier';

interface WallProps {
  position: [number, number, number];
}

export function Wall({ position }: WallProps) {
  // console.log('🧱 Wall mounted at', position); // Uncomment for verbose wall logging
  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      userData={{ isWall: true }}
    >
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[1.8, 8, 1.8]} />
        <meshStandardMaterial color="#666666" wireframe />
      </mesh>
    </RigidBody>
  );
}

