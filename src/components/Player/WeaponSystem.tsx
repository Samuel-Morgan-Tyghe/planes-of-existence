import { useStore } from '@nanostores/react';
import { useKeyboardControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { $enemyPositions, $isPaused, $plane, $playerYaw, $stats, debugRerollEnemies, useBomb } from '../../stores/game';
import { $position, $projectiles, $recoilTrigger, $velocity, addProjectiles, removeProjectile } from '../../stores/player';
import { fireWeapon } from '../../systems/combat';
import { emitDamage } from '../../systems/events';
import { addEffect } from '../Effects/EffectsManager';
import { Projectile } from './Projectile';

export function WeaponSystem() {
  const projectiles = useStore($projectiles);
  const stats = useStore($stats);
  const [, getKeys] = useKeyboardControls();
  const projectileIdCounter = useRef(0);
  const lastFireTime = useRef(0);
  const bombCooldownRef = useRef(0);

  const fireCooldown = 1000 / stats.fireRate;
  const { camera } = useThree();
  const plane = useStore($plane);
  const isMouseDownRef = useRef(false);
  const lightRef = useRef<THREE.PointLight>(null);

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

  const handleThrowBomb = () => {
    const now = Date.now();
    if (now - bombCooldownRef.current < 500) return;
    bombCooldownRef.current = now;

    const currentPos = $position.get();
    const playerYaw = $playerYaw.get();
    const isFPS = plane === 'FPS';

    let finalDir = new Vector3();

    if (isFPS) {
      camera.getWorldDirection(finalDir);
    } else {
      finalDir.set(Math.sin(playerYaw), 0, -Math.cos(playerYaw));
    }

    const direction: [number, number, number] = [finalDir.x, finalDir.y, finalDir.z];

    // Standstill check using keys for Isaac feel
    const keys = getKeys();
    const isMoving = keys.forward || keys.backward || keys.left || keys.right;
    const isStandstill = !isMoving && !isFPS;

    const spawnOffset = isStandstill ? 0.3 : 1.5;
    const offset = new Vector3(...direction).multiplyScalar(spawnOffset);
    const spawnPos: [number, number, number] = [
      currentPos[0] + offset.x,
      currentPos[1] + 1.2,
      currentPos[2] + offset.z
    ];

    const playerVel = $velocity.get();
    useBomb(spawnPos, direction, playerVel, isStandstill);
  };

  useFrame((state, delta) => {
    if ($isPaused.get()) return;

    const keys = getKeys();

    // Movement-based triggers (Bomb & Reroll)
    if (keys.bomb) {
      handleThrowBomb();
    }
    if (keys.reroll) {
      debugRerollEnemies();
    }

    // Muzzle flash decay
    if (lightRef.current && lightRef.current.intensity > 0) {
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, 0, delta * 20);
    }

    // Shooting Logic
    let shouldFire = false;
    let fireDir: [number, number, number] | null = null;

    if (plane === 'FPS') {
      const forward = new Vector3();
      camera.getWorldDirection(forward);
      if (isMouseDownRef.current || keys.fireUp || keys.fireDown || keys.fireLeft || keys.fireRight) {
        shouldFire = true;
        fireDir = [forward.x, forward.y, forward.z];
      }
    } else {
      // ISO Cardinal Shooting
      if (isMouseDownRef.current) {
        shouldFire = true;
        state.raycaster.setFromCamera(state.pointer, camera);
        const target = new Vector3();
        const shootPlaneGlobal = new THREE.Plane(new Vector3(0, 1, 0), -0.7);
        state.raycaster.ray.intersectPlane(shootPlaneGlobal, target);

        if (target) {
          const currentPos = $position.get();
          const diff = new Vector3(target.x - currentPos[0], 0, target.z - currentPos[2]);
          if (Math.abs(diff.x) > Math.abs(diff.z)) {
            fireDir = [Math.sign(diff.x), 0, 0];
          } else {
            fireDir = [0, 0, Math.sign(diff.z)];
          }
        }
      } else {
        if (keys.fireUp) { shouldFire = true; fireDir = [0, 0, -1]; }
        else if (keys.fireDown) { shouldFire = true; fireDir = [0, 0, 1]; }
        else if (keys.fireLeft) { shouldFire = true; fireDir = [-1, 0, 0]; }
        else if (keys.fireRight) { shouldFire = true; fireDir = [1, 0, 0]; }
      }
    }

    if (shouldFire && fireDir) {
      const now = Date.now();
      if (now - lastFireTime.current >= fireCooldown) {
        lastFireTime.current = now;
        const currentPos = $position.get();
        const projectileDatas = fireWeapon(currentPos, fireDir);

        const newProjectiles = projectileDatas.map((projData) => {
          const offset = new Vector3(...fireDir!).multiplyScalar(0.8);
          const spawnPos: [number, number, number] = [
            currentPos[0] + offset.x,
            plane === 'FPS' ? currentPos[1] + 0.75 : currentPos[1],
            currentPos[2] + offset.z,
          ];

          return {
            id: projectileIdCounter.current++,
            data: projData,
            origin: spawnPos,
          };
        });

        if (newProjectiles.length > 0) {
          addProjectiles(newProjectiles);
          $recoilTrigger.set($recoilTrigger.get() + 1);
          if (lightRef.current) lightRef.current.intensity = 5.0;
        }
      }
    }
  });

  const handleHit = useCallback((damage: number, enemyId?: number) => {
    if (enemyId !== undefined) {
      emitDamage(enemyId, damage);
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
