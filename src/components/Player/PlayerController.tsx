import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import { $plane } from '../../stores/game';

interface PlayerControllerProps {
  rigidBodyRef: React.RefObject<RapierRigidBody>;
}

const MOVEMENT_SPEED = 5;
const JUMP_FORCE = 5;

export function PlayerController({ rigidBodyRef }: PlayerControllerProps) {
  const plane = useStore($plane);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useFrame(() => {
    if (!rigidBodyRef.current) return;

    const rb = rigidBodyRef.current;
    const keys = keysRef.current;
    const velocity = rb.linvel();

    let x = 0;
    let y = velocity.y; // Preserve Y velocity for gravity/jumping
    let z = 0;

    // Movement based on plane
    switch (plane) {
      case '2D':
        // Side-scrolling: A/D or Left/Right for horizontal movement
        if (keys.has('a') || keys.has('arrowleft')) x = -MOVEMENT_SPEED;
        if (keys.has('d') || keys.has('arrowright')) x = MOVEMENT_SPEED;
        // Space to jump
        if (keys.has(' ') && Math.abs(velocity.y) < 0.1) {
          y = JUMP_FORCE;
        }
        z = 0; // Locked in 2D
        break;

      case 'ISO':
        // Top-down: WASD for X/Z movement
        if (keys.has('w') || keys.has('arrowup')) z = -MOVEMENT_SPEED;
        if (keys.has('s') || keys.has('arrowdown')) z = MOVEMENT_SPEED;
        if (keys.has('a') || keys.has('arrowleft')) x = -MOVEMENT_SPEED;
        if (keys.has('d') || keys.has('arrowright')) x = MOVEMENT_SPEED;
        y = 0; // Locked in ISO
        break;

      case 'FPS':
        // First-person: WASD for movement
        if (keys.has('w') || keys.has('arrowup')) z = -MOVEMENT_SPEED;
        if (keys.has('s') || keys.has('arrowdown')) z = MOVEMENT_SPEED;
        if (keys.has('a') || keys.has('arrowleft')) x = -MOVEMENT_SPEED;
        if (keys.has('d') || keys.has('arrowright')) x = MOVEMENT_SPEED;
        // Space to jump
        if (keys.has(' ') && Math.abs(velocity.y) < 0.1) {
          y = JUMP_FORCE;
        }
        break;
    }

    rb.setLinvel({ x, y, z }, true);
  });

  return null;
}

