import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';

interface HitEffectProps {
  position: [number, number, number];
  color?: string;
  onComplete: () => void;
}

export function HitEffect({ position, color = '#ff0000', onComplete }: HitEffectProps) {
  const [particles] = useState(() => {
    // Generate random particle directions
    const count = 12;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      return {
        direction: [Math.cos(angle), Math.random() * 0.5, Math.sin(angle)] as [number, number, number],
        speed: 3 + Math.random() * 2,
        life: 0,
      };
    });
  });

  const groupRef = useRef<THREE.Group>(null);
  const lifetimeRef = useRef(0);
  const maxLifetime = 0.5; // 0.5 seconds

  useFrame((_, delta) => {
    lifetimeRef.current += delta;

    if (lifetimeRef.current >= maxLifetime) {
      onComplete();
      return;
    }

    // Update particles
    particles.forEach((particle) => {
      particle.life = lifetimeRef.current;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((particle, i) => {
        const progress = particle.life / maxLifetime;
        const offset = [
          particle.direction[0] * particle.speed * progress,
          particle.direction[1] * particle.speed * progress,
          particle.direction[2] * particle.speed * progress,
        ] as [number, number, number];
        const opacity = 1 - progress;
        const size = 0.2 * (1 - progress * 0.5);

        return (
          <mesh key={i} position={offset}>
            <sphereGeometry args={[size, 6, 6]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={3.0 * opacity}
              transparent
              opacity={opacity}
            />
          </mesh>
        );
      })}

      {/* Flash */}
      <mesh>
        <sphereGeometry args={[0.8 * (1 - lifetimeRef.current / maxLifetime), 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={5.0 * (1 - lifetimeRef.current / maxLifetime)}
          transparent
          opacity={1 - lifetimeRef.current / maxLifetime}
        />
      </mesh>
    </group>
  );
}
