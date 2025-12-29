import { useStore } from '@nanostores/react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { $enemies, $plane } from '../../stores/game';
import { $position } from '../../stores/player';
import { fireWeapon } from '../../systems/combat';
import { emitDamage } from '../../systems/events';
import type { ProjectileData } from '../../types/game';
import { Projectile } from './Projectile';

export function WeaponSystem() {
  // const playerPosition = useStore($position); // Performance optimization: Read directly in useFrame
  const [projectiles, setProjectiles] = useState<Array<{ id: number; data: ProjectileData; origin: [number, number, number] }>>([]);
  const projectileIdCounter = useRef(0);
  const lastFireTime = useRef(0);
  const fireCooldown = 200; // ms - faster like Isaac
  const arrowKeysRef = useRef<Set<string>>(new Set());

  // Removed projectile clearing on room change to prevent disappearing shots
  // and allow projectiles to travel between rooms if needed.

  useEffect(() => {
    console.log('🎮 WeaponSystem: Setting up arrow key listeners');
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow')) {
        arrowKeysRef.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.startsWith('Arrow')) {
        arrowKeysRef.current.delete(e.key);
      }
    };



    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const isMouseDownRef = useRef(false);
  const { camera } = useThree();
  const plane = useStore($plane);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = true;
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) isMouseDownRef.current = false;
    };
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Continuous firing like Binding of Isaac
  useFrame(() => {
    // Check if we should fire
    let shouldFire = false;
    let direction: [number, number, number] | null = null;

    if (plane === 'FPS') {
        // FPS Mode: Fire if mouse is held down
        if (isMouseDownRef.current) {
            shouldFire = true;
            // Get camera forward vector
            const forward = new Vector3(0, 0, -1);
            forward.applyQuaternion(camera.quaternion);
            direction = [forward.x, forward.y, forward.z];
        }
    } else {
        // 2D/ISO Mode: Fire if arrow keys are held
        if (arrowKeysRef.current.size > 0) {
            shouldFire = true;
            if (arrowKeysRef.current.has('ArrowUp')) direction = [0, 0, -1];
            else if (arrowKeysRef.current.has('ArrowDown')) direction = [0, 0, 1];
            else if (arrowKeysRef.current.has('ArrowLeft')) direction = [-1, 0, 0];
            else if (arrowKeysRef.current.has('ArrowRight')) direction = [1, 0, 0];
        }
    }

    if (!shouldFire || !direction) return;

    // Safety check: Don't fire if game is paused or scene not ready
    // if (document.hidden) return;

    const now = Date.now();
    if (now - lastFireTime.current < fireCooldown) {
        // console.log('⏳ Cooldown active');
        return;
    }
    lastFireTime.current = now;

    // Read fresh position directly from store to avoid stale closures and re-renders
    const currentPos = $position.get();
    
    const projectileDatas = fireWeapon(currentPos, direction);

    // Batch all new projectiles into a single state update to avoid race conditions
    const newProjectiles = projectileDatas.map((projData) => {
      // Offset origin slightly forward from player to avoid clipping
      const offset = new Vector3(...direction!).multiplyScalar(0.8);
      const spawnPos: [number, number, number] = [
        currentPos[0] + offset.x,
        currentPos[1] + offset.y, // Adjust height for FPS?
        currentPos[2] + offset.z,
      ];
      
      // For FPS, maybe spawn higher (eye level)?
      if (plane === 'FPS') {
          spawnPos[1] += 0.5;
      }

      const id = projectileIdCounter.current++;

      return {
        id,
        data: projData,
        origin: spawnPos,
      };
    });

    // Single state update with all new projectiles
    setProjectiles(prev => {
      const updated = [...prev, ...newProjectiles];
      return updated;
    });
  });

  const handleDestroy = useCallback((id: number) => {
    setProjectiles(prev => prev.filter((p) => p.id !== id));
  }, []);

  const handleHit = useCallback((damage: number, enemyId?: number) => {
    if (enemyId !== undefined) {
      // Emit damage event
      emitDamage(enemyId, damage);
    }
  }, []);

  // Get fresh enemy positions - use both window global AND direct store access as fallback
  const enemiesFromStore = useStore($enemies);
  const windowEnemyPositions = typeof window !== 'undefined'
    ? ((window as any).__enemyPositions || [])
    : [];

  // If window positions are empty but we have enemies in store, use store positions directly
  const freshEnemyPositions = windowEnemyPositions.length > 0
    ? windowEnemyPositions
    : enemiesFromStore.map(e => ({ id: e.id, position: e.position }));

  // Periodic status log
  const renderCountRef = useRef(0);
  renderCountRef.current++;
  if (renderCountRef.current % 120 === 0) {
    console.log(`🎯 Status: ${projectiles.length} projectiles, ${freshEnemyPositions.length} enemies`);
  }

  return (
    <>
      {projectiles.map((proj) => (
        <Projectile
          key={proj.id}
          data={proj.data}
          origin={proj.origin}
          enemyPositions={freshEnemyPositions}
          onDestroy={() => handleDestroy(proj.id)}
          onHit={handleHit}
        />
      ))}
    </>
  );
}

