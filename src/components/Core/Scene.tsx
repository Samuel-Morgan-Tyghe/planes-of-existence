import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect, useState } from 'react';
import { addPixels } from '../../stores/meta';
import { $restartTrigger } from '../../stores/restart';
import { CameraManager } from '../Cameras/CameraManager';
import { PlaneSwitcher } from '../Cameras/PlaneSwitcher';
import { EffectsManager } from '../Effects/EffectsManager';
import { EnemySpawner } from '../Enemies/EnemySpawner';
import { Player } from '../Player/Player';
import { WeaponSystem } from '../Player/WeaponSystem';
import { DropManager } from '../World/DropManager';
import { GridMap } from '../World/GridMap';
import { LootSpawner } from '../World/LootSpawner';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("🚨 ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

export function Scene() {
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const restartTrigger = useStore($restartTrigger);

  const handleEnemyKilled = useCallback((enemyId: number) => {
    setEnemiesKilled((prev) => prev + 1);
    // Reward pixels for killing enemies
    addPixels(5);
  }, []);

  const handleSpawnRequest = useCallback(() => {}, []);

  useEffect(() => {
    console.log('🎬 Scene MOUNTED');
    return () => console.log('🎬 Scene UNMOUNTED');
  }, []);

  return (
    <>
      <CameraManager />
      <PlaneSwitcher />
      <GridMap key={`gridmap-${restartTrigger}`} />
      <Player key={`player-${restartTrigger}`} />
      <ErrorBoundary>
        <WeaponSystem key={`weapon-${restartTrigger}`} />
      </ErrorBoundary>
      <EnemySpawner key={`enemies-${restartTrigger}`} onEnemyKilled={handleEnemyKilled} onSpawnRequest={handleSpawnRequest} />
      <LootSpawner key={`loot-${restartTrigger}`} />
      <DropManager key={`drops-${restartTrigger}`} />
      <EffectsManager />
    </>
  );
}
