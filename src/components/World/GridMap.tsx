import { useStore } from '@nanostores/react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useEffect, useMemo, useRef } from 'react';
import { $brokenWalls, $currentFloor, $currentRoomId, $floorData, $roomCleared, $runSeed, $visitedRooms } from '../../stores/game';
import { $position, $teleportTo } from '../../stores/player';
import { $restartTrigger } from '../../stores/restart';
import { generateFloor, generateRoomLayout, getRoomWorldSize, gridToWorld } from '../../utils/floorGen';
import { Crate } from './Crate';
import { Door } from './Door';
import { Flower } from './Flower';
import { Grass } from './Grass';
import { Pillar } from './Pillar';
import { Pitfall } from './Pitfall';
import { Portal } from './Portal';
import { Rock } from './Rock';
import { Spikes } from './Spikes';
import { Torch } from './Torch';
import { Wall } from './Wall';

function MergedFloor({ grid, worldOffset, roomWorldSize, isVisited, isCurrentRoom }: {
  grid: number[][],
  worldOffset: [number, number, number],
  roomWorldSize: number,
  isVisited: boolean,
  isCurrentRoom: boolean
}) {
  const tileSize = roomWorldSize / grid.length;
  const halfRoomSize = roomWorldSize / 2;

  const floorPolygons = useMemo(() => {
    const rectangles: Array<{ x: number, y: number, w: number, h: number }> = [];

    // Simple greedy horizontal merging to reduce collider count
    for (let y = 0; y < grid.length; y++) {
      let currentRect: any = null;
      for (let x = 0; x < grid[y].length; x++) {
        // Tile 8 is Pit. We omit floor physics/visuals here.
        const isFloor = grid[y][x] !== 8;
        if (isFloor) {
          if (!currentRect) {
            currentRect = { x, y, w: 1, h: 1 };
          } else {
            currentRect.w++;
          }
        } else {
          if (currentRect) {
            rectangles.push(currentRect);
            currentRect = null;
          }
        }
      }
      if (currentRect) rectangles.push(currentRect);
    }
    return rectangles;
  }, [grid]);

  return (
    <group position={worldOffset}>
      {floorPolygons.map((rect, i) => (
        <RigidBody
          key={`floor-rect-${i}`}
          type="fixed"
          userData={{ isFloor: true }}
          position={[
            -halfRoomSize + rect.x * tileSize + (rect.w * tileSize) / 2,
            -0.5,
            -halfRoomSize + rect.y * tileSize + (rect.h * tileSize) / 2
          ]}
        >
          <CuboidCollider args={[(rect.w * tileSize) / 2, 0.5, (rect.h * tileSize) / 2]} />
          <mesh receiveShadow visible={isVisited}>
            <boxGeometry args={[rect.w * tileSize, 1, rect.h * tileSize]} />
            <meshStandardMaterial color={isCurrentRoom ? '#333333' : '#222222'} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}

export function GridMap() {
  const restartTrigger = useStore($restartTrigger);
  const currentFloor = useStore($currentFloor);
  const currentRoomId = useStore($currentRoomId);
  const floorData = useStore($floorData);
  const roomCleared = useStore($roomCleared);
  const playerPosition = useStore($position);
  const visitedRooms = useStore($visitedRooms);
  const brokenWalls = useStore($brokenWalls);
  const lastTransitionTime = useRef(0);

  // Generate floor layout when floor changes or restart
  useEffect(() => {
    // Get current seed directly from store
    const seed = $runSeed.get();
    const newFloorData = generateFloor(currentFloor, seed);
    $floorData.set(newFloorData);
    $currentRoomId.set(newFloorData.startRoomId);
    $visitedRooms.set(new Set([newFloorData.startRoomId])); // Start room is always visible
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
  // const currentRoom = floorData?.rooms.find(r => r.id === currentRoomId);

  // Generate all room layouts
  // Generate all room layouts
  // IMPORTANT: We pass false for isPlayerInRoom to ensure the layout is stable and doesn't change
  // when the player moves between rooms. This prevents physics bodies from being destroyed and recreated.
  const roomLayouts = useMemo(() => {
    if (!floorData) return [];

    return floorData.rooms.map(room => ({
      room,
      layout: generateRoomLayout(room, currentFloor, false, floorData.seed),
    }));
  }, [floorData, currentFloor]);

  const roomWorldSize = getRoomWorldSize();

  const handleDoorEnter = (targetRoomId: number, direction: 'north' | 'south' | 'east' | 'west') => {
    if (!floorData) return;

    // Cooldown to prevent double-triggering (500ms)
    const now = Date.now();
    if (now - lastTransitionTime.current < 500) return;
    lastTransitionTime.current = now;

    const targetRoom = floorData.rooms.find(r => r.id === targetRoomId);

    if (targetRoom) {
      // Reveal the target room when entering
      revealRoom(targetRoom.id);

      $currentRoomId.set(targetRoom.id);
      $roomCleared.set(false); // Reset room cleared for new room

      // Teleport player to new room entrance
      // Calculate position relative to the door they entered from
      // If moving North (dy=-1), we enter from South of new room
      // If moving South (dy=1), we enter from North of new room
      // If moving East (dx=1), we enter from West of new room
      // If moving West (dx=-1), we enter from East of new room

      const roomSize = roomWorldSize;
      const halfRoom = roomSize / 2;
      // Offset from center to put player near the door (but inside room)
      // Must be > ACTIVATION_DISTANCE (2.5) to avoid immediate re-trigger
      const doorOffset = halfRoom - 6.0;

      let offsetX = 0;
      let offsetZ = 0;

      switch (direction) {
        case 'north':
          // Entering from South side of new room
          offsetZ = doorOffset;
          break;
        case 'south':
          // Entering from North side of new room
          offsetZ = -doorOffset;
          break;
        case 'east':
          // Entering from West side of new room
          offsetX = -doorOffset;
          break;
        case 'west':
          // Entering from East side of new room
          offsetX = doorOffset;
          break;
      }

      const newWorldOffset: [number, number, number] = [
        targetRoom.gridX * roomWorldSize + offsetX,
        3.0, // Force safe height above floor
        targetRoom.gridY * roomWorldSize + offsetZ,
      ];

      console.log(`🚪 Teleporting Player:`, {
        reason: 'Door Entry',
        fromRoom: currentRoomId,
        toRoom: targetRoom.id,
        direction,
        offsetApplied: direction === 'north' || direction === 'south' ? offsetZ : offsetX,
        finalPos: newWorldOffset
      });

      $teleportTo.set(newWorldOffset);
    } else {
      console.error(`❌ No room found with ID ${targetRoomId}`);
    }
  };

  // Collect all unique door connections
  const doorConnections = useMemo(() => {
    if (!floorData) return [];

    const connections: Array<{
      id: string;
      roomA: any;
      roomB: any;
      position: [number, number, number];
      directionA: 'north' | 'south' | 'east' | 'west';
      directionB: 'north' | 'south' | 'east' | 'west';
    }> = [];

    const seen = new Set<string>();

    floorData.rooms.forEach(room => {
      room.doors.forEach(door => {
        const offsets = {
          north: { dx: 0, dy: -1 },
          south: { dx: 0, dy: 1 },
          east: { dx: 1, dy: 0 },
          west: { dx: -1, dy: 0 },
        };
        const offset = offsets[door.direction];
        const adjacentX = room.gridX + offset.dx;
        const adjacentY = room.gridY + offset.dy;
        const adjacentRoom = floorData.rooms.find(r => r.gridX === adjacentX && r.gridY === adjacentY);

        if (adjacentRoom) {
          const id = [room.id, adjacentRoom.id].sort((a, b) => a - b).join('-');
          if (!seen.has(id)) {
            seen.add(id);

            const halfSize = roomWorldSize / 2;
            const worldX = room.gridX * roomWorldSize;
            const worldZ = room.gridY * roomWorldSize;

            let doorX = worldX;
            let doorZ = worldZ;

            if (door.direction === 'north') doorZ -= halfSize;
            else if (door.direction === 'south') doorZ += halfSize;
            else if (door.direction === 'east') doorX += halfSize;
            else if (door.direction === 'west') doorX -= halfSize;

            connections.push({
              id,
              roomA: room,
              roomB: adjacentRoom,
              position: [doorX, 1.5, doorZ],
              directionA: door.direction,
              directionB: door.direction === 'north' ? 'south' : door.direction === 'south' ? 'north' : door.direction === 'east' ? 'west' : 'east'
            });
          }
        }
      });
    });

    return connections;
  }, [floorData, roomWorldSize]);

  if (!floorData) return null;

  return (
    <>
      {roomLayouts.map(({ room, layout }) => {
        const isCurrentRoom = room.id === currentRoomId;
        const isVisited = visitedRooms.has(room.id);

        // Optimization: Only render current room and its immediate neighbors
        const isAdjacent = doorConnections.some(conn =>
          (conn.roomA.id === currentRoomId && conn.roomB.id === room.id) ||
          (conn.roomB.id === currentRoomId && conn.roomA.id === room.id)
        );

        if (!isCurrentRoom && !isAdjacent) return null;
        return (
          <group key={room.id}>
            {/* Merged Floor: Real gaps for Pits (8) */}
            <MergedFloor
              grid={layout.grid}
              worldOffset={layout.worldOffset}
              roomWorldSize={roomWorldSize}
              isVisited={isVisited}
              isCurrentRoom={isCurrentRoom}
            />

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

            {/* Solid boundary walls - Always render physics */}
            {!room.doors.some(d => d.direction === 'north') && (
              <RigidBody
                type="fixed"
                userData={{ isWall: true, indestructible: true }}
                position={[layout.worldOffset[0], 3.5, layout.worldOffset[2] - roomWorldSize / 2]}
              >
                <CuboidCollider args={[roomWorldSize / 2, 4, 0.5]} />
                <mesh castShadow receiveShadow visible={isVisited}>
                  <boxGeometry args={[roomWorldSize, 8, 1]} />
                  <meshStandardMaterial color="#222222" />
                </mesh>
              </RigidBody>
            )}
            {!room.doors.some(d => d.direction === 'south') && (
              <RigidBody
                type="fixed"
                userData={{ isWall: true, indestructible: true }}
                position={[layout.worldOffset[0], 3.5, layout.worldOffset[2] + roomWorldSize / 2]}
              >
                <CuboidCollider args={[roomWorldSize / 2, 4, 0.5]} />
                <mesh castShadow receiveShadow visible={isVisited}>
                  <boxGeometry args={[roomWorldSize, 8, 1]} />
                  <meshStandardMaterial color="#222222" />
                </mesh>
              </RigidBody>
            )}
            {!room.doors.some(d => d.direction === 'east') && (
              <RigidBody
                type="fixed"
                userData={{ isWall: true, indestructible: true }}
                position={[layout.worldOffset[0] + roomWorldSize / 2, 3.5, layout.worldOffset[2]]}
              >
                <CuboidCollider args={[0.5, 4, roomWorldSize / 2]} />
                <mesh castShadow receiveShadow visible={isVisited}>
                  <boxGeometry args={[1, 8, roomWorldSize]} />
                  <meshStandardMaterial color="#222222" />
                </mesh>
              </RigidBody>
            )}
            {!room.doors.some(d => d.direction === 'west') && (
              <RigidBody
                type="fixed"
                userData={{ isWall: true, indestructible: true }}
                position={[layout.worldOffset[0] - roomWorldSize / 2, 3.5, layout.worldOffset[2]]}
              >
                <CuboidCollider args={[0.5, 4, roomWorldSize / 2]} />
                <mesh castShadow receiveShadow visible={isVisited}>
                  <boxGeometry args={[1, 8, roomWorldSize]} />
                  <meshStandardMaterial color="#222222" />
                </mesh>
              </RigidBody>
            )}

            {/* Internal walls and objects - ONLY if visited */}
            {isVisited && layout.grid.map((row, y) =>
              row.map((tile, x) => {
                const worldPos = gridToWorld(x, y, layout.worldOffset);

                if (tile === 1) {
                  // Wall - but check if there's a door at this position
                  const hasDoorNearby =
                    (y > 0 && (layout.grid[y - 1][x] === 5 || layout.grid[y - 1][x] === 6)) ||
                    (y < layout.grid.length - 1 && (layout.grid[y + 1][x] === 5 || layout.grid[y + 1][x] === 6)) ||
                    (x > 0 && (layout.grid[y][x - 1] === 5 || layout.grid[y][x - 1] === 6)) ||
                    (x < layout.grid[0].length - 1 && (layout.grid[y][x + 1] === 5 || layout.grid[y][x + 1] === 6));

                  if (hasDoorNearby) return null;

                  // Check if wall is broken
                  const roomBrokenWalls = brokenWalls[room.id];
                  if (roomBrokenWalls?.has(`${x},${y}`)) {
                    return null;
                  }

                  return <Wall key={`wall-${room.id}-${x}-${y}`} position={worldPos} visible={isVisited} />;
                } else if (tile === 7) {
                  // Spikes (Hazard)
                  // console.log(`⚠️ Rendering spike at ${worldPos}`); 
                  return <Spikes key={`spikes-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 8) {
                  // Pit (Falling Hazard)
                  return <Pitfall key={`pit-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 9 || tile === 11) {
                  // Rock (9: Normal, 11: Secret)
                  const isSecret = tile === 11;
                  const height = 0.5 + Math.abs(Math.sin(x * y * 123.45)) * 1.5;
                  const rockId = `${room.id}-rock-${x}-${y}`;
                  return <Rock key={`rock-${room.id}-${x}-${y}`} position={worldPos} height={height} id={rockId} type={isSecret ? 'secret' : 'normal'} />;
                } else if (tile === 10) {
                  // Crate
                  return <Crate key={`crate-${room.id}-${x}-${y}`} id={`${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 4 && roomCleared && isCurrentRoom) {
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
                } else if (tile === 12) {
                  // Grass
                  return <Grass key={`grass-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 15) {
                  // Flower
                  return <Flower key={`flower-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 16) {
                  // Mushroom
                  return <Mushroom key={`shroom-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 17) {
                  // Pebble
                  return <Pebble key={`pebble-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 13) {
                  // Pillar
                  return <Pillar key={`pillar-${room.id}-${x}-${y}`} position={worldPos} />;
                } else if (tile === 14) {
                  // Torch
                  return <Torch key={`torch-${room.id}-${x}-${y}`} position={worldPos} />;
                }
                return null;
              })
            )}
          </group>
        );
      })}

      {/* Unique Doors for connections */}
      {doorConnections.map(({ id, roomA, roomB, position, directionA, directionB }) => {
        const isA = currentRoomId === roomA.id;
        const isB = currentRoomId === roomB.id;
        const isVisited = visitedRooms.has(roomA.id) || visitedRooms.has(roomB.id);

        // Door is locked if we are in one of the rooms and it's not cleared
        const isLocked = (isA && !roomCleared) || (isB && !roomCleared);

        // Determine target room based on where the player is
        const targetRoomId = isA ? roomB.id : roomA.id;
        const transitionDirection = isA ? directionA : directionB;

        return (
          <Door
            key={`door-conn-${id}`}
            position={position}
            direction={transitionDirection}
            locked={isLocked}
            playerPosition={playerPosition}
            onEnter={() => handleDoorEnter(targetRoomId, transitionDirection)}
            visible={isVisited}
          />
        );
      })}
    </>
  );
}
