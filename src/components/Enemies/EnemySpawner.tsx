import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { Enemy } from './Enemy';
import { generateRoomLayout, gridToWorld } from '../../utils/floorGen';
import { ENEMY_DEFINITIONS } from '../../types/enemies';
import type { EnemyState } from '../../types/enemies';
import { $position } from '../../stores/player';
import { $restartTrigger } from '../../stores/restart';
import { $currentFloor, $currentRoomId, $floorData, $enemiesAlive, $roomCleared, $clearedRooms } from '../../stores/game';

export function EnemySpawner({
  onEnemyKilled,
  onSpawnRequest,
}: {
  onEnemyKilled: (enemyId: number) => void;
  onSpawnRequest?: (position: [number, number, number], count: number) => void;
}) {
  const [enemies, setEnemies] = useState<EnemyState[]>([]);
  const playerPosition = useStore($position);
  const restartTrigger = useStore($restartTrigger);
  const currentFloor = useStore($currentFloor);
  const currentRoomId = useStore($currentRoomId);
  const floorData = useStore($floorData);
  const enemyIdCounterRef = useRef(0);
  // Track which rooms have been cleared (enemies defeated)
  const clearedRoomsRef = useRef<Set<string>>(new Set());

  // Function to spawn enemies at a position
  const spawnEnemiesAt = useCallback((position: [number, number, number], count: number) => {
    const newEnemies: EnemyState[] = [];
    const enemyTypes = Object.values(ENEMY_DEFINITIONS);

    for (let i = 0; i < count; i++) {
      const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
      const offsetX = (Math.random() - 0.5) * 4; // Spread them out a bit
      const offsetZ = (Math.random() - 0.5) * 4;

      newEnemies.push({
        id: enemyIdCounterRef.current++,
        definition: randomEnemy,
        health: randomEnemy.health,
        position: [position[0] + offsetX, position[1], position[2] + offsetZ],
        isDead: false,
      });
    }

    console.log(`👹 Spawning ${count} enemies from drop at position`, position);
    setEnemies((prev) => {
      const combined = [...prev, ...newEnemies];
      $enemiesAlive.set(combined.length);
      $roomCleared.set(false); // Room no longer cleared
      return combined;
    });
  }, []); // No dependencies needed since we use functional setState and ref

  // Reset cleared rooms when restart or floor changes
  useEffect(() => {
    clearedRoomsRef.current = new Set();
    console.log('🔄 Cleared rooms reset');
  }, [restartTrigger, currentFloor]);

  // DEBUG: Kill all enemies with 'K' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'k' || e.key === 'K') {
        console.log('💀 DEBUG: Killing all enemies in room');
        setEnemies([]);
        $enemiesAlive.set(0);

        // Mark room as cleared
        const roomKey = `${currentFloor}-${currentRoomId}`;
        clearedRoomsRef.current.add(roomKey);

        const newClearedRooms = new Set($clearedRooms.get());
        newClearedRooms.add(currentRoomId);
        $clearedRooms.set(newClearedRooms);

        $roomCleared.set(true);
        console.log('✅ DEBUG: Room marked as cleared');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentFloor, currentRoomId]);

  useEffect(() => {
    // Spawn enemies based on current room
    // Regenerate when room changes or restart
    if (!floorData) return;

    const currentRoom = floorData.rooms.find(r => r.id === currentRoomId);
    if (!currentRoom) return;

    // Check if this room has been cleared
    const roomKey = `${currentFloor}-${currentRoomId}`;
    const isCleared = clearedRoomsRef.current.has(roomKey);

    console.log(`🚪 Entering room ${currentRoomId} on floor ${currentFloor}, cleared: ${isCleared}`);

    // If room is cleared, don't spawn enemies
    if (isCleared) {
      console.log(`✅ Room ${currentRoomId} already cleared, no enemies`);
      setEnemies([]);
      $enemiesAlive.set(0);
      $roomCleared.set(true);
      return;
    }

    const roomLayout = generateRoomLayout(currentRoom, currentFloor, true);
    const newEnemies: EnemyState[] = [];
    enemyIdCounterRef.current = 0;

    // Player spawn position (center of room)
    const PLAYER_SPAWN = [0, 1.5, 0];
    const MIN_SPAWN_DISTANCE = 10; // Minimum units from player spawn

    roomLayout.grid.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === 2) {
          // Enemy spawn point
          const worldPos = gridToWorld(x, y, roomLayout.worldOffset);
          const [worldX, worldY, worldZ] = worldPos;

          // Calculate distance from player spawn
          const dx = worldX - PLAYER_SPAWN[0];
          const dz = worldZ - PLAYER_SPAWN[2];
          const distance = Math.sqrt(dx * dx + dz * dz);

          // Only spawn if far enough from player
          if (distance >= MIN_SPAWN_DISTANCE) {
            const enemyTypes = Object.values(ENEMY_DEFINITIONS);
            const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

            console.log(`✅ Spawning Enemy ${enemyIdCounterRef.current} in room ${currentRoomId} at distance ${distance.toFixed(2)} from player`);

            newEnemies.push({
              id: enemyIdCounterRef.current++,
              definition: randomEnemy,
              health: randomEnemy.health,
              position: [worldX, worldY + 1, worldZ],
              isDead: false,
            });
          } else {
            console.warn(`❌ Skipping enemy spawn at (${worldX.toFixed(1)}, ${worldZ.toFixed(1)}) - too close to player (${distance.toFixed(2)} units)`);
          }
        }
      });
    });

    console.log(`🎮 Room ${currentRoomId} on Floor ${currentFloor}: Spawned ${newEnemies.length} enemies`);
    console.log(`  Enemy details:`, newEnemies.map(e => `Enemy ${e.id} at [${e.position[0].toFixed(1)}, ${e.position[1].toFixed(1)}, ${e.position[2].toFixed(1)}]`));

    setEnemies(newEnemies);
    $enemiesAlive.set(newEnemies.length);

    // If room has 0 enemies, mark it as cleared immediately
    if (newEnemies.length === 0) {
      console.log(`✅ Room ${currentRoomId} has no enemies, marking as cleared`);
      const roomKey = `${currentFloor}-${currentRoomId}`;
      clearedRoomsRef.current.add(roomKey);

      // Update global cleared rooms store
      const newClearedRooms = new Set($clearedRooms.get());
      newClearedRooms.add(currentRoomId);
      $clearedRooms.set(newClearedRooms);

      $roomCleared.set(true);
    } else {
      console.log(`❌ Room ${currentRoomId} has ${newEnemies.length} enemies, doors should be locked`);
      $roomCleared.set(false); // Reset room cleared status for new room with enemies
    }
  }, [restartTrigger, currentFloor, currentRoomId, floorData]);

  const handleEnemyDeath = (enemyId: number) => {
    // Get enemy position before removing it
    const dyingEnemy = enemies.find((e) => e.id === enemyId);
    const enemyPosition = dyingEnemy?.position || [0, 0, 0];

    setEnemies((prev) => {
      const newEnemies = prev.filter((e) => e.id !== enemyId);
      const aliveCount = newEnemies.length;

      // Update global enemy count
      $enemiesAlive.set(aliveCount);

      // Mark room as cleared if all enemies are dead
      if (aliveCount === 0) {
        const roomKey = `${currentFloor}-${currentRoomId}`;
        clearedRoomsRef.current.add(roomKey);

        // Also update global cleared rooms store
        const newClearedRooms = new Set($clearedRooms.get());
        newClearedRooms.add(currentRoomId);
        $clearedRooms.set(newClearedRooms);

        console.log(`🎉 Room ${currentRoomId} cleared! Marked as permanent.`);
        $roomCleared.set(true);
      }

      return newEnemies;
    });

    // Trigger drop roll
    if ((window as any).__handleEnemyDrop) {
      (window as any).__handleEnemyDrop(enemyPosition);
    }

    onEnemyKilled(enemyId);
  };

  const handleEnemyDamage = useCallback((enemyId: number, damage: number) => {
    console.log(`💥 Enemy ${enemyId} taking ${damage} damage`);
    setEnemies((prev) =>
      prev.map((e) => {
        if (e.id === enemyId) {
          const newHealth = Math.max(0, e.health - damage);
          console.log(`  Enemy ${enemyId} health: ${e.health} -> ${newHealth}`);
          return {
            ...e,
            health: newHealth,
            isDead: newHealth <= 0,
          };
        }
        return e;
      })
    );
  }, []); // No dependencies needed since we use functional setState

  // Export damage handler globally for projectiles
  useEffect(() => {
    (window as any).__handleEnemyDamage = handleEnemyDamage;
    return () => {
      delete (window as any).__handleEnemyDamage;
    };
  }, [handleEnemyDamage]);

  // Expose spawn function via callback
  useEffect(() => {
    if (onSpawnRequest) {
      // Pass the actual function reference, not calling it
      (window as any).__spawnEnemiesAt = spawnEnemiesAt;
    }
    return () => {
      delete (window as any).__spawnEnemiesAt;
    };
  }, [spawnEnemiesAt, onSpawnRequest]);

  // Export enemy positions for projectile collision
  // We need to get current positions from Enemy components, so we'll use a ref callback
  const enemyPositionsRef = useRef<Map<number, [number, number, number]>>(new Map());

  const updateEnemyPosition = useCallback((enemyId: number, position: [number, number, number]) => {
    enemyPositionsRef.current.set(enemyId, position);
    // Update global for projectiles
    (window as any).__enemyPositions = Array.from(enemyPositionsRef.current.entries()).map(([id, pos]) => ({
      id,
      position: pos,
    }));
  }, []);

  return (
    <>
      {enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          enemy={enemy}
          playerPosition={playerPosition}
          onDeath={handleEnemyDeath}
          onDamage={handleEnemyDamage}
          onPositionUpdate={updateEnemyPosition}
        />
      ))}
    </>
  );
}

