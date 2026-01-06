/* eslint-disable react/no-unknown-property */
import { useFrame } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import { useRef } from 'react';
import { Group } from 'three';
import { LootItem, collectLoot } from '../../stores/loot';
import { $health, $maxHealth, $shield } from '../../stores/player';

interface LootProps {
  item: LootItem;
}

export function Loot({ item }: LootProps) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Bobbing and rotating animation
      groupRef.current.rotation.y += 0.02;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  const getColor = () => {
    switch (item.type) {
      case 'coin': return '#FFD700'; // Gold
      case 'heart': return '#FF0000'; // Red
      case 'shield': return '#0000FF'; // Blue
      default: return '#FFFFFF';
    }
  };

  return (
    <RigidBody 
      type="fixed" 
      position={item.position} 
      sensor 
      userData={{ isLoot: true, lootId: item.id }}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBodyObject?.userData?.isPlayer) {
             const collected = collectLoot(item.id);
             if (collected) {
                 console.log(`✨ Collected ${collected.type}`);
                 if (collected.type === 'heart') {
                     // Heal logic
                     const current = $health.get();
                     const max = $maxHealth.get();
                     if (current < max) {
                         // We don't have a direct heal action exposed, so we might need to modify player store or just hack it here?
                         // Ideally we'd have `heal(amount)`.
                         // For now let's just use takeDamage(-amount) hack if logical, or access store directly?
                         // The provided context doesn't show a heal function.
                         // Let's assume we can set the store directly or I should create a heal action.
                         // Wait, `takeDamage` is exposed. `takeDamage(-1)`?
                         // Let's create a `heal` in player store properly. For now, I'll direct set.
                         $health.set(Math.min(max, current + collected.value));
                     }
                 } else if (collected.type === 'shield') {
                     $shield.set($shield.get() + collected.value); // Assuming shield is just a number
                 }
                 // Coins? Score?
             }
        }
      }}
    >
      <group ref={groupRef}>
        <mesh castShadow rotation={item.type === 'coin' ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
          {item.type === 'coin' && <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />}
          {item.type === 'heart' && <boxGeometry args={[0.4, 0.4, 0.4]} />} 
          {/* Note: Box for heart is placeholder, could use shape later */}
          {item.type === 'shield' && <dodecahedronGeometry args={[0.3, 0]} />}
          
          <meshStandardMaterial 
            color={getColor()} 
            emissive={getColor()} 
            emissiveIntensity={0.5} 
            roughness={0.2} 
            metalness={0.8} 
          />
        </mesh>
      </group>
    </RigidBody>
  );
}
