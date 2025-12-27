import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { addFragments } from '../../stores/meta';
import { takeDamage } from '../../stores/player';

interface BossProps {
  position: [number, number, number];
  playerPosition: [number, number, number];
  onDefeat: () => void;
}

const BOSS_HEALTH = 200;
const BOSS_DAMAGE = 20;
const BOSS_SIZE = 2;
const BOSS_ATTACK_RANGE = 3;
const BOSS_ATTACK_COOLDOWN = 2000;

export function Boss({ position, playerPosition, onDefeat }: BossProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [health, setHealth] = useState(BOSS_HEALTH);
  const [phase, setPhase] = useState(1);
  const [currentPosition, setCurrentPosition] = useState<[number, number, number]>(position);
  const lastAttackTime = useRef(0);

  // Update position from mesh (safer than rigid body during physics step)
  useFrame(() => {
    if (meshRef.current && health > 0) {
      const pos = meshRef.current.position;
      setCurrentPosition([pos.x, pos.y, pos.z]);
    }
  });

  useFrame(() => {
    if (!rigidBodyRef.current || health <= 0) return;

    const rb = rigidBodyRef.current;
    const playerPos = new Vector3(...playerPosition);
    const bossVec = new Vector3(...currentPosition);
    
    const distance = bossVec.distanceTo(playerPos);

    // Boss moves slower but hits harder
    if (distance < 15 && distance > BOSS_ATTACK_RANGE) {
      const direction = new Vector3()
        .subVectors(playerPos, bossVec)
        .normalize()
        .multiplyScalar(1.5);
      
      rb.setLinvel({ x: direction.x, y: 0, z: direction.z }, true);
    } else if (distance <= BOSS_ATTACK_RANGE) {
      const now = Date.now();
      if (now - lastAttackTime.current > BOSS_ATTACK_COOLDOWN) {
        takeDamage(BOSS_DAMAGE);
        lastAttackTime.current = now;
      }
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    // Phase transitions
    if (health <= BOSS_HEALTH * 0.5 && phase === 1) {
      setPhase(2);
      // Boss gets faster in phase 2
    }
  });

  useEffect(() => {
    if (health <= 0) {
      addFragments(10); // Boss reward
      onDefeat();
    }
  }, [health, onDefeat]);

  const handleDamage = (damage: number) => {
    setHealth((prev) => Math.max(0, prev - damage));
  };

  // Expose damage handler (would be called by projectile collision)
  useEffect(() => {
    if (rigidBodyRef.current) {
      (rigidBodyRef.current as any).handleDamage = handleDamage;
    }
  }, []);

  if (health <= 0) return null;

  const color = phase === 1 ? '#ff0000' : '#ff00ff';
  const scale = phase === 1 ? 1 : 1.2;

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders="cuboid"
      mass={2}
      position={position}
    >
      <mesh ref={meshRef} castShadow scale={scale}>
        <boxGeometry args={[BOSS_SIZE, BOSS_SIZE, BOSS_SIZE]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
    </RigidBody>
  );
}

