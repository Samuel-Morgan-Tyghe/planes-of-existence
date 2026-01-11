import { Select } from '@react-three/postprocessing';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useMemo, useRef, useState } from 'react';
import { takeDamage } from '../../stores/player';
import { emitDamage } from '../../systems/events';

interface SpikesProps {
  position: [number, number, number];
}

const DAMAGE_COOLDOWN = 1000; // 1 second between damage ticks

export function Spikes({ position }: SpikesProps) {
  const lastDamageTimeRef = useRef(0);
  const [active, setActive] = useState(false); // Visual flare when damage occurs

  // Stable random values for visual variety
  const visualConfig = useMemo(() => {
    // Pseudo-random based on position
    const seed = position[0] * 123 + position[2] * 456;
    const rand = (n: number) => {
      const x = Math.sin(seed + n) * 10000;
      return x - Math.floor(x);
    };

    return {
      rotation: rand(1) * Math.PI * 2,
      scale: 0.8 + rand(2) * 0.6, // 0.8 to 1.4 scale
      subSpikes: [
        { rot: [rand(3) * 0.4, 0, rand(4) * 0.4] as [number, number, number], pos: [0.25, 0.15, 0.25] },
        { rot: [-rand(5) * 0.4, 0, -rand(6) * 0.4] as [number, number, number], pos: [-0.25, 0.15, -0.25] },
        { rot: [-rand(7) * 0.4, 0, rand(8) * 0.4] as [number, number, number], pos: [0.25, 0.1, -0.25] },
        { rot: [rand(9) * 0.4, 0, -rand(10) * 0.4] as [number, number, number], pos: [-0.25, 0.1, 0.25] },
      ]
    };
  }, [position]);

  const handleCollision = (target: any) => {
    const now = Date.now();

    if (now - lastDamageTimeRef.current < DAMAGE_COOLDOWN) return;

    // Robust check for userData, handling different Rapier versions/structures
    const userData = target.rigidBodyObject?.userData || target.userData;

    if (userData?.isPlayer) {
      console.log('⚠️ Player stepped on spikes!');
      takeDamage(10); // 10 damage
      lastDamageTimeRef.current = now;
      triggerVisual();
    } else if (userData?.enemyId !== undefined) {
      const enemyId = userData.enemyId;
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
        <CuboidCollider args={[0.95, 0.2, 0.95]} />
      </RigidBody>

      {/* Spikes Visuals - Randomized */}
      <Select enabled>
        <group rotation={[0, visualConfig.rotation, 0]} scale={[visualConfig.scale, 1, visualConfig.scale]}>
          {/* Central Spike */}
          <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.2, 0.6, 4]} />
            <meshStandardMaterial color={active ? '#ffffff' : '#ff0000'} />
          </mesh>
          {/* Smaller surrounding spikes */}
          {visualConfig.subSpikes.map((cfg, i) => (
            <mesh key={i} position={cfg.pos as [number, number, number]} rotation={cfg.rot}>
              <coneGeometry args={[0.1, 0.4, 4]} />
              <meshStandardMaterial color={i < 2 ? "#cc0000" : "#666666"} />
            </mesh>
          ))}
        </group>
      </Select>

      {/* Base */}
      <mesh position={[0, 0.01, 0]} receiveShadow>
        <boxGeometry args={[0.9, 0.05, 0.9]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
    </group>
  );
}
