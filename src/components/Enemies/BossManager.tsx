import { useStore } from '@nanostores/react';
import { useCallback } from 'react';
import { $bossAlive, $bossEnemy, $currentFloor, $currentRoomId, $enemiesAlive, $enemyPositions, $roomCleared } from '../../stores/game';
import { $position } from '../../stores/player';
import { emitDrop } from '../../systems/events';
import { rollBossLoot } from '../../types/drops';
import Enemy from './Enemy';

/**
 * BossManager - Separate component for managing boss enemy rendering
 * Completely independent from regular enemy system
 */
export function BossManager() {
  const bossEnemy = useStore($bossEnemy);
  const currentRoomId = useStore($currentRoomId);
  const currentFloor = useStore($currentFloor);
  const playerPosition = useStore($position);

  const handleBossDeath = useCallback((_enemyId: number) => {
    console.log('👹 Boss defeated!');
    $bossEnemy.set(null); // Clear boss from state
    $bossAlive.set(false);

    // Clear boss position from targeting
    if ($enemyPositions.get()[_enemyId]) {
      $enemyPositions.setKey(_enemyId, undefined!);
    }

    if (bossEnemy) {
      // Spawn Boss Loot
      const bossLoot = rollBossLoot();
      const bossPos = bossEnemy.position;
      emitDrop(bossPos, bossEnemy.roomId, bossLoot.type, bossLoot.itemId);
    }

    // Check if room should be cleared (no regular enemies left)
    if ($enemiesAlive.get() === 0) {
      $roomCleared.set(true);
      console.log('✨ Boss room cleared!');
    }
  }, []);

  const handleBossPositionUpdate = useCallback((enemyId: number, position: [number, number, number]) => {
    // Determine active room context? Boss is usually relevant.
    $enemyPositions.setKey(enemyId, position);
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
