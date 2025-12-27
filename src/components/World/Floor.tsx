import { RigidBody } from '@react-three/rapier';

interface FloorProps {
  position?: [number, number, number];
  size?: number;
}

export function Floor({ position = [0, -0.5, 0], size = 1 }: FloorProps) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
        <boxGeometry args={[size, size, 0.1]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
    </RigidBody>
  );
}

