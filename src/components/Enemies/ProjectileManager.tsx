import { useStore } from '@nanostores/react';
import { $enemyProjectiles, removeEnemyProjectile } from '../../stores/projectiles';
import { EnemyProjectile } from './EnemyProjectile';
import { SoundWave } from './SoundWave';

export function ProjectileManager() {
  const projectiles = useStore($enemyProjectiles);

  // We now render visuals directly in the individual components for reliability.
  // InstancedMesh was causing sync issues where visuals wouldn't appear.
  
  return (
    <>
      {Object.values(projectiles).map((proj) => (
        proj.type === 'soundwave' ? (
          <SoundWave
            key={proj.id}
            id={proj.id}
            origin={proj.origin}
            direction={proj.direction}
            speed={proj.speed}
            damage={proj.damage}
            color={proj.color}
            size={proj.size || 1.0}
            lifetime={proj.lifetime}
            onDestroy={() => removeEnemyProjectile(proj.id)}
          />
        ) : (
          <EnemyProjectile
            key={proj.id}
            id={proj.id}
            origin={proj.origin}
            direction={proj.direction}
            speed={proj.speed}
            damage={proj.damage}
            color={proj.color}
            size={proj.size || 1.0}
            lifetime={proj.lifetime}
            onDestroy={() => removeEnemyProjectile(proj.id)}
          />
        )
      ))}
    </>
  );
}
