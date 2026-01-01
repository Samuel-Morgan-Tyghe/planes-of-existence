import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { $cameraShake, $currentRoomId, $enemyPositions, $floorData, breakWall, removeThrownBomb, updateThrownBomb } from '../../stores/game';
import { $position, takeDamage } from '../../stores/player';
import { emitDamage, emitKnockback } from '../../systems/events';
import { getRoomWorldSize } from '../../utils/floorGen';

interface ThrownBombProps {
  id: number;
  position: [number, number, number];
  direction: [number, number, number];
  initialVelocity: [number, number, number];
  exploded: boolean;
  explosionPos?: [number, number, number];
  fuse: number;
}

export function ThrownBomb({ id, position, initialVelocity, exploded, explosionPos, fuse: initialFuse }: ThrownBombProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [explosionScale, setExplosionScale] = useState(0.1);
  const fuseRef = useRef(initialFuse || 3.0);
  const explosionInitiated = useRef(false);
  
  const roomId = useStore($currentRoomId);
  const floorData = useStore($floorData);

  useFrame((state, delta) => {
    if (exploded) {
      setExplosionScale(prev => Math.min(4, prev + delta * 20));
      return;
    }

    fuseRef.current -= delta;

    if (fuseRef.current <= 0) {
      if (!explosionInitiated.current) {
        const pos = rigidBodyRef.current?.translation();
        const currentExplosionPos: [number, number, number] = pos ? [pos.x, pos.y, pos.z] : position;
        explode(currentExplosionPos);
      }
    } else {
      // Dynamic flashing logic
      const nextFuse = fuseRef.current;
      const freq = nextFuse > 2 ? 2 : nextFuse > 1 ? 5 : nextFuse > 0.5 ? 10 : 20;
      const flash = Math.floor(state.clock.elapsedTime * freq) % 2 === 0;
      
      if (meshRef.current) {
        const mat = meshRef.current.material as THREE.MeshStandardMaterial;
        if (flash) {
          mat.color.set("#ff0000");
          mat.emissive.set("#ff0000");
          mat.emissiveIntensity = 5;
        } else {
          mat.color.set("#222222");
          mat.emissive.set("#000000");
          mat.emissiveIntensity = 0;
        }
      }
    }
  });

  const explode = (bombPos: [number, number, number]) => {
    if (explosionInitiated.current) return;
    explosionInitiated.current = true;
    
    // Update global state
    updateThrownBomb(id, { exploded: true, explosionPos: bombPos });

    console.log('💥 BOOM at', bombPos);

    const blastRadius = 4;

    // 1. Damage enemies using current positions
    Object.entries($enemyPositions.get()).forEach(([enemyId, pos]) => {
      const enemyPos = pos as [number, number, number];
      const dx = enemyPos[0] - bombPos[0];
      const dz = enemyPos[2] - bombPos[2];
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < blastRadius) {
        const damage = 15 * (1 - distance / blastRadius); // Increased base damage slightly
        emitDamage(parseInt(enemyId), damage);
      }
    });

    // 2. Damage player
    const playerPos = $position.get();
    const pdx = playerPos[0] - bombPos[0];
    const pdz = playerPos[2] - bombPos[2];
    const pDistance = Math.sqrt(pdx * pdx + pdz * pdz);

    if (pDistance < blastRadius) {
      const pDamage = 20 * (1 - pDistance / blastRadius);
      console.log('💥 Bomb hit player! Damage:', pDamage);
      takeDamage(pDamage);

      // Apply camera shake
      $cameraShake.set(0.5 * (1 - pDistance / blastRadius));

      // Apply knockback
      const kdx = playerPos[0] - bombPos[0];
      const kdz = playerPos[2] - bombPos[2];
      const kDir = new THREE.Vector3(kdx, 0, kdz).normalize();
      emitKnockback([kDir.x, kDir.y, kDir.z], 15 * (1 - pDistance / blastRadius));
    }

    // 3. Break walls
    const wallRadius = 3;
    const room = floorData?.rooms.find(r => r.id === roomId);
    if (room) {
      const roomWorldSize = getRoomWorldSize();
      const worldOffsetX = room.gridX * roomWorldSize;
      const worldOffsetZ = room.gridY * roomWorldSize;
      
      const tileSize = 2;
      const halfSize = roomWorldSize / 2;

      for (let gy = 0; gy < 20; gy++) {
        for (let gx = 0; gx < 20; gx++) {
          const tx = worldOffsetX - halfSize + tileSize/2 + gx * tileSize;
          const tz = worldOffsetZ - halfSize + tileSize/2 + gy * tileSize;
          
          const dx = tx - bombPos[0];
          const dz = tz - bombPos[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          
          if (dist < wallRadius) {
            breakWall(roomId, gx, gy);
          }
        }
      }
    }

    // Remove bomb after delay
    setTimeout(() => {
      removeThrownBomb(id);
    }, 1000);
  };

  if (exploded && explosionPos) {
    return (
      <mesh position={explosionPos} scale={explosionScale}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color="#ffaa00" 
          emissive="#ff4400" 
          emissiveIntensity={10} 
          transparent 
          opacity={Math.max(0, 0.8 - (explosionScale / 4))} 
        />
      </mesh>
    );
  }

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      linearVelocity={initialVelocity}
      type="dynamic"
      mass={3}
      restitution={0.1}
      friction={1.2}
      linearDamping={1.0}
      gravityScale={3.0}
      canSleep={false}
      ccd={true}
      userData={{ isBomb: true }}
    >
      <BallCollider args={[0.4]} />
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
      </mesh>
    </RigidBody>
  );
}
