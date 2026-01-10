/* eslint-disable react/no-unknown-property */
import { useStore } from '@nanostores/react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { rollDestructibleLoot } from '../../logic/loot';
import { $currentRoomId } from '../../stores/game';
import { $brokenCrates, breakCrate } from '../../stores/loot';
import { emitDrop } from '../../systems/events';

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
      onCollisionEnter={(e) => {
        const userData = e.other.rigidBody?.userData as any;
        // Bosses crush crates
        if (userData?.isBoss) {
          breakCrate(id);
          const drop = rollDestructibleLoot('crate');
          if (drop) {
            emitDrop(position, $currentRoomId.get(), drop.type, (drop as any).itemId || (drop as any).value);
          }
        }
      }}
    >
      <CuboidCollider args={[0.5, 0.5, 0.5]} position={[0, 0.5, 0]} />
      <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
    </RigidBody>
  );
}
