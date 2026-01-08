import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import { Mesh, MeshBasicMaterial } from 'three';

interface ImpactEffectProps {
  position: [number, number, number];
  color?: string;
  size?: number;
  onComplete: () => void;
}

export function ImpactEffect({ position, color = '#ffffff', size = 1, onComplete }: ImpactEffectProps) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const [frame, setFrame] = useState(0);

  useFrame(() => {
    if (meshRef.current && materialRef.current) {
      setFrame(f => f + 1);

      const progress = frame / 15; // 15 frames duration
      if (progress >= 1) {
        onComplete();
        return;
      }

      // Expand
      const scale = (0.5 + progress * 2) * size;
      meshRef.current.scale.set(scale, scale, scale);

      // Fade out
      materialRef.current.opacity = 1 - progress;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={1}
        depthTest={false} // Draw on top? Maybe not.
      />
    </mesh>
  );
}
