
import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useRef } from 'react';
import { $clearedRooms, $currentFloor, $currentRoomId, $enemies, $enemiesAlive, $floorData, $roomCleared } from '../../stores/game';
import { $position } from '../../stores/player';
import { $restartTrigger } from '../../stores/restart';
import { $damageEvents, emitDrop } from '../../systems/events';
import type { EnemyState } from '../../types/enemies';
import { ENEMY_DEFINITIONS } from '../../types/enemies';
import { generateRoomLayout, gridToWorld } from '../../utils/floorGen';
import { Enemy } from './Enemy';

export function EnemySpawner({
  onEnemyKilled,
  onSpawnRequest,
}: {
  onEnemyKilled: (enemyId: number) => void;
  onSpawnRequest?: (position: [number, number, number], count: number) => void;
}) {
  const enemies = useStore($enemies);
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
    const prev = $enemies.get();
    const combined = [...prev, ...newEnemies];
    $enemies.set(combined);
    $enemiesAlive.set(combined.length);
    $roomCleared.set(false); // Room no longer cleared
  }, []); // No dependencies needed since we use functional setState and ref

  // Reset cleared rooms when restart or floor changes
  useEffect(() => {
    clearedRoomsRef.current = new Set();
    enemyIdCounterRef.current = 0; // Reset ID counter for new floor
    console.log('🔄 Cleared rooms reset');
  }, [restartTrigger, currentFloor]);

  // DEBUG: Kill all enemies with 'K' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'k' || e.key === 'K') {
        console.log('💀 DEBUG: Killing all enemies in room');
        $enemies.set([]);
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
    console.log(`\n👹 Room changed to ${currentRoomId} on floor ${currentFloor}`);

    // Clear enemy positions map when room changes
    enemyPositionsRef.current.clear();
    (window as any).__enemyPositions = [];

    if (!floorData) return;

    const currentRoom = floorData.rooms.find(r => r.id === currentRoomId);
    if (!currentRoom) return;

    // Check if this room has been cleared
    const roomKey = `${currentFloor}-${currentRoomId}`;
    const isCleared = clearedRoomsRef.current.has(roomKey);

    // If room is cleared, don't spawn enemies
    if (isCleared) {
      $enemies.set([]);
      $enemiesAlive.set(0);
      $roomCleared.set(true);
      return;
    }

    // Generate room layout (this will calculate enemy spawn points if not already calculated)
    const roomLayout = generateRoomLayout(currentRoom, currentFloor, true);
    const newEnemies: EnemyState[] = [];
    // Don't reset ID counter to ensure unique keys and force component remounts
    // enemyIdCounterRef.current = 0;

    // Spawn enemies
    if (currentRoom.type === 'boss') {
      // Spawn Boss
      console.log('👹 Spawning BOSS!');
      newEnemies.push({
        id: enemyIdCounterRef.current++,
        definition: ENEMY_DEFINITIONS.boss,
        health: ENEMY_DEFINITIONS.boss.health,
        position: [roomLayout.worldOffset[0], 0.5, roomLayout.worldOffset[2]], // Center of room
        isDead: false,
      });
    } else {
      // Spawn normal enemies at pre-calculated positions
      const enemyTypes = Object.values(ENEMY_DEFINITIONS).filter(e => e.id !== 'boss');
      
      currentRoom.enemySpawnPoints.forEach((point, index) => {
        const [gridX, gridY] = point;
        
        // Double check this is not a wall (1) or door (5, 6)
        const tile = roomLayout.grid[gridY]?.[gridX];
        if (tile === 1 || tile === 5 || tile === 6) {
            console.warn(`⚠️ Skipping enemy spawn at ${gridX},${gridY} (Tile: ${tile})`);
            return;
        }

        const worldPos = gridToWorld(gridX, gridY, roomLayout.worldOffset);
        const [worldX, worldY, worldZ] = worldPos;

        const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Delay each spawn by 200ms * index
        setTimeout(() => {
            // Check if room is still current (user didn't leave)
            if ($currentRoomId.get() !== currentRoomId) return;
            
            const enemy: EnemyState = {
              id: enemyIdCounterRef.current++,
              definition: randomEnemy,
              health: randomEnemy.health,
              position: [worldX, worldY + 0.5, worldZ],
              isDead: false,
            };
            
            console.log(`👹 Spawning enemy ${enemy.id} at`, enemy.position);
            
            // Add to store
            const currentEnemies = $enemies.get();
            $enemies.set([...currentEnemies, enemy]);
            $enemiesAlive.set(currentEnemies.length + 1);
            
        }, index * 300); // 300ms delay between spawns
      });
    }

    // Initial count is 0, will increase as they spawn
    // But we need to prevent room clear trigger until they are all spawned?
    // Actually, if we set roomCleared to false initially, it should be fine.
    // But if we have 0 enemies initially, the check in this effect might mark it cleared.
    
    // Let's set roomCleared to false explicitly
    $roomCleared.set(false);
    
    // We can't use the immediate check for 0 enemies anymore since they spawn async.
    // But we know how many WILL spawn.
    
    // If there are NO spawn points, then we can clear immediately.
    if (currentRoom.type !== 'boss' && currentRoom.enemySpawnPoints.length === 0) {
       clearedRoomsRef.current.add(roomKey);
       const newClearedRooms = new Set($clearedRooms.get());
       newClearedRooms.add(currentRoomId);
       $clearedRooms.set(newClearedRooms);
       $roomCleared.set(true);
    }

    // console.log(`👹 Spawned ${newEnemies.length} enemies in room ${currentRoomId}`);
    // newEnemies.forEach(e => console.log(`  - Enemy ${e.id} (${e.definition.id}) at`, e.position));
    
    // For boss, we still spawn immediately
    if (newEnemies.length > 0) {
        $enemies.set(newEnemies);
        $enemiesAlive.set(newEnemies.length);
    }
    
  }, [restartTrigger, currentFloor, currentRoomId, floorData]);

  const handleEnemyDeath = (enemyId: number) => {
    // Get enemy position before removing it
    const currentEnemies = $enemies.get();
    const dyingEnemy = currentEnemies.find((e) => e.id === enemyId);
    const enemyPosition = dyingEnemy?.position || [0, 0, 0];

    const newEnemies = currentEnemies.filter((e) => e.id !== enemyId);
    const aliveCount = newEnemies.length;

    $enemies.set(newEnemies);

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

    // Trigger drop roll
    emitDrop(enemyPosition);

    onEnemyKilled(enemyId);
  };

  const handleEnemyDamage = useCallback((enemyId: number, damage: number) => {
    console.log(`💥 Enemy ${enemyId} taking ${damage} damage`);
    const currentEnemies = $enemies.get();
    const updatedEnemies = currentEnemies.map((e) => {
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
    });
    $enemies.set(updatedEnemies);
  }, []);

  // Listen for damage events
  useEffect(() => {
    const unsubscribe = $damageEvents.subscribe((event) => {
      if (event) {

        handleEnemyDamage(event.enemyId, event.damage);
      }
    });
    return () => unsubscribe();
  }, [handleEnemyDamage, currentRoomId]);

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
    const positions = Array.from(enemyPositionsRef.current.entries()).map(([id, pos]) => ({
      id,
      position: pos,
    }));
    (window as any).__enemyPositions = positions;
    // console.log(`📍 Updated enemy positions: ${positions.length} enemies tracked`);
  }, []);

  return (
    <>
      {enemies.map((enemy) => (
        <Enemy
          key={enemy.id}
          enemy={enemy}
          playerPosition={playerPosition}
          onDeath={handleEnemyDeath}
          onPositionUpdate={updateEnemyPosition}
        />
      ))}
    </>
  );
}

