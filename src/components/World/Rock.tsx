/* eslint-disable react/no-unknown-property */
import { useStore } from '@nanostores/react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import { $currentRoomId } from '../../stores/game';
import { $brokenRocks, breakRock } from '../../stores/rock';
import { emitDrop } from '../../systems/events';
import { rollDestructibleLoot } from '../../types/drops';

interface RockProps {
  position: [number, number, number];
  height: number;
  id: string;
  type?: 'normal' | 'secret';
}

export function Rock({ position, height, id, type = 'normal' }: RockProps) {
  const brokenRocks = useStore($brokenRocks);

  const { parts, style } = useMemo(() => {
    const isCube = Math.random() > 0.5;
    const style = isCube ? 'cube' : 'jagged';
    const partsArray: Array<{ position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }> = [];

    // Taller Scale Multiplier
    const hScale = height * 1.5;

    if (isCube) {
      // Cube Style: Taller, narrower, slightly tilted
      partsArray.push({
        position: [0, 0, 0],
        rotation: [Math.random() * 0.2 - 0.1, Math.random() * Math.PI, Math.random() * 0.2 - 0.1], // Slight tilt
        scale: [1.2 + Math.random() * 0.6, hScale, 1.2 + Math.random() * 0.6] // Wider
      });
      // Base cubes
      const numBase = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < numBase; i++) {
        const angle = (i / numBase) * Math.PI * 2 + (Math.random() * 0.5);
        const radius = 0.6 + Math.random() * 0.4;
        partsArray.push({
          position: [Math.cos(angle) * radius, -hScale * 0.45, Math.sin(angle) * radius],
          rotation: [Math.random() * 0.3, Math.random() * Math.PI, Math.random() * 0.3],
          scale: [0.6 + Math.random() * 0.4, 0.8 + Math.random() * 0.6, 0.6 + Math.random() * 0.4]
        });
      }
    } else {
      // Jagged Style: Taller
      partsArray.push({
        position: [0, 0, 0],
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
        scale: [1.2 + Math.random() * 0.6, hScale, 1.2 + Math.random() * 0.6]
      });
      // Base chunks
      const numBase = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numBase; i++) {
        const angle = (i / numBase) * Math.PI * 2 + (Math.random() * 0.5);
        const radius = 0.6 + Math.random() * 0.6;
        partsArray.push({
          position: [Math.cos(angle) * radius, -hScale * 0.4, Math.sin(angle) * radius],
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
          scale: [0.6 + Math.random() * 0.6, 1.0 + Math.random() * 0.8, 0.6 + Math.random() * 0.6]
        });
      }
    }

    return { parts: partsArray, style };
  }, [height]);

  if (brokenRocks[id]) return null;

  const isSecret = type === 'secret';
  const rockColor = isSecret ? '#6b7b8c' : '#707070';

  return (
    <RigidBody
      position={position}
      type="fixed"
      colliders={false}
      userData={{ isRock: true, rockId: id, isSecret }}
      onCollisionEnter={(e) => {
        const userData = e.other.rigidBody?.userData as any;
        if (userData?.isEnemy) {
          breakRock(id);

          // Chance to drop loot (5%)
          const drop = rollDestructibleLoot('rock');
          if (drop) {
            emitDrop(position, $currentRoomId.get(), drop.type, drop.itemId);
          }
        }
      }}
    >
      <CuboidCollider args={[0.9, height * 0.75, 0.9]} position={[0, height * 0.75, 0]} />
      {/* Visual Mesh Cluster */}
      <group position={[0, height * 0.75, 0]}>
        {parts.map((part, i) => (
          <mesh
            key={i}
            position={part.position}
            rotation={part.rotation}
            scale={part.scale}
            castShadow
            receiveShadow
          >
            {style === 'cube' ? <boxGeometry args={[1, 1, 1]} /> : <icosahedronGeometry args={[0.5, 0]} />}
            <meshStandardMaterial
              color={rockColor}
              roughness={0.9}
              flatShading
            />
          </mesh>
        ))}

        {/* Secret Overlay */}
        {isSecret && (
          <mesh scale={[0.5, height * 1.2, 0.5]}>
            {style === 'cube' ? <boxGeometry args={[1, 1, 1]} /> : <dodecahedronGeometry args={[0.5, 0]} />}
            <meshBasicMaterial color="#44aadd" wireframe />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
}
