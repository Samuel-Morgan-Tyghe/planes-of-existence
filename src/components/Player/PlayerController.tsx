import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { $currentRoomId, $plane, $playerYaw, $stats } from '../../stores/game';
import { $isTeleporting } from '../../stores/player';
import { $trails } from '../../stores/trails';

interface PlayerControllerProps {
  rigidBodyRef: React.RefObject<RapierRigidBody>;
}

const JUMP_FORCE = 8;

// Global state to persist rotation across re-renders/remounts
let globalPitch = 0;
let globalYaw = 0;

export function PlayerController({ rigidBodyRef }: PlayerControllerProps) {
  const plane = useStore($plane);
  const isTeleporting = useStore($isTeleporting);
  const stats = useStore($stats);
  const keysRef = useRef<Set<string>>(new Set());
  const jumpCountRef = useRef(0); // Track number of jumps performed

  // Use refs to track local usage, but sync with global
  const isLocked = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // console.log('⌨️ Key Down:', e.key);
      const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
      keysRef.current.add(key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // console.log('⌨️ Key Up:', e.key);
      const key = e.key === ' ' ? ' ' : e.key.toLowerCase();
      keysRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Run once on mount

  useEffect(() => {
    if (plane !== 'FPS') return;

    // Check availability of pointer lock API
    const hasPointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
    if (!hasPointerLock) return;

    const onMouseDown = () => {
      document.body.requestPointerLock();
    };

    const onLockChange = () => {
      isLocked.current = document.pointerLockElement === document.body ||
        (document as any).mozPointerLockElement === document.body ||
        (document as any).webkitPointerLockElement === document.body;
      // console.log('🔒 Pointer Lock Changed:', isLocked.current);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;

      const sensitivity = 0.002;

      // Update global state directly
      globalYaw -= e.movementX * sensitivity;
      globalPitch -= e.movementY * sensitivity;

      // Clamp pitch
      globalPitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, globalPitch));
    };

    // Initial check
    onLockChange();

    document.addEventListener('click', onMouseDown);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mozpointerlockchange', onLockChange);
    document.addEventListener('webkitpointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('click', onMouseDown);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mozpointerlockchange', onLockChange);
      document.removeEventListener('webkitpointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [plane]);


  useFrame((state, delta) => {
    if (!rigidBodyRef.current || isTeleporting) return;

    const rb = rigidBodyRef.current;
    const keys = keysRef.current;
    const currentRoomId = $currentRoomId.get();

    // Check for "Slow" Trail
    const pos = rb.translation();
    const trailsObj = $trails.get();
    const activeTrails = Object.values(trailsObj).filter(t => t.roomId === currentRoomId);
    let speedMult = 1.0;
    for (const trail of activeTrails) {
      if (trail.type === 'slow') {
        const dist = Math.sqrt((pos.x - trail.position[0]) ** 2 + (pos.z - trail.position[2]) ** 2);
        if (dist < trail.size) {
          speedMult = 0.4; // 60% slow
          break;
        }
      }
    }

    // 1. Manually Apply Rotation logic for FPS
    if (plane === 'FPS') {
      const camera = state.camera;

      // Sync Physics Body to Yaw
      const q = new THREE.Quaternion();
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), globalYaw);
      rb.setRotation(q, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true); // Prevent physics rotation

      // Sync Camera Pitch (Local X rotation)
      camera.rotation.x = globalPitch;
      camera.rotation.y = 0;
      camera.rotation.z = 0;

      $playerYaw.set(globalYaw);
    }

    const velocity = rb.linvel();
    // Momentum Settings
    const MAX_SPEED = 12 * speedMult;
    const ACCELERATION = 80 * speedMult;
    const STOP_FRICTION = 100; // Strong stop force

    // Calculate target velocity based on input
    let targetVX = 0;
    let targetVZ = 0;

    // 2. Relative Movement
    if (plane === 'FPS') {
      // Get direction from the BODY rotation (Yaw)
      const forward = new THREE.Vector3(0, 0, -1);
      const right = new THREE.Vector3(1, 0, 0);

      const bodyRot = new THREE.Quaternion();
      bodyRot.setFromAxisAngle(new THREE.Vector3(0, 1, 0), globalYaw);

      forward.applyQuaternion(bodyRot);
      right.applyQuaternion(bodyRot);

      const moveVec = new THREE.Vector3(0, 0, 0);
      if (keys.has('w')) moveVec.add(forward);
      if (keys.has('s')) moveVec.sub(forward);
      if (keys.has('d')) moveVec.add(right);
      if (keys.has('a')) moveVec.sub(right);

      if (moveVec.length() > 0) {
        moveVec.normalize().multiplyScalar(MAX_SPEED);
        targetVX = moveVec.x;
        targetVZ = moveVec.z;
      }
    } else {
      // Standard Global Controls for ISO/2D
      let nx = 0;
      let nz = 0;
      switch (plane) {
        case '2D':
          if (keys.has('a')) nx = -1;
          if (keys.has('d')) nx = 1;
          break;
        case 'ISO':
          if (keys.has('w')) nz = -1;
          if (keys.has('s')) nz = 1;
          if (keys.has('a')) nx = -1;
          if (keys.has('d')) nx = 1;
          break;
      }

      if (nx !== 0 || nz !== 0) {
        const len = Math.sqrt(nx * nx + nz * nz);
        targetVX = (nx / len) * MAX_SPEED;
        targetVZ = (nz / len) * MAX_SPEED;

        // Rotate player to face movement direction in ISO mode
        if (plane === 'ISO') {
          // Priority 1: Firing Direction (Arrow Keys)
          let fireNx = 0;
          let fireNz = 0;
          if (keys.has('arrowup')) fireNz = -1;
          if (keys.has('arrowdown')) fireNz = 1;
          if (keys.has('arrowleft')) fireNx = -1;
          if (keys.has('arrowright')) fireNx = 1;

          let angle = $playerYaw.get();

          // Only rotate to firing direction if keys are pressed
          if (fireNx !== 0 || fireNz !== 0) {
            if (Math.abs(fireNx) > Math.abs(fireNz)) {
              angle = fireNx > 0 ? -Math.PI / 2 : Math.PI / 2;
            } else {
              angle = fireNz > 0 ? Math.PI : 0;
            }
          } else {
            // Priority 2: Movement Direction (WASD)
            // Snap to cardinal directions only (N, S, E, W)
            if (Math.abs(nx) > Math.abs(nz)) {
              // East or West
              angle = nx > 0 ? -Math.PI / 2 : Math.PI / 2; // East : West
            } else {
              // North or South
              angle = nz > 0 ? Math.PI : 0; // South : North
            }
          }

          const q = new THREE.Quaternion();
          q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);
          rb.setRotation(q, true);
          $playerYaw.set(angle);
        }
      }
    }

    // Apply Acceleration / Friction
    const mass = rb.mass();
    const isGrounded = Math.abs(velocity.y) < 0.2; // Slightly more lenient grounding
    const isTryingToMove = Math.abs(targetVX) > 0 || Math.abs(targetVZ) > 0;

    // Reset jump count when grounded
    if (isGrounded && jumpCountRef.current > 0) {
      jumpCountRef.current = 0;
    }

    // Apply jump impulse if space is pressed and jumps remaining
    if (keys.has(' ') && jumpCountRef.current < stats.maxJumps) {
      rb.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
      jumpCountRef.current++;
      console.log(`🦘 Jump ${jumpCountRef.current}/${stats.maxJumps}!`);
    }

    if (isGrounded) {
      if (isTryingToMove) {
        // Simple acceleration towards target velocity
        const accelStep = ACCELERATION * delta * mass;
        rb.applyImpulse({
          x: THREE.MathUtils.clamp(targetVX * mass - velocity.x * mass, -accelStep, accelStep),
          y: 0,
          z: THREE.MathUtils.clamp(targetVZ * mass - velocity.z * mass, -accelStep, accelStep)
        }, true);
      } else {
        // Stop when not moving
        const stopForce = STOP_FRICTION * delta * mass;
        rb.applyImpulse({
          x: THREE.MathUtils.clamp(-velocity.x * mass, -stopForce, stopForce),
          y: 0,
          z: THREE.MathUtils.clamp(-velocity.z * mass, -stopForce, stopForce)
        }, true);
      }
    } else {
      // Air control
      const airControlForce = 30 * delta * mass;
      rb.applyImpulse({
        x: THREE.MathUtils.clamp(targetVX * mass - velocity.x * mass, -airControlForce, airControlForce),
        y: 0,
        z: THREE.MathUtils.clamp(targetVZ * mass - velocity.z * mass, -airControlForce, airControlForce)
      }, true);
    }

    // Simple speed clamp
    const finalVel = rb.linvel();
    const finalSpeed = Math.sqrt(finalVel.x * finalVel.x + finalVel.z * finalVel.z);

    if (finalSpeed > MAX_SPEED * 1.1) {
      const scale = (MAX_SPEED * 1.1) / finalSpeed;
      rb.setLinvel({ x: finalVel.x * scale, y: finalVel.y, z: finalVel.z * scale }, true);
    }
  });

  return null;
}
