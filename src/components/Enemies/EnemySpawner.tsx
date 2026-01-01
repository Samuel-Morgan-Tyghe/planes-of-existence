
import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useRef } from 'react';
import { $clearedRooms, $currentFloor, $currentRoomId, $enemies, $enemiesAlive, $enemyPositions, $floorData, $roomCleared } from '../../stores/game';
import { $position } from '../../stores/player';
import { $restartTrigger } from '../../stores/restart';
import { $damageEvents, emitDrop, emitRoomClearLoot } from '../../systems/events';
import type { EnemyState } from '../../types/enemies';
import { ENEMY_DEFINITIONS } from '../../types/enemies';
import { generateRoomLayout, gridToWorld } from '../../utils/floorGen';
import { Enemy } from './Enemy';

export function EnemySpawner({
  onEnemyKilled,
  onSpawnRequest,
}: {
  onEnemyKilled?: (enemyId: number) => void;
  onSpawnRequest?: (position: [number, number, number], count: number) => void;
}) {
  const enemies = useStore($enemies);
  console.log(`🔍 EnemySpawner Render | totalEnemies: ${enemies.length}`);
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
        roomId: currentRoomId, // Spawned enemies belong to the current room
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
  }, [currentRoomId]); // No dependencies needed since we use functional setState and ref

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
        console.log('💀 DEBUG: Killing all enemies in current room');
        const currentEnemies = $enemies.get();
        
        const otherRoomEnemies = currentEnemies.filter(e => e.roomId !== currentRoomId);
        $enemies.set(otherRoomEnemies);
        $enemiesAlive.set(otherRoomEnemies.length);

        // Mark room as cleared - the useEffect will handle loot emission
        console.log('💀 DEBUG: Room enemies cleared via K key');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentFloor, currentRoomId]);

  // Spawn all enemies for the entire floor
  useEffect(() => {
    if (!floorData) return;

    console.log(`👹 Spawning all enemies for floor ${currentFloor}`);
    const allNewEnemies: EnemyState[] = [];
    enemyIdCounterRef.current = 0;

    floorData.rooms.forEach(room => {
      // Skip start room
      if (room.type === 'start') return;

      // Check if room is already cleared (shouldn't be on new floor, but for safety)
      const roomKey = `${currentFloor}-${room.id}`;
      if (clearedRoomsRef.current.has(roomKey)) return;

      const roomLayout = generateRoomLayout(room, currentFloor, false, floorData.seed);

      if (room.type === 'boss') {
        allNewEnemies.push({
          id: enemyIdCounterRef.current++,
          roomId: room.id,
          definition: ENEMY_DEFINITIONS.boss,
          health: ENEMY_DEFINITIONS.boss.health,
          position: [roomLayout.worldOffset[0], 0.5, roomLayout.worldOffset[2]],
          isDead: false,
        });
      } else {
        const enemyTypes = Object.values(ENEMY_DEFINITIONS).filter(e => e.id !== 'boss');
        room.enemySpawnPoints.forEach(point => {
          const [gridX, gridY] = point;
          const worldPos = gridToWorld(gridX, gridY, roomLayout.worldOffset);
          const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

          allNewEnemies.push({
            id: enemyIdCounterRef.current++,
            roomId: room.id,
            definition: randomEnemy,
            health: randomEnemy.health,
            position: [worldPos[0], worldPos[1] + 0.5, worldPos[2]],
            isDead: false,
          });
        });
      }
    });

    $enemies.set(allNewEnemies);
    $enemiesAlive.set(allNewEnemies.length);
    
    // Initialize position tracking for projectiles
    const initialPositions: Record<number, [number, number, number]> = {};
    allNewEnemies.forEach(e => {
      initialPositions[e.id] = e.position;
      enemyPositionsRef.current.set(e.id, e.position);
    });
    $enemyPositions.set(initialPositions);

    // Initial room clear check
    const currentRoom = floorData.rooms.find(r => r.id === currentRoomId);
    if (currentRoom) {
      const roomEnemies = allNewEnemies.filter(e => e.roomId === currentRoomId);
      $roomCleared.set(roomEnemies.length === 0);
    }

  }, [restartTrigger, currentFloor, floorData]);

  // Handle room changes for roomCleared state
  // Handle room changes for roomCleared state
  useEffect(() => {
    if (!floorData) return;
    
    const roomEnemies = enemies.filter(e => e.roomId === currentRoomId && !e.isDead);
    const roomKey = `${currentFloor}-${currentRoomId}`;
    const isCleared = roomEnemies.length === 0;
    
    console.log(`🔍 EnemySpawner Effect | Room: ${currentRoomId} | Total: ${enemies.length} | InRoom: ${roomEnemies.length} | isCleared: ${isCleared}`);
    
    $roomCleared.set(isCleared);
    
    if (isCleared && !clearedRoomsRef.current.has(roomKey)) {
      console.log(`✨ Room ${currentRoomId} cleared for the first time!`);
      clearedRoomsRef.current.add(roomKey);
      const newClearedRooms = new Set($clearedRooms.get());
      newClearedRooms.add(currentRoomId);
      $clearedRooms.set(newClearedRooms);

      // Trigger room clear loot for any room except start
      const room = floorData.rooms.find(r => r.id === currentRoomId);
      if (room && room.type !== 'start') {
        const layout = generateRoomLayout(room, currentFloor, false, floorData.seed);
        const centerPos = gridToWorld(10, 10, layout.worldOffset);
        console.log(`🎁 Emitting room clear loot for room ${currentRoomId} (type: ${room.type}) at ${centerPos}`);
        emitRoomClearLoot(centerPos, currentRoomId, room.type);
      }
    } else if (!isCleared && clearedRoomsRef.current.has(roomKey)) {
      // If enemies are spawned in a cleared room, it's no longer cleared
      console.log(`⚠️ Room ${currentRoomId} is no longer cleared!`);
      clearedRoomsRef.current.delete(roomKey);
      const newClearedRooms = new Set($clearedRooms.get());
      newClearedRooms.delete(currentRoomId);
      $clearedRooms.set(newClearedRooms);
    }
  }, [currentRoomId, enemies, currentFloor, floorData]);

  const handleEnemyDeath = (enemyId: number) => {
    const currentEnemies = $enemies.get();
    const dyingEnemy = currentEnemies.find((e) => e.id === enemyId);
    if (!dyingEnemy) return;

    const enemyPosition = dyingEnemy.position;
    const roomId = dyingEnemy.roomId;

    const newEnemies = currentEnemies.filter((e) => e.id !== enemyId);
    $enemies.set(newEnemies);

    // Update global enemy count
    $enemiesAlive.set(newEnemies.length);

    // Check if the room this enemy belonged to is now clear
    const remainingInRoom = newEnemies.filter(e => e.roomId === roomId);
    if (remainingInRoom.length === 0) {
      // The useEffect will handle marking room as cleared and emitting loot
      console.log(`� Room ${roomId} enemies defeated!`);
    }

    // Trigger drop roll
    emitDrop(enemyPosition, roomId);

    onEnemyKilled?.(enemyId);
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

    // Update global for projectiles - ONLY include enemies in current room
    const currentEnemies = $enemies.get();
    const positions: Record<number, [number, number, number]> = {};
    
    enemyPositionsRef.current.forEach((pos, id) => {
      const enemy = currentEnemies.find(e => e.id === id);
      if (enemy && enemy.roomId === currentRoomId && !enemy.isDead) {
        positions[id] = pos;
      }
    });
    
    $enemyPositions.set(positions);
  }, [currentRoomId]);

  return (
    <>
      {enemies.map((enemy) => {
        const isActive = enemy.roomId === currentRoomId;
        // Log for every enemy on every render (temporarily)
        console.log(`🔍 EnemySpawner Map | Enemy ${enemy.id} | roomId: ${enemy.roomId} (${typeof enemy.roomId}) | currentRoomId: ${currentRoomId} (${typeof currentRoomId}) | isActive: ${isActive}`);
        
        return (
          <Enemy
            key={`${currentFloor}-${enemy.id}`}
            enemy={enemy}
            active={isActive}
            playerPosition={playerPosition}
            onDeath={handleEnemyDeath}
            onPositionUpdate={updateEnemyPosition}
          />
        );
      })}
    </>
  );
}

