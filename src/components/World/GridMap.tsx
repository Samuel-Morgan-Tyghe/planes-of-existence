import { useMemo } from 'react';
import { generateLevel, gridToWorld, type GridMap } from '../../utils/levelGen';
import { Wall } from './Wall';
import { Floor } from './Floor';

export function GridMap() {
  const level = useMemo(() => generateLevel(), []);

  return (
    <>
      {/* Render floor tiles */}
      {level.map((row, y) =>
        row.map((tile, x) => {
          if (tile === 0 || tile === 2 || tile === 3) {
            // Render floor for walkable tiles
            const [worldX, worldY, worldZ] = gridToWorld(x, y);
            return (
              <Floor
                key={`floor-${x}-${y}`}
                position={[worldX, worldY - 0.5, worldZ]}
                size={0.9}
              />
            );
          }
          return null;
        })
      )}

      {/* Render walls */}
      {level.map((row, y) =>
        row.map((tile, x) => {
          if (tile === 1) {
            const [worldX, worldY, worldZ] = gridToWorld(x, y);
            return (
              <Wall
                key={`wall-${x}-${y}`}
                position={[worldX, worldY, worldZ]}
              />
            );
          }
          return null;
        })
      )}
    </>
  );
}

