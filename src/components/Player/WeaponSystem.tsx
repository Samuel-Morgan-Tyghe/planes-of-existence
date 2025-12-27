import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';
import { $plane, $currentRoomId } from '../../stores/game';
import { $position } from '../../stores/player';
import { fireWeapon } from '../../systems/combat';
import type { ProjectileData } from '../../types/game';
import { Projectile } from './Projectile';

export function WeaponSystem() {
  const playerPosition = useStore($position);
  const plane = useStore($plane);
  const currentRoomId = useStore($currentRoomId);
  const [projectiles, setProjectiles] = useState<Array<{ id: number; data: ProjectileData; origin: [number, number, number] }>>([]);
  const projectileIdCounter = useRef(0);
  const lastFireTime = useRef(0);
  const fireCooldown = 200; // ms - faster like Isaac
  const arrowKeysRef = useRef<Set<string>>(new Set());

  // Clear all projectiles when room changes
  useEffect(() => {
    console.log(`🧹 Room changed to ${currentRoomId}, clearing ${projectiles.length} projectiles`);
    setProjectiles([]);
  }, [currentRoomId]);

  useEffect(() => {
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
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Continuous firing like Binding of Isaac
  useFrame(() => {
    if (arrowKeysRef.current.size === 0) return;

    const now = Date.now();
    if (now - lastFireTime.current < fireCooldown) return;
    lastFireTime.current = now;

    // Get shooting direction from held arrow keys
    let direction: [number, number, number] | null = null;

    if (arrowKeysRef.current.has('ArrowUp')) {
      direction = [0, 0, -1];
    } else if (arrowKeysRef.current.has('ArrowDown')) {
      direction = [0, 0, 1];
    } else if (arrowKeysRef.current.has('ArrowLeft')) {
      direction = [-1, 0, 0];
    } else if (arrowKeysRef.current.has('ArrowRight')) {
      direction = [1, 0, 0];
    }

    if (!direction) return;

    const projectileDatas = fireWeapon(playerPosition, direction);
    console.log(`🔫 Firing ${projectileDatas.length} projectiles from position`, playerPosition);

    // Batch all new projectiles into a single state update to avoid race conditions
    const newProjectiles = projectileDatas.map((projData) => {
      // Offset origin slightly forward from player to avoid clipping
      const offset = new Vector3(...direction!).multiplyScalar(0.8);
      const spawnPos: [number, number, number] = [
        playerPosition[0] + offset.x,
        playerPosition[1] + offset.y,
        playerPosition[2] + offset.z,
      ];

      const id = projectileIdCounter.current++;
      console.log(`  ➕ Creating projectile #${id} at`, spawnPos);

      return {
        id,
        data: projData,
        origin: spawnPos,
      };
    });

    // Single state update with all new projectiles
    setProjectiles(prev => {
      const updated = [...prev, ...newProjectiles];
      console.log(`  📊 Total projectiles now: ${updated.length} (added ${newProjectiles.length})`);
      return updated;
    });
  });

  const handleDestroy = useCallback((id: number) => {
    setProjectiles(prev => prev.filter((p) => p.id !== id));
  }, []);

  const handleHit = useCallback((damage: number, enemyId?: number) => {
    if (enemyId !== undefined) {
      // Call the global damage handler directly (always use latest enemy data)
      if ((window as any).__handleEnemyDamage) {
        (window as any).__handleEnemyDamage(enemyId, damage);
      }
    }
  }, []);

  return (
    <>
      {projectiles.map((proj) => {
        // Get fresh enemy positions each render to ensure we have the latest data
        const freshEnemyPositions = typeof window !== 'undefined'
          ? ((window as any).__enemyPositions || [])
          : [];

        return (
          <Projectile
            key={proj.id}
            data={proj.data}
            origin={proj.origin}
            enemyPositions={freshEnemyPositions}
            onDestroy={() => handleDestroy(proj.id)}
            onHit={handleHit}
          />
        );
      })}
    </>
  );
}

