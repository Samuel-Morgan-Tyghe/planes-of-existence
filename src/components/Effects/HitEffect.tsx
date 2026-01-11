import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';

interface HitEffectProps {
  position: [number, number, number];
  color?: string;
  onComplete: () => void;
}

export function HitEffect({ position, color = '#ff0000', onComplete }: HitEffectProps) {
  // Static particle data
  const [particles] = useState(() => {
    const count = 12;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        initialDir: new THREE.Vector3(Math.cos(angle), Math.random() * 0.5, Math.sin(angle)),
        speed: 3 + Math.random() * 2,
        offset: new THREE.Vector3(0, 0, 0)
      };
    });
  });

  const groupRef = useRef<THREE.Group>(null);
  // Refs for individual particle meshes to update them directly
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lifetimeRef = useRef(0);
  const maxLifetime = 0.5;

  useFrame((_, delta) => {
    lifetimeRef.current += delta;

    if (lifetimeRef.current >= maxLifetime) {
      onComplete();
      return;
    }

    const progress = lifetimeRef.current / maxLifetime;

    // Update Particles directly
    particleRefs.current.forEach((mesh, i) => {
      if (mesh) {
        const p = particles[i];
        // const moveDist = p.speed * delta; // Frame-dependent movement would be better accumulated
        // Simple accumulation:
        p.offset.addScaledVector(p.initialDir, p.speed * delta);

        mesh.position.copy(p.offset);

        const scale = 0.2 * (1 - progress);
        mesh.scale.setScalar(scale);

        // Material opacity update is tricky without accessing material ref, 
        // but setting scale to 0 effectively hides it.
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((_, i) => (
        <mesh key={i} ref={el => particleRefs.current[i] = el}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.0}
            transparent
          />
        </mesh>
      ))}
    </group>
  );
}
