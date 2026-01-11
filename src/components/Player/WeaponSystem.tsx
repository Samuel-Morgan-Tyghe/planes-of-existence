import { useStore } from '@nanostores/react';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { $enemyPositions, $plane, $playerYaw, $stats, debugRerollEnemies, useBomb } from '../../stores/game';
import { $position, $projectiles, $recoilTrigger, $velocity, addProjectiles, removeProjectile } from '../../stores/player';
import { fireWeapon } from '../../systems/combat';
import { emitDamage } from '../../systems/events';
import { addEffect } from '../Effects/EffectsManager';
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
      if (key === 'l') {
        debugRerollEnemies();
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

  useFrame((state) => {
    let shouldFire = false;
    let direction: [number, number, number] | null = null;

    if (plane === 'FPS') {
      const forward = new Vector3();
      camera.getWorldDirection(forward);

      // Fire on Mouse OR Up Arrow
      if (isMouseDownRef.current || arrowKeysRef.current.has('ArrowUp')) {
        shouldFire = true;
        direction = [forward.x, forward.y, forward.z];
      } else if (arrowKeysRef.current.size > 0) {
        shouldFire = true;
        direction = [forward.x, forward.y, forward.z];
      }
    } else {
      // ISO Mode
      if (isMouseDownRef.current) {
        shouldFire = true;

        // Raycast from mouse to floor to get direction
        state.raycaster.setFromCamera(state.pointer, camera);
        const target = new Vector3();
        // Intersect with floor plane at y=0.7 (standard projectile height)
        const plane = new THREE.Plane(new Vector3(0, 1, 0), -0.7);
        state.raycaster.ray.intersectPlane(plane, target);

        if (target) {
          const currentPos = $position.get();
          const diff = new Vector3(target.x - currentPos[0], 0, target.z - currentPos[2]);

          // Snap to cardinal directions
          if (Math.abs(diff.x) > Math.abs(diff.z)) {
            direction = [Math.sign(diff.x), 0, 0];
          } else {
            direction = [0, 0, Math.sign(diff.z)];
          }
        }
      }

      if (!shouldFire && arrowKeysRef.current.size > 0) {
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
        0.7, // Standardized combat plane height
        currentPos[2] + offset.z,
      ];

      // FPS mode override if needed, but keeping it standard is safer for now
      if (plane === 'FPS') {
        spawnPos[1] = 1.35; // Eye level (approx) to match crosshair/view
      }

      return {
        id: projectileIdCounter.current++,
        data: projData,
        origin: spawnPos,
      };
    });

    if (newProjectiles.length > 0) {
      addProjectiles(newProjectiles);
      $recoilTrigger.set($recoilTrigger.get() + 1);

      // Muzzle Flash
      if (lightRef.current) {
        lightRef.current.intensity = 5.0;
      }
    }
  });

  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    if (lightRef.current && lightRef.current.intensity > 0) {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, delta * 20);
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
    let isStandstill = false;

    if (plane === 'FPS') {
      // In FPS, ALWAYS throw where looking
      const forward = new Vector3();
      camera.getWorldDirection(forward);
      finalDir.copy(forward);
    } else if (plane === 'ISO') {
      // In ISO mode, throw in the direction the player is facing
      const playerYaw = $playerYaw.get();
      finalDir.set(Math.sin(playerYaw), 0, -Math.cos(playerYaw));

      // If player hasn't moved yet and yaw is 0, check for input
      if (playerYaw === 0 && moveDir.lengthSq() === 0) {
        const arrows = arrowKeysRef.current;
        if (arrows.has('ArrowUp')) finalDir.set(0, 0, -1);
        else if (arrows.has('ArrowDown')) finalDir.set(0, 0, 1);
        else if (arrows.has('ArrowLeft')) finalDir.set(-1, 0, 0);
        else if (arrows.has('ArrowRight')) finalDir.set(1, 0, 0);
        else {
          // Completely standstill, drop at feet
          isStandstill = true;
        }
      }
    } else if (moveDir.lengthSq() > 0) {
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
      }
    }

    const direction: [number, number, number] = [finalDir.x, finalDir.y, finalDir.z];

    // Spawn position
    let spawnPos: [number, number, number];
    if (isStandstill) {
      // Drop at player's feet with minimal offset
      spawnPos = [currentPos[0], currentPos[1] + 0.5, currentPos[2]];
    } else {
      // Spawn closer to player to allow collision, but slightly offset
      const offset = new Vector3(...direction).multiplyScalar(1.2);
      spawnPos = [
        currentPos[0] + offset.x,
        currentPos[1] + 1.2, // Chest height
        currentPos[2] + offset.z
      ];
    }

    const playerVel = $velocity.get();
    console.log('💣 Throwing bomb in direction:', direction, 'standstill:', isStandstill, 'with momentum:', playerVel);
    useBomb(spawnPos, direction, playerVel, isStandstill);
  };

  const handleHit = useCallback((damage: number, enemyId?: number) => {
    if (enemyId !== undefined) {
      emitDamage(enemyId, damage);

      // Spawn floating text
      const enemyPos = $enemyPositions.get()[enemyId];
      if (enemyPos) {
        addEffect({
          type: 'text',
          text: Math.round(damage).toString(),
          position: [enemyPos[0], enemyPos[1] + 1.0, enemyPos[2]],
          color: '#ffaa00'
        });
      }
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
      <pointLight ref={lightRef} color="#ffffaa" distance={5} decay={2} />
    </>
  );
}
