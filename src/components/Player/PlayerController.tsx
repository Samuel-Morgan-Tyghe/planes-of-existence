import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody } from '@react-three/rapier';
import { useEffect, useRef } from 'react';
import { $plane } from '../../stores/game';
import { $isTeleporting } from '../../stores/player';
import { $knockbackEvents } from '../../systems/events';

interface PlayerControllerProps {
  rigidBodyRef: React.RefObject<RapierRigidBody>;
}

const JUMP_FORCE = 5;

export function PlayerController({ rigidBodyRef }: PlayerControllerProps) {
  const plane = useStore($plane);
  const isTeleporting = useStore($isTeleporting);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // console.log('⌨️ Key Down:', e.key);
      keysRef.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // console.log('⌨️ Key Up:', e.key);
      keysRef.current.delete(e.key.toLowerCase());
    };

    console.log('🎮 PlayerController mounted. Current plane:', plane);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      console.log('🎮 PlayerController unmounted');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [plane]); // Re-bind if plane changes just in case

  // Handle knockback events
  useEffect(() => {
    const unsubscribe = $knockbackEvents.subscribe((event) => {
      if (!event || !rigidBodyRef.current) return;
      
      const rb = rigidBodyRef.current;
      const impulse = {
        x: event.direction[0] * event.force,
        y: 2, // Small upward pop
        z: event.direction[2] * event.force
      };
      
      console.log('💥 Applying knockback to player:', impulse);
      rb.applyImpulse(impulse, true);
    });
    return unsubscribe;
  }, [rigidBodyRef]);

  useFrame(() => {
    if (!rigidBodyRef.current || isTeleporting) return;

    const rb = rigidBodyRef.current;
    const keys = keysRef.current;
    const velocity = rb.linvel();

    let x = 0;
    let z = 0;
    const speed = 8;

    // Movement based on plane - WASD ONLY
    if (keys.size > 0) {
      // console.log('⌨️ Keys pressed:', Array.from(keys));
    }

    switch (plane) {
      case '2D':
        if (keys.has('a')) x = -speed;
        if (keys.has('d')) x = speed;
        break;
      case 'ISO':
      case 'FPS':
        if (keys.has('w')) z = -speed;
        if (keys.has('s')) z = speed;
        if (keys.has('a')) x = -speed;
        if (keys.has('d')) x = speed;
        break;
    }

    if (x !== 0 || z !== 0) {
      // console.log('🚀 Setting velocity:', { x, y: velocity.y, z });
    }

    // Apply jump impulse if space is pressed and grounded
    if (keys.has(' ') && Math.abs(velocity.y) < 0.1) {
      rb.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
    }

    // Snappy horizontal movement using impulses to avoid overwriting gravity's Y velocity
    const mass = rb.mass();
    const impulseX = (x - velocity.x) * mass;
    const impulseZ = (z - velocity.z) * mass;
    
    if (Math.abs(impulseX) > 0.01 || Math.abs(impulseZ) > 0.01) {
      rb.applyImpulse({ x: impulseX, y: 0, z: impulseZ }, true);
    }
  });

  return null;
}
