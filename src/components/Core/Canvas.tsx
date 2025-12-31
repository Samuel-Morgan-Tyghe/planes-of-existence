import { useStore } from '@nanostores/react';
import { Canvas as R3FCanvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { $isPaused } from '../../stores/game';
import { Lighting } from './Lighting';
import { PostProcessing } from './PostProcessing';
import { Scene } from './Scene';

export function Canvas() {
  const paused = useStore($isPaused);
  return (
    <R3FCanvas
      gl={{ antialias: true }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]} paused={paused} debug>
          <Lighting />
          <Scene />
          <PostProcessing />
        </Physics>
      </Suspense>
    </R3FCanvas>
  );
}

