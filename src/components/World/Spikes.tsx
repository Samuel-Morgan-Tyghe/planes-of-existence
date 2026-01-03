import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import { takeDamage } from '../../stores/player';
import { emitDamage } from '../../systems/events';

interface SpikesProps {
  position: [number, number, number];
}

const DAMAGE_COOLDOWN = 1000; // 1 second between damage ticks

export function Spikes({ position }: SpikesProps) {
  const lastDamageTimeRef = useRef(0);
  const [active, setActive] = useState(false); // Visual flare when damage occurs

  const handleCollision = (target: any) => {
    const now = Date.now();
    if (now - lastDamageTimeRef.current < DAMAGE_COOLDOWN) return;

    if (target.rigidBodyObject?.userData?.isPlayer) {
      console.log('⚠️ Player stepped on spikes!');
      takeDamage(10);
      lastDamageTimeRef.current = now;
      triggerVisual();
    } else if (target.rigidBodyObject?.userData?.enemyId !== undefined) {
      const enemyId = target.rigidBodyObject.userData.enemyId;
      console.log('⚠️ Enemy stepped on spikes:', enemyId);
      emitDamage(enemyId, 10); // 10 damage
      lastDamageTimeRef.current = now;
      triggerVisual();
    }
  };

  const triggerVisual = () => {
    setActive(true);
    setTimeout(() => setActive(false), 200);
  };

  return (
    <group position={[position[0], position[1], position[2]]}>
      {/* Physics Sensor */}
      <RigidBody type="fixed" sensor onIntersectionEnter={(e) => handleCollision(e.other)}>
        <CuboidCollider args={[0.4, 0.2, 0.4]} />
      </RigidBody>

      {/* Spikes Visuals */}
      <group>
        {/* Central Spike */}
        <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.2, 0.6, 4]} />
          <meshStandardMaterial color={active ? '#ffffff' : '#ff0000'} />
        </mesh>
        {/* Smaller surrounding spikes */}
        <mesh position={[0.25, 0.15, 0.25]} rotation={[0.2, 0, 0.2]}>
          <coneGeometry args={[0.1, 0.4, 4]} />
          <meshStandardMaterial color="#cc0000" />
        </mesh>
        <mesh position={[-0.25, 0.15, -0.25]} rotation={[-0.2, 0, -0.2]}>
          <coneGeometry args={[0.1, 0.4, 4]} />
          <meshStandardMaterial color="#cc0000" />
        </mesh>
        <mesh position={[0.25, 0.1, -0.25]} rotation={[-0.1, 0, 0.1]}>
          <coneGeometry args={[0.08, 0.3, 4]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[-0.25, 0.1, 0.25]} rotation={[0.1, 0, -0.1]}>
          <coneGeometry args={[0.08, 0.3, 4]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
      </group>
      
      {/* Base */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.05, 0.9]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
}
