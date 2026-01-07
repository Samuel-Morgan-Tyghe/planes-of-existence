import { useStore } from '@nanostores/react';
import React from 'react';
import { $currentRoomId, $floorData, $playerYaw, $visitedRooms } from '../../stores/game';

function MiniMapComponent() {
  const floorData = useStore($floorData);
  const currentRoomId = useStore($currentRoomId);
  const visitedRooms = useStore($visitedRooms);
  const playerYaw = useStore($playerYaw);

  if (!floorData) return null;

  // Find bounds of the map to center it
  const minX = Math.min(...floorData.rooms.map(r => r.gridX));
  const maxX = Math.max(...floorData.rooms.map(r => r.gridX));
  const minY = Math.min(...floorData.rooms.map(r => r.gridY));
  const maxY = Math.max(...floorData.rooms.map(r => r.gridY));

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const cellSize = 20;
  const padding = 10;
  
  // Convert yaw to degrees for arrow rotation
  const arrowRotation = (playerYaw * 180) / Math.PI;

  return (
    <div
      style={{
        position: 'absolute',
        top: '180px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #00ff00',
        padding: `${padding}px`,
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
        gap: '4px',
        zIndex: 1000,
      }}
    >
      {Array.from({ length: height }).map((_, y) => (
        Array.from({ length: width }).map((_, x) => {
          const gridX = x + minX;
          const gridY = y + minY;
          const room = floorData.rooms.find(r => r.gridX === gridX && r.gridY === gridY);
          const isVisited = room && visitedRooms.has(room.id);
          const isCurrent = room && room.id === currentRoomId;

          if (!room) return <div key={`${x}-${y}`} style={{ width: cellSize, height: cellSize }} />;

          let symbol = '';
          let color = '#222';
          let borderColor = '#888';

          if (room.type === 'start') symbol = 'S';
          if (room.type === 'treasure') {
            symbol = '★';
            borderColor = '#ff00ff';
          }
          if (room.type === 'boss') {
            symbol = '💀';
            borderColor = '#ff0000';
          }
          
          if (isCurrent) {
            color = '#004400';
            borderColor = '#00ff00';
          }

          return (
            <div
              key={`${x}-${y}`}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: color,
                border: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: borderColor,
                opacity: isVisited ? 1 : 0.4,
                boxShadow: isCurrent ? '0 0 8px #00ff00' : 'none',
                position: 'relative',
              }}
            >
              {symbol}
              {/* Player direction arrow on current room */}
              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderBottom: '8px solid #ffff00',
                    transform: `rotate(${arrowRotation}deg)`,
                    transformOrigin: 'center',
                  }}
                />
              )}
            </div>
          );
        })
      ))}
    </div>
  );
}

export const MiniMap = React.memo(MiniMapComponent);
