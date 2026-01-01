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
      <CuboidCollider args={[0.5, 4, 0.5]} />
      <mesh castShadow receiveShadow visible={visible}>
        <boxGeometry args={[1, 8, 1]} />
        <meshStandardMaterial color="#444444" />
      </mesh>
    </RigidBody>
  );
}
