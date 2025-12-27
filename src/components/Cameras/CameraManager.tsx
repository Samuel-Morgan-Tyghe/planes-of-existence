import { useStore } from '@nanostores/react';
import { OrthographicCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { OrthographicCamera as ThreeOrthographicCamera } from 'three';
import { $plane } from '../../stores/game';
import { $position } from '../../stores/player';

export function CameraManager() {
  const plane = useStore($plane);
  const playerPosition = useStore($position);
  const camera2DRef = useRef<ThreeOrthographicCamera>(null);
  const cameraISORef = useRef<ThreeOrthographicCamera>(null);

  // Update camera positions to follow player
  useFrame(() => {
    if (plane === '2D' && camera2DRef.current) {
      camera2DRef.current.position.set(playerPosition[0], playerPosition[1], 50);
      camera2DRef.current.lookAt(playerPosition[0], playerPosition[1], 0);
    } else if (plane === 'ISO' && cameraISORef.current) {
      cameraISORef.current.position.set(
        playerPosition[0] + 20,
        playerPosition[1] + 20,
        playerPosition[2] + 20
      );
      cameraISORef.current.lookAt(playerPosition[0], playerPosition[1], playerPosition[2]);
    }
  });

  return (
    <>
      {/* 2D Side-Scrolling: Orthographic from side */}
      <OrthographicCamera
        ref={camera2DRef}
        makeDefault={plane === '2D'}
        position={[0, 0, 50]}
        zoom={40}
        near={0.1}
        far={1000}
      />

      {/* ISO Top-Down: Orthographic from isometric angle */}
      <OrthographicCamera
        ref={cameraISORef}
        makeDefault={plane === 'ISO'}
        position={[20, 20, 20]}
        zoom={30}
        near={0.1}
        far={200}
      />

      {/* FPS camera is parented to Player component */}
    </>
  );
}

