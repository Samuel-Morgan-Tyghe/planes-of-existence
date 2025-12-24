import { useStore } from '@nanostores/react';
import { OrthographicCamera } from '@react-three/drei';
import { $plane } from '../../stores/game';

export function CameraManager() {
  const plane = useStore($plane);

  return (
    <>
      {/* 2D Side-Scrolling: Orthographic from side */}
      <OrthographicCamera
        makeDefault={plane === '2D'}
        position={[0, 0, 50]}
        zoom={40}
        near={0.1}
        far={1000}
      />

      {/* ISO Top-Down: Orthographic from isometric angle */}
      <OrthographicCamera
        makeDefault={plane === 'ISO'}
        position={[20, 20, 20]}
        zoom={30}
        near={-50}
        far={200}
        onUpdate={(camera) => camera.lookAt(0, 0, 0)}
      />

      {/* FPS camera is parented to Player component */}
    </>
  );
}

