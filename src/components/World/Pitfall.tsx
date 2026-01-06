import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import { takeDamage } from '../../stores/player';

interface PitfallProps {
  position: [number, number, number];
}

const FALL_COOLDOWN = 2000; // 2 seconds between fall events

export function Pitfall({ position }: PitfallProps) {
  const lastFallTimeRef = useRef(0);
  const [isFalling, setIsFalling] = useState(false);
  const meshRef = useRef<THREE.Group>(null);

  const handleCollision = (target: any) => {
    const now = Date.now();
    if (now - lastFallTimeRef.current < FALL_COOLDOWN) return;

    // Robust check for userData
    const userData = target.rigidBodyObject?.userData || target.userData;

    if (userData?.isPlayer) {
      console.log('🕳️ Player fell into a pit!');
      
      // Prevent double trigger
      if (isFalling) return;
      setIsFalling(true);
      
      // Damage immediately
      takeDamage(20);
      
      lastFallTimeRef.current = now;
      
      // Reset visual state after animation
      setTimeout(() => {
        setIsFalling(false);
      }, 1000);
    }
  };
  
  // Simple "falling away" animation for the pit itself to indicate it was "used" or just static? 
  // Actually, we probably want the *Player* to look like they are falling. 
  // But we can't easily control Player scale from here without a store.
  // For now, let's just make the PIT interaction functional. 
  // The Player takes damage. That's the most important part.

  return (
    <group ref={meshRef} position={[position[0], 0, position[2]]}>
      {/* Physics Sensor - Slightly smaller than a full tile to avoid clipping edges */}
      <RigidBody type="fixed" sensor onIntersectionEnter={(e) => handleCollision(e.other)}>
        <CuboidCollider args={[0.4, 0.5, 0.4]} />
      </RigidBody>

      {/* Pit Visuals - Black hole */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[0.95, 0.95]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Fake Depth Box */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[0.9, 1, 0.9]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
    </group>
  );
}
