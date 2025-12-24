import { Canvas as R3FCanvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { Lighting } from './Lighting';
import { Scene } from './Scene';

export function Canvas() {
  return (
    <R3FCanvas
      gl={{ antialias: true }}
      camera={{ position: [0, 0, 50], fov: 75 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <Lighting />
          <Scene />
        </Physics>
      </Suspense>
    </R3FCanvas>
  );
}

