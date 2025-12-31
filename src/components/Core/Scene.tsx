import { useStore } from '@nanostores/react';
import React, { useCallback } from 'react';
import { $restartTrigger } from '../../stores/restart';
import { CameraManager } from '../Cameras/CameraManager';
import { PlaneSwitcher } from '../Cameras/PlaneSwitcher';
import { EffectsManager } from '../Effects/EffectsManager';
import { EnemySpawner } from '../Enemies/EnemySpawner';
import { Player } from '../Player/Player';
import { WeaponSystem } from '../Player/WeaponSystem';
import { DropManager } from '../World/DropManager';
import { GridMap } from '../World/GridMap';
import { ThrownBombGroup } from '../World/ThrownBombGroup';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: any) {
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
  const restartTrigger = useStore($restartTrigger);

  const handleSpawnRequest = useCallback(() => {}, []);

  return (
    <>
      <CameraManager />
      <PlaneSwitcher />
      <GridMap key={`grid-${restartTrigger}`} />
      <Player key={`player-${restartTrigger}`} />
      
      <ErrorBoundary>
        <WeaponSystem key={`weapon-${restartTrigger}`} />
      </ErrorBoundary>

      <EnemySpawner key={`enemies-${restartTrigger}`} onSpawnRequest={handleSpawnRequest} />
      <DropManager key={`drops-${restartTrigger}`} />
      <EffectsManager />

      <ThrownBombGroup />
    </>
  );
}
