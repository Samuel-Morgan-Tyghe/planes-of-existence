import { useStore } from '@nanostores/react';
import React, { useCallback, useEffect } from 'react';
import { clearEnemyProjectiles } from '../../stores/projectiles';
import { $restartTrigger } from '../../stores/restart';
import { CameraManager } from '../Cameras/CameraManager';
import { PlaneSwitcher } from '../Cameras/PlaneSwitcher';
import { QABot } from '../Debug/QABot';
import { CameraShake } from '../Effects/CameraShake';
import { EffectsManager } from '../Effects/EffectsManager';
import { BossManager } from '../Enemies/BossManager';
import { EnemySpawner } from '../Enemies/EnemySpawner';
import { ProjectileManager } from '../Enemies/ProjectileManager';
import { Player } from '../Player/Player';
import { PlayerShadow } from '../Player/PlayerShadow';
import { WeaponSystem } from '../Player/WeaponSystem';
import { DropManager } from '../World/DropManager';
import { GridMap } from '../World/GridMap';
import { InstancedTrails } from '../World/InstancedTrails';
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

import { Physics } from '@react-three/rapier';
import { ArenaRoom } from '../World/ArenaRoom';

export function Scene({ isTestMode = false, mode = 'adventure' }: { isTestMode?: boolean; mode?: 'adventure' | 'arena' }) {
  const restartTrigger = useStore($restartTrigger);

  const handleSpawnRequest = useCallback(() => { }, []);

  useEffect(() => {
    return () => {
      clearEnemyProjectiles();
    };
  }, []);

  return (
    <Physics gravity={[0, -9.81, 0]} debug={false}>
      <CameraShake />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow={!isTestMode}
        shadow-mapSize={[2048, 2048]}
      />
      <CameraManager />
      <PlaneSwitcher />

      {mode === 'adventure' ? (
        <>
          <GridMap key={`grid-${restartTrigger}`} />
          <BossManager key={`boss-${restartTrigger}`} />
          <DropManager key={`drops-${restartTrigger}`} />
        </>
      ) : (
        <ArenaRoom />
      )}

      {/* Shared Spawner - Essential for both modes */}
      <EnemySpawner key={`enemies-${restartTrigger}`} onSpawnRequest={handleSpawnRequest} />

      {/* Shared Systems */}
      <Player key={`player-${restartTrigger}`} />
      <PlayerShadow />

      <ErrorBoundary>
        <WeaponSystem key={`weapon-${restartTrigger}`} />
      </ErrorBoundary>

      <ProjectileManager />

      {!isTestMode && <EffectsManager />}

      <ThrownBombGroup />
      <InstancedTrails />
      <QABot />

    </Physics>
  );
}
