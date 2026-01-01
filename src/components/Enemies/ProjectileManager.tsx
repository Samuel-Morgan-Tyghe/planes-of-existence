import { useStore } from '@nanostores/react';
import { $enemyProjectiles, removeEnemyProjectile } from '../../stores/projectiles';
import { EnemyProjectile } from './EnemyProjectile';
import { SoundWave } from './SoundWave';

export function ProjectileManager() {
  const projectiles = useStore($enemyProjectiles);

  return (
    <>
      {Object.values(projectiles).map((proj) => (
        proj.type === 'soundwave' ? (
          <SoundWave
            key={proj.id}
            origin={proj.origin}
            direction={proj.direction}
            speed={proj.speed}
            damage={proj.damage}
            color={proj.color}
            onDestroy={() => removeEnemyProjectile(proj.id)}
          />
        ) : (
          <EnemyProjectile
            key={proj.id}
            origin={proj.origin}
            direction={proj.direction}
            speed={proj.speed}
            damage={proj.damage}
            color={proj.color}
            onDestroy={() => removeEnemyProjectile(proj.id)}
          />
        )
      ))}
    </>
  );
}
