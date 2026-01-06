import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { BallCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { $cameraShake, $currentRoomId, $enemyPositions, $floorData, breakWall, removeThrownBomb, updateThrownBomb } from '../../stores/game';
import { breakCrate } from '../../stores/loot';
import { $position, takeDamage } from '../../stores/player';
import { breakRock } from '../../stores/rock';
import { emitDamage, emitDrop, emitKnockback } from '../../systems/events';
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


    // 3. Break walls and crates
    const wallRadius = 3;
    const room = floorData?.rooms.find(r => r.id === roomId);
    if (room && floorData) {
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
            // Check for tile type in local grid?
            // Global grid access is easier if we have it, but we have local room + offset.
            // The `floorData.rooms` doesn't have the grid content directly exposed easily here? 
            // Wait, breakWall uses (roomId, x, y).
            // I need to check if there is a crate there?
            // Or I can just blindly try to break crate at that ID?
            // Crate IDs are `${x},${y}` relative to the room grid!
            // So I can just call `breakCrate(`${gx},${gy}`)`.
            // But wait, `breakCrate` takes a unique ID.
            // In `Crate.tsx`: `id={`${x},${y}`}`.
            // But wait, is that unique across rooms?
            // In `GridMap.tsx`: `key={`crate-${room.id}-${x}-${y}`} id={`${x},${y}`}`. 
            // The ID passed to `breakCrate` is just `${x},${y}`? 
            // If so, breaking a crate at 5,5 breaks it in ALL rooms?
            // Let's check `Crate` and `GridMap` again.
            // GridMap passes `id={`${x},${y}`}`.
            // Yes, this is a BUG. Crate IDs must be unique per room!
            // I should fix that bug first or account for it.
            // I will assume I need to fix it.
            // But for now, let's implement the logic assuming I fix the ID to be `${room.id}-${gx}-${gy}`.
            // Actually, let's look at `breakWall`.
            // `breakWall` takes `roomId`.
            // `breakCrate` takes `id`.
            // I should make `breakCrate` take `roomId` or make the ID unique.
            
            // Let's assume I will fix GridMap to transmit `room.id-x-y`.
            // const crateId = `${room.id}-${gx}-${gy}`;
            // If I just call this, it's harmless if no crate exists (just sets a key in a map).
            // But I should check if I should spawn loot.
            // I can't check tile type easily without the grid state here.
            // `floorData` store usually has the layout? 
            // `floorGen` returns `rooms` and `grid`? no.
            // `floorData` in store only has `rooms`.
            
            // Alternative: Bomb physics collision with Crates?
            // The bomb is a rigid body. 
            // I can use `onCollisionEnter`/`onIntersectionEnter` but the explosion is an EVENT at a point in time, not a physics collision of the bomb body (which might be sitting still).
            // Be easier to just blind-fire "breakCrate" events?
            // But then LOOT spawns everywhere?
            // I need to know if a crate WAS there.
            // I should modify `breakCrate` to return success?
            // No, the store is on the client.
            
            // Best approach: In `Crate.tsx`, subscribe to an `$explosionEvents` store?
            // Or `GridMap` exposes the grid?
            // Or just check collisions with the explosion sphere?
            // I can spawn a temporary sensor "Explosion" object that triggers collisions.
            // The `ThownBomb` already renders a visual sphere:
            // `<mesh position={explosionPos} scale={explosionScale}>`
            // If I make that a Sensor RigidBody for 1 frame, it interacts with everything!
            
          }
           if (dist < wallRadius) {
              breakWall(roomId, gx, gy);
              // Also try breaking crate with the fixed ID format I'm about to implement
              // const crateId = `${gx},${gy}`; // Current BUGGY format
              // I will stick to the sensor approach or blind fire.
              // Actually, breaking walls is blind logic in `breakWall` store?
              // Let's look at `breakWall` implementation?
              
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
      <group>
        <RigidBody position={explosionPos} type="dynamic" gravityScale={0} sensor>
           <BallCollider 
             args={[3.5]} 
             onIntersectionEnter={({ other }) => {
                const ud = other.rigidBodyObject?.userData;
                if (ud?.isBreakable) {
                   breakCrate(ud.crateId);
                   const t = other.rigidBody?.translation();
                   if (t) emitDrop([t.x, 0.1, t.z], roomId);
                }
                if (ud?.isRock) {
                   breakRock(ud.rockId);
                   if (ud.isSecret) {
                      const t = other.rigidBody?.translation();
                      if (t) {
                         // Secret rocks guarantee high-value items (like Isaac's tinted rocks)
                         emitDrop([t.x, 0.1, t.z], roomId, 'shield');
                         setTimeout(() => emitDrop([t.x + 0.3, 0.1, t.z + 0.3], roomId, 'health'), 50);
                         setTimeout(() => emitDrop([t.x - 0.3, 0.1, t.z - 0.3], roomId), 100); // One random drop
                      }
                   }
                }
             }}
           />
        </RigidBody>
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
      </group>
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
