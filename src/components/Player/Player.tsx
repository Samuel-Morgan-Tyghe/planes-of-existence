import { useStore } from '@nanostores/react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CylinderCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { MovingGhost } from './MovingGhost';


import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { $currentFloor, $currentRoomId, $plane, $stats } from '../../stores/game';
import { $health, $isInvulnerable, $isPlayerVisible, $isTeleporting, $position, $teleportTo, $velocity, takeDamage } from '../../stores/player';
import { $restartTrigger, restartRun } from '../../stores/restart';
import { $trails } from '../../stores/trails';
import { $knockbackEvents } from '../../systems/events';
import { PlayerController } from './PlayerController';

const SPAWN_POSITION: [number, number, number] = [0, 1.0, 0];
const PLAYER_SPAWN_INVULNERABILITY = 2000; // 2 seconds - reduced for easier testing

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Group>(null);
  const plane = useStore($plane);
  const stats = useStore($stats);
  // ...
  // (Skipping unchanging lines for the tool call brevity if possible, but replace_file_content needs context)
  // Actually I will target specific blocks.
  const health = useStore($health);
  const restartTrigger = useStore($restartTrigger);
  const currentFloor = useStore($currentFloor);
  // Use a ref for teleport signal to avoid re-renders during the physics loop
  const teleportTargetRef = useRef<[number, number, number] | null>(null);
  const teleportFrameLockRef = useRef(0);
  const [damageFlash, setDamageFlash] = useState(false);
  const [damageIntensity, setDamageIntensity] = useState(0); // 0-1 for pulsing damage indicator
  const [isInvulnerable, setIsInvulnerable] = useState(true); // Start invulnerable
  const [isDead, setIsDead] = useState(false);
  const lastHealthRef = useRef(health);
  const spawnTimeRef = useRef(Date.now());
  const isInvulnerableRef = useRef(true); // Start invulnerable
  const isDeadRef = useRef(false);
  const invulnerabilityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deathTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPoisonTimeRef = useRef(0);

  // Set invulnerability on initial mount
  useEffect(() => {
    spawnTimeRef.current = Date.now();
    isInvulnerableRef.current = true;
    setIsInvulnerable(true);
    $isInvulnerable.set(true);

    // Clear invulnerability after time
    if (invulnerabilityTimeoutRef.current) {
      clearTimeout(invulnerabilityTimeoutRef.current);
    }
    invulnerabilityTimeoutRef.current = setTimeout(() => {
      isInvulnerableRef.current = false;
      setIsInvulnerable(false);
      $isInvulnerable.set(false);
    }, PLAYER_SPAWN_INVULNERABILITY);

    return () => {
      if (invulnerabilityTimeoutRef.current) {
        clearTimeout(invulnerabilityTimeoutRef.current);
      }
    };
  }, []); // Run once on mount

  // Reset position and spawn time when restart happens
  useEffect(() => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;


    // Teleport player back to spawn using the robust physics-synced method
    console.log('🔄 Floor change/Restart detected. Teleporting to spawn via update loop.');
    teleportTargetRef.current = [...SPAWN_POSITION];
    $isTeleporting.set(true);
    // teleportFrameLockRef.current = 5; // Removed lock for smooth transition

    // Reset angular velocity to stop spin, but keep linear momentum?
    // For RESP_AWN (Restart), we SHOULD kill momentum.
    // This block is for RESTART/FLOOR CHANGE.
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Reset death state
    isDeadRef.current = false;
    setIsDead(false);

    // Clear any death timeout
    if (deathTimeoutRef.current) {
      clearTimeout(deathTimeoutRef.current);
      deathTimeoutRef.current = null;
    }

    // Reset spawn time for invulnerability
    spawnTimeRef.current = Date.now();
    isInvulnerableRef.current = true;
    setIsInvulnerable(true);
    $isInvulnerable.set(true);

    // Clear existing timeout
    if (invulnerabilityTimeoutRef.current) {
      clearTimeout(invulnerabilityTimeoutRef.current);
    }

    // Clear invulnerability after time
    invulnerabilityTimeoutRef.current = setTimeout(() => {
      isInvulnerableRef.current = false;
      setIsInvulnerable(false);
      $isInvulnerable.set(false);
    }, PLAYER_SPAWN_INVULNERABILITY);
  }, [restartTrigger, currentFloor]);


  // Sync teleport signal to ref
  useEffect(() => {
    return $teleportTo.subscribe((target) => {
      if (target) {
        console.log('📡 Teleport signal received:', target);
        teleportTargetRef.current = [...target] as [number, number, number];
        $isTeleporting.set(true);
        // teleportFrameLockRef.current = 5; // Removed lock
      }
    });
  }, []);


  // Handle Knockback events
  useEffect(() => {
    return $knockbackEvents.subscribe((event) => {
      if (!event || !rigidBodyRef.current) return;

      console.log('💥 Applying knockback to player:', event);
      const rb = rigidBodyRef.current;
      rb.applyImpulse({
        x: event.direction[0] * event.force,
        y: event.force * 0.5, // Small upward pop
        z: event.direction[2] * event.force
      }, true);
    });
  }, []);

  // Initial spawn position
  useEffect(() => {
    if (rigidBodyRef.current) {
      console.log('🚀 Initial spawn at:', SPAWN_POSITION);
      rigidBodyRef.current.setTranslation({ x: SPAWN_POSITION[0], y: SPAWN_POSITION[1], z: SPAWN_POSITION[2] }, true);
    }
  }, []);

  // Flash red AND trigger I-frames when taking damage
  useEffect(() => {
    if (health < lastHealthRef.current && !isInvulnerableRef.current) {
      console.log('💔 Player hit! Triggering I-Frames.');

      // Visuals
      setDamageFlash(true);
      setDamageIntensity(1.0);

      // I-Frames
      setIsInvulnerable(true);
      $isInvulnerable.set(true);
      isInvulnerableRef.current = true;

      // Knockback / Shake usually happens via event, but we ensure state is safe

      // Clear I-frames after 1s
      setTimeout(() => {
        setDamageFlash(false);
        setIsInvulnerable(false);
        $isInvulnerable.set(false);
        isInvulnerableRef.current = false;
        console.log('🛡️ I-Frames expired.');
      }, 1000);
    }
    lastHealthRef.current = health;
  }, [health]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCollision = (other: any) => {
    if (isDead || isInvulnerableRef.current || $isInvulnerable.get()) return;

    // Check for Enemy Collision
    if (other.rigidBodyObject?.userData?.isEnemy) {
      const enemyData = other.rigidBodyObject.userData;
      const damage = enemyData.damage || 10;

      console.log('💥 Player collided with Enemy! Taking damage:', damage);
      takeDamage(damage);

      // Calculate Knockback (Enemy -> Player)
      const enemyPos = other.rigidBodyObject.translation();
      const playerPos = rigidBodyRef.current?.translation();

      if (enemyPos && playerPos) {
        const dirX = playerPos.x - enemyPos.x;
        const dirZ = playerPos.z - enemyPos.z;
        const length = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;

        // Normalize and Scale
        // Stronger bounce based on resistance (lower resistance = higher bounce? Or linear?)
        // Logic: Resistance 1.0 = Normal. Resistance 2.0 = Half bounce.
        const force = 12.0 / stats.knockbackResistance;

        rigidBodyRef.current?.applyImpulse({
          x: (dirX / length) * force,
          y: 5.0, // Significant pop up
          z: (dirZ / length) * force
        }, true);
      }
    }
  };

  // Fade damage indicator over time
  useFrame((_state, delta) => {
    const rb = rigidBodyRef.current;
    if (!rb) return;

    // Handle teleportation signal in the physics loop
    if (teleportTargetRef.current) {
      const target = teleportTargetRef.current;
      console.log('✨ Executing Teleport (useFrame) to:', target);

      // 1. Snap position
      rb.setTranslation({ x: target[0], y: target[1], z: target[2] }, true);

      // 2. Kill all momentum? NO.
      // For Doors, we want momentum to carry through.
      // For Restart, momentum is killed by the Effect hook.
      // rb.setLinvel({ x: 0, y: 0, z: 0 }, true); 
      // rb.setAngvel({ x: 0, y: 0, z: 0 }, true);

      // 3. Clear signal and mark as done
      teleportTargetRef.current = null;
      $teleportTo.set(null);
      $isTeleporting.set(false); // Release lock immediately
    }

    // Handle teleport lock countdown
    if (teleportFrameLockRef.current > 0) {
      teleportFrameLockRef.current--;
      if (teleportFrameLockRef.current === 0) {
        $isTeleporting.set(false);
        console.log('🔓 Teleport lock released');
      }

      // Keep velocity at zero during lock to prevent "fighting"
      // Removed to allow momentum preservation logic
      // rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    if (damageIntensity > 0) {
      setDamageIntensity((prev) => Math.max(0, prev - delta * 2)); // Fade over 0.5 seconds
    }

    // Trail Toxicity Logic for Player
    const now = Date.now();
    const currentRoomId = $currentRoomId.get();
    const trailsObj = $trails.get();
    const activeTrails = Object.values(trailsObj).filter(t => t.roomId === currentRoomId);
    const playerPos = rb.translation();

    let isOnPoison = false;
    for (const trail of activeTrails) {
      if (trail.type === 'toxic') {
        const dist = Math.sqrt((playerPos.x - trail.position[0]) ** 2 + (playerPos.z - trail.position[2]) ** 2);
        if (dist < trail.size) {
          isOnPoison = true;
          break;
        }
      }
    }

    if (isOnPoison && now - lastPoisonTimeRef.current > 1000) {
      takeDamage(1); // Poison deals 1 damage per second to player
      lastPoisonTimeRef.current = now;
      setDamageFlash(true);
      setTimeout(() => setDamageFlash(false), 200);
    }
  });

  // Handle death - restart game when health reaches 0
  useEffect(() => {
    if (health <= 0 && !isInvulnerableRef.current && !isDeadRef.current) {
      // Mark as dead to prevent multiple restarts
      isDeadRef.current = true;
      setIsDead(true);

      // Clear any existing death timeout
      if (deathTimeoutRef.current) {
        clearTimeout(deathTimeoutRef.current);
      }

      // Small delay to show death state before restarting
      deathTimeoutRef.current = setTimeout(() => {
        isDeadRef.current = false;
        setIsDead(false);
        restartRun();
      }, 1500); // 1.5 second delay before restart

      return () => {
        if (deathTimeoutRef.current) {
          clearTimeout(deathTimeoutRef.current);
        }
      };
    } else if (health > 0) {
      // Reset death flag if health is restored (shouldn't happen, but safety)
      isDeadRef.current = false;
      setIsDead(false);
    }
  }, [health]);

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
        // Allow Y-axis (vertical) for jumping, but lock rotations
        rb.setEnabledTranslations(true, true, true, true);
        rb.lockRotations(true, true);
        break;
      case 'FPS':
        // Allow all movement
        rb.setEnabledTranslations(true, true, true, true);
        // UNLOCK rotations so setRotation works, but we manually zero angvel in Controller
        rb.lockRotations(false, true);
        break;
    }
  }, [plane]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      mass={1}
      gravityScale={1.5}
      canSleep={false}
      friction={0}
      linearDamping={0}
      angularDamping={0}
      userData={{ isPlayer: true }}
      onCollisionEnter={(e) => handleCollision(e.other)}
    >
      <CylinderCollider args={[0.6, 0.4]} />
      {/* Ghost Character Mesh */}
      <group ref={meshRef} position={[0, -0.5, 0]} visible={useStore($isPlayerVisible)}>
        <MovingGhost position={[0, 0, 0]} isDead={isDead} damageFlash={damageFlash} isInvulnerable={isInvulnerable} />
      </group>

      {/* Damage indicator - BIG pulsing red sphere around player */}
      {damageIntensity > 0 && (
        <>
          <mesh>
            <sphereGeometry args={[2.5 * (1 + damageIntensity * 0.3), 16, 16]} />
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff0000"
              emissiveIntensity={damageIntensity * 6.0}
              transparent
              opacity={damageIntensity * 0.4}
            />
          </mesh>
          {/* Inner bright warning */}
          <mesh>
            <sphereGeometry args={[1.5 * damageIntensity, 12, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={damageIntensity * 10.0}
              transparent
              opacity={damageIntensity * 0.7}
            />
          </mesh>
        </>
      )}
      {/* FPS camera parented to player */}
      {plane === 'FPS' && (
        <PerspectiveCamera
          makeDefault
          fov={75}
          position={[0, 1.8, 0]} // Eye level (90% of 2m height)
          near={0.1}
          far={1000}
        />
      )}
      <PlayerController rigidBodyRef={rigidBodyRef} />
      <PlayerPositionTracker meshRef={meshRef} rigidBodyRef={rigidBodyRef} />
      <InvulnerabilityManager />
    </RigidBody>
  );
}

// Isolated component to handle invulnerability logic and visuals without re-rendering the main Player
function InvulnerabilityManager() {
  const currentRoomId = useStore($currentRoomId);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  // Handle Room Change
  useEffect(() => {
    // Skip the very first run (mount) because Player handles spawn invulnerability
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    console.log('🛡️ InvulnerabilityManager: Room Changed to', currentRoomId);
    trigger();

  }, [currentRoomId]);

  // Expose trigger method
  const trigger = () => {
    $isInvulnerable.set(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      $isInvulnerable.set(false);
    }, 1500);
  };

  // Listen for manual triggers (like spawn)?
  // Actually, Player component handles spawn. We just need to SYNC with it.
  // Or current $isInvulnerable store?

  // Let's make this component responsible for the VISUAL based on the STORE.
  // And responsible for TRIGGERING based on Room ID.

  // Actually, simpler: 
  // 1. This component sets $isInvulnerable on room change.
  // 2. This component renders visual if $isInvulnerable is true.

  const isInvulnerable = useStore($isInvulnerable);

  return isInvulnerable ? (
    <mesh>
      <sphereGeometry args={[1.2, 16, 16]} />
      <meshStandardMaterial
        color="#00ffff"
        emissive="#00ffff"
        emissiveIntensity={0.5}
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  ) : null;
}

// Track player position and store it globally
function PlayerPositionTracker({
  meshRef,
  rigidBodyRef
}: {
  meshRef: React.RefObject<THREE.Object3D>;
  rigidBodyRef: React.RefObject<RapierRigidBody>;
}) {
  useFrame(() => {
    if (!meshRef.current) return;
    // Get world position (not local position relative to parent)
    const worldPos = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPos);
    $position.set([worldPos.x, worldPos.y, worldPos.z]);

    const rb = rigidBodyRef.current;
    if (rb) {
      const vel = rb.linvel();
      $velocity.set([vel.x, vel.y, vel.z]);

      // Void Safety Net: If player falls through floor, respawn them
      if (worldPos.y < -10) {
        console.log('🕳️ Player fell into the void!');
        takeDamage(20);
        // Respawn at current X/Z but high up
        rb.setTranslation({ x: worldPos.x, y: 5.0, z: worldPos.z }, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  });
  return null;
}
