import { RigidBody } from '@react-three/rapier';
import { COLLISION_GROUPS } from '../../utils/constants';

interface WallProps {
  position: [number, number, number];
}

export function Wall({ position }: WallProps) {
  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      collisionGroups={COLLISION_GROUPS.WALL}
    >
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[1.8, 3, 1.8]} />
        <meshStandardMaterial color="#666666" wireframe />
      </mesh>
    </RigidBody>
  );
}

