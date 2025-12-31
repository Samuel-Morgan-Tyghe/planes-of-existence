import { useStore } from '@nanostores/react';
import { $thrownBombs } from '../../stores/game';
import { ThrownBomb } from './ThrownBomb';

export function ThrownBombGroup() {
  const thrownBombs = useStore($thrownBombs);

  return (
    <>
      {Object.values(thrownBombs).map(bomb => (
        <ThrownBomb
          key={bomb.id}
          id={bomb.id}
          position={bomb.position}
          direction={bomb.direction}
          initialVelocity={bomb.initialVelocity}
          exploded={bomb.exploded}
          explosionPos={bomb.explosionPos}
          fuse={bomb.fuse}
        />
      ))}
    </>
  );
}
