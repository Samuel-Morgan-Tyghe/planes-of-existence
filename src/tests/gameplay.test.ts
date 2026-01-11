import { describe, expect, it } from 'vitest';
import { generateFloor, generateRoomLayout, gridToWorld } from '../utils/floorGen';

describe('Gameplay Integrity', () => {
  it('should generate a valid floor structure', () => {
    const floor = generateFloor(1);
    expect(floor).toBeDefined();
    expect(floor.rooms.length).toBeGreaterThan(0);
    expect(floor.startRoomId).toBeDefined();
    
    const startRoom = floor.rooms.find(r => r.id === floor.startRoomId);
    expect(startRoom).toBeDefined();
    expect(startRoom?.type).toBe('start');
  });

  it('should maintain stable room layouts', () => {
    const floor = generateFloor(1);
    const room = floor.rooms[0];
    
    const layout1 = generateRoomLayout(room, 1, false, floor.seed);
    const layout2 = generateRoomLayout(room, 1, false, floor.seed);
    
    expect(layout1.grid).toEqual(layout2.grid);
    expect(layout1.worldOffset).toEqual(layout2.worldOffset);
  });

  it('should correctly calculate world positions from grid', () => {
    const worldOffset: [number, number, number] = [10, 0, 20];
    const worldPos = gridToWorld(5, 5, worldOffset);
    
    // ROOM_WORLD_SIZE = 60, ROOM_SIZE = 30, tileSize = 2
    // offset = -60/2 + 2/2 = -29
    // X = 10 - 29 + 5 * 2 = -9
    // Z = 20 - 29 + 5 * 2 = 1
    expect(worldPos[0]).toBe(-9);
    expect(worldPos[1]).toBe(0);
    expect(worldPos[2]).toBe(1);
  });

  it('should have doors that lead to valid adjacent rooms', () => {
    const floor = generateFloor(1);
    
    floor.rooms.forEach(room => {
      room.doors.forEach(door => {
        const offsets = {
          north: { dx: 0, dy: -1 },
          south: { dx: 0, dy: 1 },
          east: { dx: 1, dy: 0 },
          west: { dx: -1, dy: 0 },
        };
        const offset = offsets[door.direction];
        const targetX = room.gridX + offset.dx;
        const targetY = room.gridY + offset.dy;
        
        const targetRoom = floor.rooms.find(r => r.gridX === targetX && r.gridY === targetY);
        expect(targetRoom, `Room ${room.id} door ${door.direction} should lead to a room at ${targetX},${targetY}`).toBeDefined();
      });
    });
  });
});
