import { useStore } from '@nanostores/react';
import { PerspectiveCamera } from '@react-three/drei';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import { $plane } from '../../stores/game';
import { PlayerController } from './PlayerController';

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const plane = useStore($plane);

  // Update physics constraints when plane changes
  useEffect(() => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;

    // Reset velocities to prevent momentum carryover
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);

    switch (plane) {
      case '2D':
        // Lock Z-axis (depth) and all rotations
        rb.setEnabledTranslations(true, true, false, true);
        rb.lockRotations(true, true);
        break;
      case 'ISO':
        // Lock Y-axis (vertical) and all rotations
        rb.setEnabledTranslations(true, false, true, true);
        rb.lockRotations(true, true);
        break;
      case 'FPS':
        // Allow all movement
        rb.setEnabledTranslations(true, true, true, true);
        // Rotation handled by mouse look
        break;
    }
  }, [plane]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      mass={1}
      position={[0, 2, 0]}
    >
      <mesh castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="orange" />
      </mesh>
      {/* FPS camera parented to player */}
      {plane === 'FPS' && (
        <PerspectiveCamera
          makeDefault
          fov={75}
          position={[0, 0.9, 0]} // Eye level (half of 1.8m height)
          near={0.1}
          far={1000}
        />
      )}
      <PlayerController rigidBodyRef={rigidBodyRef} />
    </RigidBody>
  );
}

