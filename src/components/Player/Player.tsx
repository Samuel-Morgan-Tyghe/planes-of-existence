import { useStore } from '@nanostores/react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { $plane } from '../../stores/game';
import { $health, $isInvulnerable, $isTeleporting, $position, $teleportTo } from '../../stores/player';
import { $restartTrigger, restartRun } from '../../stores/restart';
import { PlayerController } from './PlayerController';

const SPAWN_POSITION: [number, number, number] = [0, 0.5, 0];
const PLAYER_SPAWN_INVULNERABILITY = 5000; // 5 seconds - increased for safety

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const plane = useStore($plane);
  const health = useStore($health);
  const restartTrigger = useStore($restartTrigger);
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
    // Teleport player back to spawn
    rb.setTranslation({ x: SPAWN_POSITION[0], y: SPAWN_POSITION[1], z: SPAWN_POSITION[2] }, true);
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
  }, [restartTrigger]);

  // Sync teleport signal to ref
  useEffect(() => {
    return $teleportTo.subscribe((val) => {
      if (val) {
        console.log('📡 Teleport signal received:', val);
        teleportTargetRef.current = val as [number, number, number];
        $isTeleporting.set(true);
        teleportFrameLockRef.current = 3; // Lock for 3 frames
      }
    });
  }, []);

  // Initial spawn position
  useEffect(() => {
    if (rigidBodyRef.current) {
      console.log('🚀 Initial spawn at:', SPAWN_POSITION);
      rigidBodyRef.current.setTranslation({ x: SPAWN_POSITION[0], y: SPAWN_POSITION[1], z: SPAWN_POSITION[2] }, true);
    }
  }, []);

  // Flash red when taking damage (but not during invulnerability)
  useEffect(() => {
    if (health < lastHealthRef.current && !isInvulnerableRef.current) {
      setDamageFlash(true);
      setDamageIntensity(1.0); // Start at full intensity
      setTimeout(() => setDamageFlash(false), 300);
    }
    lastHealthRef.current = health;
  }, [health]);

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
      
      // 2. Kill all momentum
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      
      // 3. Clear signal and mark as done
      teleportTargetRef.current = null;
      $teleportTo.set(null);
    }

    // Handle teleport lock countdown
    if (teleportFrameLockRef.current > 0) {
      teleportFrameLockRef.current--;
      if (teleportFrameLockRef.current === 0) {
        $isTeleporting.set(false);
        console.log('🔓 Teleport lock released');
      }
      
      // Keep velocity at zero during lock to prevent "fighting"
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    if (damageIntensity > 0) {
      setDamageIntensity((prev) => Math.max(0, prev - delta * 2)); // Fade over 0.5 seconds
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
        // Rotation handled by mouse look
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
      userData={{ isPlayer: true }}
    >
      <CuboidCollider args={[0.5, 0.5, 0.5]} />
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isDead ? '#000000' : damageFlash ? '#ff0000' : isInvulnerable ? '#00ffff' : 'orange'}
          emissive={isDead ? '#ff0000' : damageFlash ? '#ff0000' : isInvulnerable ? '#00ffff' : '#000000'}
          emissiveIntensity={isDead ? 1.0 : damageFlash ? 0.8 : isInvulnerable ? 0.5 : 0}
        />
      </mesh>
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
          position={[0, 0.9, 0]} // Eye level (half of 1.8m height)
          near={0.1}
          far={1000}
        />
      )}
      <PlayerController rigidBodyRef={rigidBodyRef} />
      <PlayerPositionTracker meshRef={meshRef} rigidBodyRef={rigidBodyRef} />
    </RigidBody>
  );
}

// Track player position and store it globally
function PlayerPositionTracker({
  meshRef,
  rigidBodyRef
}: {
  meshRef: React.RefObject<THREE.Mesh>;
  rigidBodyRef: React.RefObject<RapierRigidBody>;
}) {
  useFrame(() => {
    if (!meshRef.current) return;
    // Get world position (not local position relative to parent)
    const worldPos = new Vector3();
    meshRef.current.getWorldPosition(worldPos);
    $position.set([worldPos.x, worldPos.y, worldPos.z]);

    // Void Safety Net: If player falls through floor, respawn them
    if (worldPos.y < -10) {
        const rb = rigidBodyRef.current;
        if (rb) {
            // Respawn at current X/Z but high up
            rb.setTranslation({ x: worldPos.x, y: 5, z: worldPos.z }, true);
            rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
    }

    // Debug log for position and velocity
    const rb = rigidBodyRef.current;
    if (rb) {
        const v = rb.linvel();
        if (Math.abs(v.y) > 0.01 || Math.abs(v.x) > 0.01 || Math.abs(v.z) > 0.01) {
            // const t = rb.translation();
            // console.log('📍 RB Pos:', t, '💨 RB Vel:', v);
        }
    }
  });
  return null;
}
