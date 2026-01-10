import { CuboidCollider, RigidBody } from '@react-three/rapier';

interface WallProps {
  position: [number, number, number];
  visible?: boolean;
}

export function Wall({ position, visible = true }: WallProps) {
  // console.log('🧱 Wall mounted at', position); // Uncomment for verbose wall logging
  return (
    <RigidBody
      type="fixed"
      position={position}
      userData={{ isWall: true }}
    >
      <CuboidCollider args={[1, 4, 1]} />
      <mesh castShadow receiveShadow visible={visible}>
        <boxGeometry args={[2, 8, 2]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
    </RigidBody>
  );
}
