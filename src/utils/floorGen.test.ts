import { describe, expect, it } from 'vitest';
import { generateFloor, generateRoomLayout } from './floorGen';

describe('Map Generation', () => {
  it('should generate deterministic floors with the same seed', () => {
    const seed = 12345;
    const floor1 = generateFloor(1, seed);
    const floor2 = generateFloor(1, seed);

    expect(floor1.rooms.length).toBe(floor2.rooms.length);
    expect(floor1.startRoomId).toBe(floor2.startRoomId);
    expect(floor1.exitRoomId).toBe(floor2.exitRoomId);
    
    // Check room positions match
    floor1.rooms.forEach((room, index) => {
      const room2 = floor2.rooms[index];
      expect(room.gridX).toBe(room2.gridX);
      expect(room.gridY).toBe(room2.gridY);
      expect(room.type).toBe(room2.type);
      expect(room.enemyCount).toBe(room2.enemyCount);
    });
  });

  it('should generate different floors with different seeds', () => {
    const floor1 = generateFloor(1, 11111);
    const floor2 = generateFloor(1, 99999);

    // It's statistically very unlikely they will be identical
    // We can check room count or positions
    const identical = floor1.rooms.length === floor2.rooms.length &&
                      floor1.rooms.every((r, i) => 
                        r.gridX === floor2.rooms[i]?.gridX && 
                        r.gridY === floor2.rooms[i]?.gridY
                      );
    
    expect(identical).toBe(false);
  });

  it('should generate a valid start and exit room', () => {
    const floor = generateFloor(1, 12345);
    
    const startRoom = floor.rooms.find(r => r.id === floor.startRoomId);
    const exitRoom = floor.rooms.find(r => r.id === floor.exitRoomId);

    expect(startRoom).toBeDefined();
    expect(startRoom?.type).toBe('start');
    expect(startRoom?.enemyCount).toBe(0); // Start room has no enemies

    expect(exitRoom).toBeDefined();
    expect(exitRoom?.type).toBe('boss');
    // Exit room should be furthest
    expect(exitRoom?.distanceFromStart).toBeGreaterThan(0);
  });

  it('should generate walls and doors correctly', () => {
    const seed = 12345;
    const floor = generateFloor(1, seed);
    const room = floor.rooms[1]; // Pick a normal room
    
    // Generate layout
    const layout = generateRoomLayout(room, 1, false, seed + room.id * 67890);
    
    // Check grid dimensions
    expect(layout.grid.length).toBe(20);
    expect(layout.grid[0].length).toBe(20);

    // Check for walls (1)
    let hasWalls = false;
    for(let y=0; y<20; y++) {
        for(let x=0; x<20; x++) {
            if(layout.grid[y][x] === 1) hasWalls = true;
        }
    }
    expect(hasWalls).toBe(true);

    // Check for doors (5 or 6)
    // The room should have doors corresponding to its connections
    room.doors.forEach(door => {
        // We can't easily check exact coordinates without duplicating logic, 
        // but we can check if there are ANY door tiles
        let hasDoorTiles = false;
        for(let y=0; y<20; y++) {
            for(let x=0; x<20; x++) {
                if(layout.grid[y][x] === 5 || layout.grid[y][x] === 6) hasDoorTiles = true;
            }
        }
        expect(hasDoorTiles).toBe(true);
    });
  });

  it('should generate enemies', () => {
    const seed = 12345;
    const floor = generateFloor(1, seed);
    
    // Find a room with enemies
    const enemyRoom = floor.rooms.find(r => r.enemyCount > 0);
    expect(enemyRoom).toBeDefined();

    if (enemyRoom) {
        expect(enemyRoom.enemySpawnPoints.length).toBeGreaterThan(0);
        expect(enemyRoom.enemySpawnPoints.length).toBe(enemyRoom.enemyCount);
        
        // Check spawn points are valid (not walls)
        const layout = generateRoomLayout(enemyRoom, 1, false, seed + enemyRoom.id * 67890);
        enemyRoom.enemySpawnPoints.forEach(([x, y]) => {
            // In the layout, spawn points might be marked as 2 (debug) or 0 (floor)
            // But they definitely shouldn't be 1 (wall)
            expect(layout.grid[y][x]).not.toBe(1);
        });
    }
  });

  it('should generate loot', () => {
    const seed = 12345;
    const floor = generateFloor(1, seed);
    const room = floor.rooms[0]; // Start room usually doesn't have loot, but let's check a normal room
    
    // Loot is generated in generateRoomLayout
    // We need to check multiple rooms to find one with loot
    let foundLoot = false;
    
    for (const r of floor.rooms) {
        const layout = generateRoomLayout(r, 1, false, seed + r.id * 67890);
        for(let y=0; y<20; y++) {
            for(let x=0; x<20; x++) {
                if(layout.grid[y][x] === 3) {
                    foundLoot = true;
                    break;
                }
            }
            if(foundLoot) break;
        }
        if(foundLoot) break;
    }
    
    // With enough rooms and loot probability, we should find some
    // Note: Loot generation in generateRoomLayout is deterministic based on seed
    // "const lootSpawns = 2 + Math.floor(floorNumber / 3);" -> Always at least 2 loot spawns per room?
    // Wait, let's check the code.
    // Yes: "const lootSpawns = 2 + Math.floor(floorNumber / 3);"
    // So EVERY room should have loot?
    expect(foundLoot).toBe(true);
  });

  it('should place exit portal in boss room', () => {
    const seed = 12345;
    const floor = generateFloor(1, seed);
    const bossRoom = floor.rooms.find(r => r.id === floor.exitRoomId);
    
    expect(bossRoom).toBeDefined();
    if (bossRoom) {
        const layout = generateRoomLayout(bossRoom, 1, false, seed + bossRoom.id * 67890);
        
        // Check for exit portal (4)
        let hasPortal = false;
        for(let y=0; y<20; y++) {
            for(let x=0; x<20; x++) {
                if(layout.grid[y][x] === 4) hasPortal = true;
            }
        }
        expect(hasPortal).toBe(true);
        expect(layout.exitPosition).toBeDefined();
    }
  });
  it('should generate identical grid and offset regardless of isPlayerInRoom', () => {
    const seed = 12345;
    const floor = generateFloor(1, seed);
    const room = floor.rooms[0];
    
    const layout1 = generateRoomLayout(room, 1, true, seed + room.id * 67890);
    const layout2 = generateRoomLayout(room, 1, false, seed + room.id * 67890);
    
    // Objects are different references
    expect(layout1).not.toBe(layout2);
    
    // Content is identical (except enemyCount)
    expect(layout1.grid).toEqual(layout2.grid);
    expect(layout1.worldOffset).toEqual(layout2.worldOffset);
    expect(layout1.exitPosition).toEqual(layout2.exitPosition);
    
    // enemyCount differs (if room has enemies)
    // Start room has 0 enemies anyway, so let's check a normal room
    const normalRoom = floor.rooms[1];
    const layout3 = generateRoomLayout(normalRoom, 1, true, seed + normalRoom.id * 67890);
    const layout4 = generateRoomLayout(normalRoom, 1, false, seed + normalRoom.id * 67890);
    
    expect(layout3.grid).toEqual(layout4.grid);
    expect(layout3.enemyCount).toBeGreaterThan(0);
    expect(layout4.enemyCount).toBe(0);
  });
  it('should generate stable layout for Room 2 (regression test)', () => {
    const seed = 12345;
    const floor = generateFloor(1, seed);
    // Room 2 is index 1 (id 1)
    const room2 = floor.rooms.find(r => r.id === 1);
    
    expect(room2).toBeDefined();
    if (!room2) return;

    // Generate layout with player present
    const layoutWithPlayer = generateRoomLayout(room2, 1, true, seed + room2.id * 67890);
    
    // Generate layout without player present
    const layoutWithoutPlayer = generateRoomLayout(room2, 1, false, seed + room2.id * 67890);

    // Verify grids are identical
    expect(layoutWithPlayer.grid).toEqual(layoutWithoutPlayer.grid);
    
    // Verify world offsets are identical
    expect(layoutWithPlayer.worldOffset).toEqual(layoutWithoutPlayer.worldOffset);
    
    // Verify walls exist (sanity check)
    let hasWalls = false;
    for(let y=0; y<20; y++) {
        for(let x=0; x<20; x++) {
            if(layoutWithPlayer.grid[y][x] === 1) hasWalls = true;
        }
    }
    expect(hasWalls).toBe(true);
  });
});
