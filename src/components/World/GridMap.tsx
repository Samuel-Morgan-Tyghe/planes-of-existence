import { useMemo, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { generateFloor, generateRoomLayout, gridToWorld, getRoomWorldSize } from '../../utils/floorGen';
import { Wall } from './Wall';
import { Portal } from './Portal';
import { Door } from './Door';
import { RigidBody } from '@react-three/rapier';
import { $restartTrigger } from '../../stores/restart';
import { $currentFloor, $currentRoomId, $floorData, $roomCleared, $visitedRooms, $clearedRooms } from '../../stores/game';
import { $position } from '../../stores/player';
import type { Room } from '../../types/room';

const ROOM_SIZE = 20; // Must match floorGen.ts

export function GridMap() {
  const restartTrigger = useStore($restartTrigger);
  const currentFloor = useStore($currentFloor);
  const currentRoomId = useStore($currentRoomId);
  const floorData = useStore($floorData);
  const roomCleared = useStore($roomCleared);
  const playerPosition = useStore($position);
  const visitedRooms = useStore($visitedRooms);
  const clearedRooms = useStore($clearedRooms);

  // Generate floor layout when floor changes or restart
  useEffect(() => {
    const newFloorData = generateFloor(currentFloor);
    $floorData.set(newFloorData);
    $currentRoomId.set(newFloorData.startRoomId);
    $visitedRooms.set(new Set([newFloorData.startRoomId])); // Start room is always visible
    $clearedRooms.set(new Set()); // Reset cleared rooms for new floor
  }, [currentFloor, restartTrigger]);

  // Mark current room as visited
  useEffect(() => {
    if (!floorData) return;

    const newVisited = new Set(visitedRooms);
    newVisited.add(currentRoomId);

    if (newVisited.size !== visitedRooms.size) {
      $visitedRooms.set(newVisited);
    }
  }, [currentRoomId, floorData, visitedRooms]);

  // Helper to reveal a room
  const revealRoom = (roomId: number) => {
    if (!visitedRooms.has(roomId)) {
      const newVisited = new Set(visitedRooms);
      newVisited.add(roomId);
      $visitedRooms.set(newVisited);
      console.log(`👁️ Revealed room ${roomId}`);
    }
  };

  // Get current room from floor data
  const currentRoom = floorData?.rooms.find(r => r.id === currentRoomId);

  // Generate all room layouts
  const roomLayouts = useMemo(() => {
    if (!floorData) return [];

    return floorData.rooms.map(room => ({
      room,
      layout: generateRoomLayout(room, currentFloor, room.id === currentRoomId),
    }));
  }, [floorData, currentFloor, currentRoomId]);

  if (!floorData || !currentRoom) return null;

  const roomWorldSize = getRoomWorldSize();

  const handleDoorEnter = (direction: 'north' | 'south' | 'east' | 'west') => {
    if (!currentRoom) return;

    console.log(`🚪 handleDoorEnter called from room ${currentRoomId} (grid: ${currentRoom.gridX}, ${currentRoom.gridY}), direction: ${direction}`);
    console.log(`  Current room has doors:`, currentRoom.doors);

    // Find the room in that direction
    const offsets = {
      north: { dx: 0, dy: -1 },
      south: { dx: 0, dy: 1 },
      east: { dx: 1, dy: 0 },
      west: { dx: -1, dy: 0 },
    };

    const offset = offsets[direction];
    const targetX = currentRoom.gridX + offset.dx;
    const targetY = currentRoom.gridY + offset.dy;

    console.log(`  Looking for room at grid position (${targetX}, ${targetY})`);
    console.log(`  All rooms:`, floorData.rooms.map(r => `Room ${r.id}: (${r.gridX}, ${r.gridY})`));

    const targetRoom = floorData.rooms.find(r => r.gridX === targetX && r.gridY === targetY);

    if (targetRoom) {
      console.log(`🚪 Moving from room ${currentRoomId} to room ${targetRoom.id}`);

      // Reveal the target room when entering
      revealRoom(targetRoom.id);

      $currentRoomId.set(targetRoom.id);
      $roomCleared.set(false); // Reset room cleared for new room

      // Teleport player to new room entrance
      const newWorldOffset: [number, number, number] = [
        targetRoom.gridX * roomWorldSize,
        playerPosition[1],
        targetRoom.gridY * roomWorldSize,
      ];
      $position.set(newWorldOffset);
    } else {
      console.error(`❌ No room found at grid position (${targetX}, ${targetY})`);
      console.error(`   Current room doors should only be: ${currentRoom.doors.map(d => d.direction).join(', ')}`);
    }
  };

  // No longer reveal rooms when near doors - only when passing through
  // const handleDoorNear = ... (removed)

  // Helper to check if a room is adjacent to current room
  const isAdjacentToCurrentRoom = (room: Room): boolean => {
    if (!currentRoom) return false;
    const dx = Math.abs(room.gridX - currentRoom.gridX);
    const dy = Math.abs(room.gridY - currentRoom.gridY);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  };

  // Helper to check if both rooms in a connection are cleared
  const areRoomsCleared = (roomId1: number, roomId2: number): boolean => {
    return clearedRooms.has(roomId1) && clearedRooms.has(roomId2);
  };

  return (
    <>
      {roomLayouts.map(({ room, layout }) => {
        const isCurrentRoom = room.id === currentRoomId;
        const isVisited = visitedRooms.has(room.id);

        // Only render current room and adjacent visited rooms
        const shouldRender = isCurrentRoom || (isVisited && isAdjacentToCurrentRoom(room));

        if (!shouldRender) return null;

        return (
          <group key={room.id}>
            {/* Floor for this room */}
            <RigidBody type="fixed" colliders="cuboid" collisionGroups={0x00010001}>
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[layout.worldOffset[0], -0.5, layout.worldOffset[2]]}
                receiveShadow
              >
                <planeGeometry args={[roomWorldSize, roomWorldSize]} />
                <meshStandardMaterial
                  color={isCurrentRoom ? '#333333' : '#222222'}
                  visible={isVisited}
                />
              </mesh>
            </RigidBody>

            {/* Fog of war - black overlay for unvisited rooms */}
            {!isVisited && (
              <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[layout.worldOffset[0], 0, layout.worldOffset[2]]}
              >
                <planeGeometry args={[roomWorldSize, roomWorldSize]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            )}

            {/* Solid boundary walls on edges where there's no door - only visible if room is visited */}
            {isVisited && (
              <>
                {/* North wall */}
                {!room.doors.some(d => d.direction === 'north') && (
                  <RigidBody type="fixed" colliders="cuboid" collisionGroups={0x00010001} userData={{ isWall: true, indestructible: true }}>
                    <mesh position={[layout.worldOffset[0], 2, layout.worldOffset[2] - roomWorldSize / 2]} castShadow receiveShadow>
                      <boxGeometry args={[roomWorldSize, 4, 1]} />
                      <meshStandardMaterial color="#444444" />
                    </mesh>
                  </RigidBody>
                )}
                {/* South wall */}
                {!room.doors.some(d => d.direction === 'south') && (
                  <RigidBody type="fixed" colliders="cuboid" collisionGroups={0x00010001} userData={{ isWall: true, indestructible: true }}>
                    <mesh position={[layout.worldOffset[0], 2, layout.worldOffset[2] + roomWorldSize / 2]} castShadow receiveShadow>
                      <boxGeometry args={[roomWorldSize, 4, 1]} />
                      <meshStandardMaterial color="#444444" />
                    </mesh>
                  </RigidBody>
                )}
                {/* East wall */}
                {!room.doors.some(d => d.direction === 'east') && (
                  <RigidBody type="fixed" colliders="cuboid" collisionGroups={0x00010001} userData={{ isWall: true, indestructible: true }}>
                    <mesh position={[layout.worldOffset[0] + roomWorldSize / 2, 2, layout.worldOffset[2]]} castShadow receiveShadow>
                      <boxGeometry args={[1, 4, roomWorldSize]} />
                      <meshStandardMaterial color="#444444" />
                    </mesh>
                  </RigidBody>
                )}
                {/* West wall */}
                {!room.doors.some(d => d.direction === 'west') && (
                  <RigidBody type="fixed" colliders="cuboid" collisionGroups={0x00010001} userData={{ isWall: true, indestructible: true }}>
                    <mesh position={[layout.worldOffset[0] - roomWorldSize / 2, 2, layout.worldOffset[2]]} castShadow receiveShadow>
                      <boxGeometry args={[1, 4, roomWorldSize]} />
                      <meshStandardMaterial color="#444444" />
                    </mesh>
                  </RigidBody>
                )}
              </>
            )}

            {/* Walls and objects - only render if room is visited */}
            {isVisited && layout.grid.map((row, y) =>
              row.map((tile, x) => {
                const worldPos = gridToWorld(x, y, layout.worldOffset);

                if (tile === 1) {
                  // Wall - but check if there's a door at this position
                  // Don't render walls where doors are (check adjacent tiles for door markers)
                  const hasDoorNearby =
                    (y > 0 && (layout.grid[y-1][x] === 5 || layout.grid[y-1][x] === 6)) ||
                    (y < layout.grid.length - 1 && (layout.grid[y+1][x] === 5 || layout.grid[y+1][x] === 6)) ||
                    (x > 0 && (layout.grid[y][x-1] === 5 || layout.grid[y][x-1] === 6)) ||
                    (x < layout.grid[0].length - 1 && (layout.grid[y][x+1] === 5 || layout.grid[y][x+1] === 6));

                  // Don't render if near a door
                  if (hasDoorNearby) return null;

                  return <Wall key={`wall-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 4 && roomCleared && isCurrentRoom) {
                  // Exit portal (only in exit room, only when cleared, only when in current room)
                  return (
                    <Portal
                      key={`portal-${room.id}-${x}-${y}`}
                      position={worldPos}
                      playerPosition={playerPosition}
                      onEnter={() => {
                        console.log(`🌀 Advancing to next floor!`);
                        $currentFloor.set(currentFloor + 1);
                      }}
                    />
                  );
                } else if (tile === 5 || tile === 6) {
                  // Door (open or locked)
                  // Determine direction by position in grid
                  let doorDirection: 'north' | 'south' | 'east' | 'west' = 'north';
                  if (y === 0) doorDirection = 'north';
                  else if (y === layout.grid.length - 1) doorDirection = 'south';
                  else if (x === layout.grid[0].length - 1) doorDirection = 'east';
                  else if (x === 0) doorDirection = 'west';

                  // IMPORTANT: Only render door if it's actually defined in the room's door array
                  const doorExists = room.doors.some(d => d.direction === doorDirection);
                  if (!doorExists) {
                    // This tile is a door marker but the room doesn't have a door in this direction
                    // This shouldn't happen, but skip rendering if it does
                    return null;
                  }

                  // Check if there's an adjacent room in this direction
                  const offsets = {
                    north: { dx: 0, dy: -1 },
                    south: { dx: 0, dy: 1 },
                    east: { dx: 1, dy: 0 },
                    west: { dx: -1, dy: 0 },
                  };
                  const offset = offsets[doorDirection];
                  const adjacentX = room.gridX + offset.dx;
                  const adjacentY = room.gridY + offset.dy;
                  const adjacentRoom = floorData.rooms.find(r => r.gridX === adjacentX && r.gridY === adjacentY);

                  // Only render door if there's an adjacent room
                  if (adjacentRoom) {
                    // ONLY render doors for the CURRENT room to avoid confusion
                    // Each room renders only its own doors
                    const shouldRenderFromThisRoom = isCurrentRoom;

                    if (shouldRenderFromThisRoom) {
                      // Check if both connecting rooms are cleared - if so, don't render door
                      const bothRoomsCleared = areRoomsCleared(room.id, adjacentRoom.id);

                      if (bothRoomsCleared) {
                        return null; // Door disappears between cleared rooms
                      }

                      // Lock door if current room has enemies alive (only if this door is in the current room)
                      const isDoorLocked = isCurrentRoom && !roomCleared;

                      return (
                        <Door
                          key={`door-${room.id}-${doorDirection}`}
                          position={worldPos}
                          direction={doorDirection}
                          locked={isDoorLocked}
                          playerPosition={playerPosition}
                          onEnter={() => handleDoorEnter(doorDirection)}
                        />
                      );
                    }
                  }
                  return null;
                }
                return null;
              })
            )}

          </group>
        );
      })}
    </>
  );
}
