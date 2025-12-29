import { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { addPixels } from '../../stores/meta';
import { $restartTrigger } from '../../stores/restart';
import { CameraManager } from '../Cameras/CameraManager';
import { PlaneSwitcher } from '../Cameras/PlaneSwitcher';
import { EffectsManager } from '../Effects/EffectsManager';
import { EnemySpawner } from '../Enemies/EnemySpawner';
import { Player } from '../Player/Player';
import { WeaponSystem } from '../Player/WeaponSystem';
import { GridMap } from '../World/GridMap';
import { LootSpawner } from '../World/LootSpawner';
import { DropManager } from '../World/DropManager';

export function Scene() {
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const restartTrigger = useStore($restartTrigger);

  const handleEnemyKilled = useCallback((enemyId: number) => {
    setEnemiesKilled((prev) => prev + 1);
    // Reward pixels for killing enemies
    addPixels(5);
  }, []);

  const handleSpawnRequest = useCallback(() => {}, []);

  return (
    <>
      <CameraManager />
      <PlaneSwitcher />
      <GridMap key={`gridmap-${restartTrigger}`} />
      <Player key={`player-${restartTrigger}`} />
      <WeaponSystem key={`weapon-${restartTrigger}`} />
      <EnemySpawner key={`enemies-${restartTrigger}`} onEnemyKilled={handleEnemyKilled} onSpawnRequest={handleSpawnRequest} />
      <LootSpawner key={`loot-${restartTrigger}`} />
      <DropManager key={`drops-${restartTrigger}`} />
      <EffectsManager />
    </>
  );
}
