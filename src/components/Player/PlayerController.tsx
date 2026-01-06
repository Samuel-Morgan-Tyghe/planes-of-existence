import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { $currentRoomId, $plane, $playerYaw } from '../../stores/game';
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
  const keysRef = useRef<Set<string>>(new Set());
  
  // Use refs to track local usage, but sync with global
  const isLocked = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // console.log('⌨️ Key Down:', e.key);
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // console.log('⌨️ Key Up:', e.key);
      keysRef.current.delete(e.key.toLowerCase());
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


  useFrame((state) => {
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
           const dist = Math.sqrt((pos.x - trail.position[0])**2 + (pos.z - trail.position[2])**2);
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
    const ACCELERATION = 60 * speedMult; 
    const FRICTION = 20;      
    const AIR_FRICTION = 10;  

    const delta = 1/60; // Approx fixed time step
    
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
      switch (plane) {
        case '2D':
          if (keys.has('a')) targetVX = -MAX_SPEED;
          if (keys.has('d')) targetVX = MAX_SPEED;
          break;
        case 'ISO':
          if (keys.has('w')) targetVZ = -MAX_SPEED;
          if (keys.has('s')) targetVZ = MAX_SPEED;
          if (keys.has('a')) targetVX = -MAX_SPEED;
          if (keys.has('d')) targetVX = MAX_SPEED;
          break;
      }
    }

    // Apply jump impulse if space is pressed and grounded
    if (keys.has(' ') && Math.abs(velocity.y) < 0.1) {
      rb.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
    }

    // Apply Acceleration / Friction
    const mass = rb.mass();
    const isGrounded = Math.abs(velocity.y) < 0.1;
    const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
    
    // Dynamic Acceleration: Slow to start (Momentum), snap to turn
    // If we are moving fast (> 20% max speed) and trying to move, we can turn instantly (high accel)
    const isMovingFast = currentSpeed > MAX_SPEED * 0.2;
    const isTryingToMove = Math.abs(targetVX) > 0 || Math.abs(targetVZ) > 0;
    
    // Base Accel (Ramp up from stop) = 60 (approx 0.5s to max)
    // Snap Accel (Turning) = 400 (Instant feel)
    const SNAP_ACCEL = 400;
    
    let accelForce = ACCELERATION;
    if (isGrounded && isMovingFast && isTryingToMove) {
        accelForce = SNAP_ACCEL;
    } else if (!isGrounded) {
        accelForce = ACCELERATION * 0.5;
    }

    const frictionForce = isGrounded ? FRICTION : AIR_FRICTION;

    // If we are strictly trying to stop (no input), use friction
    // If we are trying to move, use acceleration
    const isStoppingX = targetVX === 0;
    const isStoppingZ = targetVZ === 0;

    // Apply forces
    let impulseX = 0;
    let impulseZ = 0;

    // Calculate difference between current and target
    const diffX = targetVX - velocity.x;
    const diffZ = targetVZ - velocity.z;

    // X Axis
    if (Math.abs(diffX) > 0.01) {
        const force = isStoppingX ? frictionForce : accelForce;
        // Clamp impulse so we don't overshoot in one frame
        const maxImpulse = force * delta * mass; 
        impulseX = THREE.MathUtils.clamp(diffX * mass, -maxImpulse, maxImpulse);
    }

    // Z Axis
    if (Math.abs(diffZ) > 0.01) {
        const force = isStoppingZ ? frictionForce : accelForce;
        const maxImpulse = force * delta * mass;
        impulseZ = THREE.MathUtils.clamp(diffZ * mass, -maxImpulse, maxImpulse);
    }
    
    if (Math.abs(impulseX) > 0.001 || Math.abs(impulseZ) > 0.001) {
      rb.applyImpulse({ x: impulseX, y: 0, z: impulseZ }, true);
    }
    
    // Safety Clamp: Prevent infinite speed accumulation (reported bug)
    // We only clamp horizontal speed
    const currentVel = rb.linvel();
    const horizontalSpeed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z);
    
    if (horizontalSpeed > MAX_SPEED * 1.1) { // Allow 10% overspeed for physics bounce/impulses
        const scale = (MAX_SPEED * 1.1) / horizontalSpeed;
        rb.setLinvel({ x: currentVel.x * scale, y: currentVel.y, z: currentVel.z * scale }, true);
    }
  });

  return null;
}
