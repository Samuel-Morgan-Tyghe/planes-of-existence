import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect } from 'react';
import { clearEnemyProjectiles } from '../../stores/projectiles';
import { $restartTrigger } from '../../stores/restart';
import { CameraManager } from '../Cameras/CameraManager';
import { PlaneSwitcher } from '../Cameras/PlaneSwitcher';
import { EffectsManager } from '../Effects/EffectsManager';
import { EnemySpawner } from '../Enemies/EnemySpawner';
import { ProjectileManager } from '../Enemies/ProjectileManager';
import { Player } from '../Player/Player';
import { PlayerShadow } from '../Player/PlayerShadow';
import { WeaponSystem } from '../Player/WeaponSystem';
import { DropManager } from '../World/DropManager';
import { GridMap } from '../World/GridMap';
import { ThrownBombGroup } from '../World/ThrownBombGroup';
import { TrailManager } from '../World/TrailManager';

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

import { Physics } from '@react-three/rapier';

export function Scene() {
  const restartTrigger = useStore($restartTrigger);

  const handleSpawnRequest = useCallback(() => {}, []);

  useEffect(() => {
    return () => {
        clearEnemyProjectiles();
    };
  }, []);

  return (
    <Physics gravity={[0, -9.81, 0]} debug={false}>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <CameraManager />
      <PlaneSwitcher />
      <GridMap key={`grid-${restartTrigger}`} />
      <Player key={`player-${restartTrigger}`} />
      <PlayerShadow />
      
      <ErrorBoundary>
        <WeaponSystem key={`weapon-${restartTrigger}`} />
      </ErrorBoundary>

      <EnemySpawner key={`enemies-${restartTrigger}`} onSpawnRequest={handleSpawnRequest} />
      <ProjectileManager />
      <DropManager key={`drops-${restartTrigger}`} />
      <EffectsManager />

      <ThrownBombGroup />
      <TrailManager />
    </Physics>
  );
}
