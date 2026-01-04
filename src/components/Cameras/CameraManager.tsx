import { useStore } from '@nanostores/react';
import { OrthographicCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { OrthographicCamera as ThreeOrthographicCamera } from 'three';
import { $cameraShake, $plane } from '../../stores/game';
import { $position } from '../../stores/player';

export function CameraManager() {
  const plane = useStore($plane);
  const playerPosition = useStore($position);
  const camera2DRef = useRef<ThreeOrthographicCamera>(null);
  const cameraISORef = useRef<ThreeOrthographicCamera>(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  
  // Camera Shake State
  const shakeIntensity = useRef(0);
  const shakeDecay = 5.0; // How fast shake stops

  // Listen for camera shake events
  useEffect(() => {
    const unsubscribe = $cameraShake.subscribe((intensity) => {
      if (intensity > 0) {
        shakeIntensity.current = intensity;
        // Reset store immediately so it can be triggered again
        $cameraShake.set(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // Handle zoom with mouse wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoomScale((prev) => {
        const change = -e.deltaY * 0.001;
        const newScale = Math.max(0.1, prev + change);
        return newScale;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '=' || e.key === '+') {
        setZoomScale(prev => prev + 0.1);
      } else if (e.key === '-' || e.key === '_') {
        setZoomScale(prev => Math.max(0.1, prev - 0.1));
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update camera positions to follow player
  useFrame((_, delta) => {
    // Decay shake
    if (shakeIntensity.current > 0) {
        shakeIntensity.current = Math.max(0, shakeIntensity.current - delta * shakeDecay);
    }

    const shakeX = (Math.random() - 0.5) * shakeIntensity.current;
    const shakeY = (Math.random() - 0.5) * shakeIntensity.current;
    const shakeZ = (Math.random() - 0.5) * shakeIntensity.current;

    if (plane === '2D' && camera2DRef.current) {
      const targetX = playerPosition[0];
      const targetY = playerPosition[1];
      
      // Smooth follow
      camera2DRef.current.position.x += (targetX - camera2DRef.current.position.x) * 5 * delta;
      camera2DRef.current.position.y += (targetY - camera2DRef.current.position.y) * 5 * delta;
      
      // Apply shake
      camera2DRef.current.position.x += shakeX;
      camera2DRef.current.position.y += shakeY;
      
      camera2DRef.current.lookAt(targetX, targetY, 0);

    } else if (plane === 'ISO' && cameraISORef.current) {
      const targetX = playerPosition[0] + 20;
      const targetY = playerPosition[1] + 20;
      const targetZ = playerPosition[2] + 20;

      // Smooth follow
      cameraISORef.current.position.x += (targetX - cameraISORef.current.position.x) * 5 * delta;
      cameraISORef.current.position.y += (targetY - cameraISORef.current.position.y) * 5 * delta;
      cameraISORef.current.position.z += (targetZ - cameraISORef.current.position.z) * 5 * delta;

      // Apply shake
      cameraISORef.current.position.x += shakeX;
      cameraISORef.current.position.y += shakeY;
      cameraISORef.current.position.z += shakeZ;

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
        zoom={40 * zoomScale}
        near={0.1}
        far={1000}
      />

      {/* ISO Top-Down: Orthographic from isometric angle */}
      <OrthographicCamera
        ref={cameraISORef}
        makeDefault={plane === 'ISO'}
        position={[20, 20, 20]}
        zoom={30 * zoomScale}
        near={0.1}
        far={200}
      />

      {/* FPS camera is parented to Player component - Controls handled manually in PlayerController */}
    </>
  );
}

