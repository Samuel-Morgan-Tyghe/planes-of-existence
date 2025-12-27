import { useStore } from '@nanostores/react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody } from '@react-three/rapier';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { $plane } from '../../stores/game';
import { $health, $isInvulnerable, $position } from '../../stores/player';
import { $restartTrigger, restartRun } from '../../stores/restart';
import { PlayerController } from './PlayerController';

const SPAWN_POSITION: [number, number, number] = [0, 1.5, 0];
const PLAYER_SPAWN_INVULNERABILITY = 5000; // 5 seconds - increased for safety

export function Player() {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const plane = useStore($plane);
  const health = useStore($health);
  const restartTrigger = useStore($restartTrigger);
  const [damageFlash, setDamageFlash] = useState(false);
  const [damageIntensity, setDamageIntensity] = useState(0); // 0-1 for pulsing damage indicator
  const [isInvulnerable, setIsInvulnerable] = useState(true); // Start invulnerable
  const [isDead, setIsDead] = useState(false);
  const lastHealthRef = useRef(health);
  const spawnTimeRef = useRef(Date.now());
  const isInvulnerableRef = useRef(true); // Start invulnerable
  const isDeadRef = useRef(false);
  const invulnerabilityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deathTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      position={[0, 1.5, 0]}
      collisionGroups={0x00010001}
    >
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
      <PlayerPositionTracker meshRef={meshRef} />
    </RigidBody>
  );
}

// Track player position and store it globally
function PlayerPositionTracker({
  meshRef
}: {
  meshRef: React.RefObject<THREE.Mesh>;
}) {
  useFrame(() => {
    if (!meshRef.current) return;
    // Get world position (not local position relative to parent)
    const worldPos = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPos);
    $position.set([worldPos.x, worldPos.y, worldPos.z]);
  });
  return null;
}

