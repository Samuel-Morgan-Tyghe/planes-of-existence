import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
import { $bossAlive, $bossEnemy, $currentFloor, $currentRoomId, $enemiesAlive, $roomCleared } from '../../stores/game';
import { $position } from '../../stores/player';
import { Enemy } from './Enemy';

/**
 * BossManager - Separate component for managing boss enemy rendering
 * Completely independent from regular enemy system
 */
export function BossManager() {
  const bossEnemy = useStore($bossEnemy);
  const currentRoomId = useStore($currentRoomId);
  const currentFloor = useStore($currentFloor);
  const playerPosition = useStore($position);

  const handleBossDeath = useCallback((enemyId: number) => {
    console.log('👹 Boss defeated!');
    $bossEnemy.set(null);
    $bossAlive.set(false);
    
    // Check if room should be cleared (no regular enemies left)
    if ($enemiesAlive.get() === 0) {
      $roomCleared.set(true);
      console.log('✨ Boss room cleared!');
    }
  }, []);

  const handleBossPositionUpdate = useCallback((enemyId: number, position: [number, number, number]) => {
    // Boss position tracking if needed for projectiles
    // Could add to a separate $bossPosition atom if needed
  }, []);

  if (!bossEnemy) {
    return null;
  }

  const isActive = bossEnemy.roomId === currentRoomId;

  return (
    <Enemy
      key={`boss-${currentFloor}-${bossEnemy.id}`}
      enemy={bossEnemy}
      active={isActive}
      playerPosition={playerPosition}
      onDeath={handleBossDeath}
      onPositionUpdate={handleBossPositionUpdate}
    />
  );
}
