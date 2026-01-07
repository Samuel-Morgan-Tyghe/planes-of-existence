
import { useStore } from '@nanostores/react';
import { useCallback, useEffect, useRef } from 'react';
import { calculateGrowthStats } from '../../logic/growthLogic';
import { $bossAlive, $bossEnemy, $clearedRooms, $currentFloor, $currentRoomId, $enemies, $enemiesAlive, $enemyPositions, $floorData, $roomCleared } from '../../stores/game';
import { $position } from '../../stores/player';
import { $restartTrigger } from '../../stores/restart';
import { $corruptionEvents, $damageEvents, emitDrop, emitRoomClearLoot } from '../../systems/events';
import type { EnemyState } from '../../types/enemies';
import { BOSS_DEFINITIONS, ENEMY_DEFINITIONS } from '../../types/enemies';
import { ITEM_DEFINITIONS } from '../../types/items';
import { generateRoomLayout, gridToWorld } from '../../utils/floorGen';
import Enemy from './Enemy';

export function EnemySpawner({
  onEnemyKilled,
  onSpawnRequest,
}: {
  onEnemyKilled?: (enemyId: number) => void;
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
        roomId: currentRoomId, // Spawned enemies belong to the current room
        definition: randomEnemy,
        health: randomEnemy.health,
        position: [position[0] + offsetX, position[1], position[2] + offsetZ],
        isDead: false,
        spawnTime: Date.now(),
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
        // Don't spawn boss enemies here - they'll be spawned when player enters boss room
        return;
      } else {
        const enemyTypes = Object.values(ENEMY_DEFINITIONS).filter(e => e.id !== 'boss' && e.id !== 'weaver');
        room.enemySpawnPoints.forEach(point => {
          const [gridX, gridY] = point;
          const worldPos = gridToWorld(gridX, gridY, roomLayout.worldOffset);
          const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

          // Glitchers have a chance to hold a random item
          let heldItem: string | undefined;
          if (randomEnemy.id === 'glitch_basic') {
            const itemIds = Object.keys(ITEM_DEFINITIONS);
            heldItem = itemIds[Math.floor(Math.random() * itemIds.length)];
          }

          allNewEnemies.push({
            id: enemyIdCounterRef.current++,
            roomId: room.id,
            definition: randomEnemy,
            health: randomEnemy.health,
            position: [worldPos[0], worldPos[1] + 0.5, worldPos[2]],
            isDead: false,
            heldItem,
            spawnTime: Date.now(),
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
    
    // Check if boss is alive in this room
    const bossInRoom = $bossEnemy.get()?.roomId === currentRoomId;
    const bossAlive = $bossAlive.get();
    
    // Check if this is a boss room
    const currentRoom = floorData.rooms.find(r => r.id === currentRoomId);
    const isBossRoom = currentRoom?.type === 'boss';
    
    // Room is cleared only if no regular enemies AND no boss (or boss is dead)
    // IMPORTANT: Don't auto-clear boss rooms until boss has spawned and been defeated
    const isCleared = roomEnemies.length === 0 && (!bossInRoom || !bossAlive) && (!isBossRoom || bossInRoom);
    
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

  // Spawn boss when entering boss room
  useEffect(() => {
    if (!floorData) return;

    
    const currentRoom = floorData.rooms.find(r => r.id === currentRoomId);
    if (!currentRoom || currentRoom.type !== 'boss') return;
    
    // Check if boss already exists
    const bossExists = $bossEnemy.get() !== null && $bossEnemy.get()?.roomId === currentRoomId;
    if (bossExists) return;
    
    
    // Check if room was already cleared
    const roomKey = `${currentFloor}-${currentRoomId}`;
    if (clearedRoomsRef.current.has(roomKey)) return;
    
    
    const roomLayout = generateRoomLayout(currentRoom, currentFloor, false, floorData.seed);
    
    // Select random boss
    const bossKeys = Object.keys(BOSS_DEFINITIONS);
    const randomBossKey = bossKeys[Math.floor(Math.random() * bossKeys.length)];
    const bossDef = BOSS_DEFINITIONS[randomBossKey as keyof typeof BOSS_DEFINITIONS];
    
    const bossEnemy: EnemyState = {
      id: enemyIdCounterRef.current++,
      roomId: currentRoomId,
      definition: bossDef,
      health: bossDef.health,
      position: [roomLayout.worldOffset[0], 0.5, roomLayout.worldOffset[2]],
      isDead: false,
      spawnTime: Date.now(),
    };
    
    // Set boss in dedicated boss state
    $bossEnemy.set(bossEnemy);
    $bossAlive.set(true);
    $roomCleared.set(false);
  }, [currentRoomId, floorData, currentFloor]);

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
    // 10% chance to drop the held item if it exists
    const dropItem = dyingEnemy.heldItem && Math.random() < 0.1 ? dyingEnemy.heldItem : undefined;
    emitDrop(enemyPosition, roomId, dropItem);

    onEnemyKilled?.(enemyId);
  };

  const handleEnemyDamage = useCallback((enemyId: number, rawDamage: number) => {
    // Check if this is the boss
    const boss = $bossEnemy.get();
    if (boss && boss.id === enemyId) {
      const newHealth = Math.max(0, boss.health - rawDamage);
      console.log(`💥 Boss ${enemyId} taking ${rawDamage} damage: ${boss.health} -> ${newHealth}`);
      $bossEnemy.set({
        ...boss,
        health: newHealth,
        isDead: newHealth <= 0,
      });
      if (newHealth <= 0) {
        $bossAlive.set(false);
      }
      return;
    }
    
    // Regular enemy damage
    const currentEnemies = $enemies.get();
    const updatedEnemies = currentEnemies.map((e) => {
      if (e.id === enemyId) {
        let appliedDamage = rawDamage;

        // Apply Growth Bug defense multiplier
        if (e.definition.id.startsWith('growth_') && e.spawnTime) {
           const timeAlive = (Date.now() - e.spawnTime) / 1000;
           const { healthMultiplier } = calculateGrowthStats(
             e.definition.id,
             timeAlive, 
             e.definition.size,
             e.definition.speed,
             e.definition.damage
           );
           appliedDamage = rawDamage / healthMultiplier;
           console.log(`🛡️ Growth Bug Mitigation: ${rawDamage} -> ${appliedDamage.toFixed(2)} (x${healthMultiplier.toFixed(1)})`);
        }

        const newHealth = Math.max(0, e.health - appliedDamage);
        // console.log(`  Enemy ${enemyId} health: ${e.health} -> ${newHealth}`);
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

  const handleCorruption = useCallback((targetId: number) => {
    console.log(`🟣 Corrupting enemy ${targetId}!`);
    const currentEnemies = $enemies.get();
    const updatedEnemies = currentEnemies.map((e) => {
      if (e.id === targetId) {
        // Buff Stats
        const newHealth = e.definition.health * 2; // Heal to double max health
        
        // Mutate definition for this instance (shallow copy to avoid affecting others)
        // Note: In a real ECS we'd have components, but here we hack the definition or state
        // To make it persistent without deep rework, we'll store overrides in a new property if we had one,
        // but for now let's just use the `isCorrupted` flag in Enemy.tsx to scale things or hack definition here.
        // Actually, let's create a mutated definition.
        const mutatedDefinition = {
          ...e.definition,
          damage: e.definition.damage * 1.5,
          speed: e.definition.speed * 1.2,
          color: '#800080', // Purple
          size: e.definition.size * 1.3, // Grow
        };

        return {
          ...e,
          health: newHealth,
          definition: mutatedDefinition,
          isCorrupted: true,
        };
      }
      return e;
    });
    $enemies.set(updatedEnemies);
  }, []);

  // Listen for damage events
  // Listen for damage and corruption events
  useEffect(() => {
    const unsubDamage = $damageEvents.subscribe((event) => {
      if (event) handleEnemyDamage(event.enemyId, event.damage);
    });
    const unsubCorruption = $corruptionEvents.subscribe((event) => {
      if (event) handleCorruption(event.targetId);
    });
    return () => {
      unsubDamage();
      unsubCorruption();
    };
  }, [handleEnemyDamage, handleCorruption, currentRoomId]);

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

