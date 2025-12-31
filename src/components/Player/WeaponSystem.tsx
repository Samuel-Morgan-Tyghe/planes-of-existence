import { useStore } from '@nanostores/react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { $plane, $stats } from '../../stores/game';
import { $position, $projectiles, addProjectiles, removeProjectile } from '../../stores/player';
import { fireWeapon } from '../../systems/combat';
import { emitDamage } from '../../systems/events';
import { Projectile } from './Projectile';

export function WeaponSystem() {
  const projectiles = useStore($projectiles);
  const stats = useStore($stats); // Read stats for fireRate
  const projectileIdCounter = useRef(0);
  const lastFireTime = useRef(0);
  
  // fireRate is shots per second, so cooldown is 1000 / fireRate
  const fireCooldown = 1000 / stats.fireRate; 
  const arrowKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log('🎮 WeaponSystem MOUNTED');
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

    return () => {
      console.log('🎮 WeaponSystem UNMOUNTED');
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
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
        if (isMouseDownRef.current) {
            shouldFire = true;
            const forward = new Vector3(0, 0, -1);
            forward.applyQuaternion(camera.quaternion);
            direction = [forward.x, forward.y, forward.z];
        }
    } else {
        if (arrowKeysRef.current.size > 0) {
            shouldFire = true;
            if (arrowKeysRef.current.has('ArrowUp')) direction = [0, 0, -1];
            else if (arrowKeysRef.current.has('ArrowDown')) direction = [0, 0, 1];
            else if (arrowKeysRef.current.has('ArrowLeft')) direction = [-1, 0, 0];
            else if (arrowKeysRef.current.has('ArrowRight')) direction = [1, 0, 0];
        }
    }

    if (!shouldFire || !direction) return;

    const now = Date.now();
    if (now - lastFireTime.current < fireCooldown) return;
    lastFireTime.current = now;

    const currentPos = $position.get();
    const projectileDatas = fireWeapon(currentPos, direction);

    const newProjectiles = projectileDatas.map((projData) => {
      const offset = new Vector3(...direction!).multiplyScalar(0.8);
      const spawnPos: [number, number, number] = [
        currentPos[0] + offset.x,
        currentPos[1] - 0.2,
        currentPos[2] + offset.z,
      ];
      
      if (plane === 'FPS') {
          spawnPos[1] += 0.7;
      }

      return {
        id: projectileIdCounter.current++,
        data: projData,
        origin: spawnPos,
      };
    });

    if (newProjectiles.length > 0) {
        console.log(`🔫 Firing ${newProjectiles.length} projectiles. Total: ${projectiles.length + newProjectiles.length}`);
        addProjectiles(newProjectiles);
    }
  });

  const handleHit = useCallback((damage: number, enemyId?: number) => {
    if (enemyId !== undefined) {
      emitDamage(enemyId, damage);
    }
  }, []);

  // Weapon system logic
  return (
    <>
      {projectiles.map((proj) => (
        <Projectile
          key={proj.id}
          data={proj.data}
          origin={proj.origin}
          onDestroy={() => removeProjectile(proj.id)}
          onHit={handleHit}
        />
      ))}
    </>
  );
}

