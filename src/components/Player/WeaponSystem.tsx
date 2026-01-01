import { useStore } from '@nanostores/react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { $plane, $stats, useBomb } from '../../stores/game';
import { $position, $projectiles, $velocity, addProjectiles, removeProjectile } from '../../stores/player';
import { fireWeapon } from '../../systems/combat';
import { emitDamage } from '../../systems/events';
import { Projectile } from './Projectile';

export function WeaponSystem() {
  const projectiles = useStore($projectiles);
  const stats = useStore($stats);
  const projectileIdCounter = useRef(0);
  const lastFireTime = useRef(0);
  
  const fireCooldown = 1000 / stats.fireRate; 
  const arrowKeysRef = useRef<Set<string>>(new Set());
  const wasdKeysRef = useRef<Set<string>>(new Set());
  const { camera } = useThree();
  const plane = useStore($plane);
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key.startsWith('Arrow')) {
        arrowKeysRef.current.add(e.key);
      }
      if (['w', 'a', 's', 'd'].includes(key)) {
        wasdKeysRef.current.add(key);
      }
      if (key === 'e') {
        handleThrowBomb();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (e.key.startsWith('Arrow')) {
        arrowKeysRef.current.delete(e.key);
      }
      if (['w', 'a', 's', 'd'].includes(key)) {
        wasdKeysRef.current.delete(key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [plane, camera]);

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

  useFrame(() => {
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
        addProjectiles(newProjectiles);
    }
  });

  const lastMoveDirRef = useRef<Vector3>(new Vector3(0, 0, -1));

  const handleThrowBomb = () => {
    const currentPos = $position.get();
    const moveDir = new Vector3(0, 0, 0);
    const wasd = wasdKeysRef.current;
    
    if (wasd.has('w')) moveDir.z -= 1;
    if (wasd.has('s')) moveDir.z += 1;
    if (wasd.has('a')) moveDir.x -= 1;
    if (wasd.has('d')) moveDir.x += 1;

    let finalDir = new Vector3().copy(lastMoveDirRef.current);

    if (moveDir.lengthSq() > 0) {
      finalDir.copy(moveDir).normalize();
      lastMoveDirRef.current.copy(finalDir);
    } else {
      // Fallback to shooting direction
      const shootingDir = new Vector3(0, 0, 0);
      const arrows = arrowKeysRef.current;
      if (arrows.has('ArrowUp')) shootingDir.z -= 1;
      if (arrows.has('ArrowDown')) shootingDir.z += 1;
      if (arrows.has('ArrowLeft')) shootingDir.x -= 1;
      if (arrows.has('ArrowRight')) shootingDir.x += 1;
      
      if (shootingDir.lengthSq() > 0) {
        finalDir.copy(shootingDir).normalize();
      } else if (plane === 'FPS') {
        finalDir.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      }
    }

    const direction: [number, number, number] = [finalDir.x, finalDir.y, finalDir.z];

    // Spawn closer to player to allow collision, but slightly offset
    const offset = new Vector3(...direction).multiplyScalar(1.2);
    const spawnPos: [number, number, number] = [
      currentPos[0] + offset.x,
      currentPos[1] + 1.2, // Chest height
      currentPos[2] + offset.z
    ];

    const playerVel = $velocity.get();
    console.log('💣 Throwing bomb in direction:', direction, 'with momentum:', playerVel);
    useBomb(spawnPos, direction, playerVel);
  };

  const handleHit = useCallback((damage: number, enemyId?: number) => {
    if (enemyId !== undefined) {
      emitDamage(enemyId, damage);
    }
  }, []);

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
