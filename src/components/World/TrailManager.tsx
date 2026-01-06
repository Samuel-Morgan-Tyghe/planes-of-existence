import { useStore } from '@nanostores/react';
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { $currentRoomId } from '../../stores/game';
import { $trails, tickTrails } from '../../stores/trails';

export function TrailManager() {
  const trails = useStore($trails);
  const currentRoomId = useStore($currentRoomId);

  useFrame(() => {
    tickTrails();
  });

  const activeTrails = useMemo(() => {
    return Object.values(trails).filter(t => t.roomId === currentRoomId);
  }, [trails, currentRoomId]);

  return (
    <>
      {activeTrails.map((trail) => (
        <Trail key={trail.id} trail={trail} />
      ))}
    </>
  );
}

function Trail({ trail }: { trail: any }) {
  const now = Date.now();
  const age = now - trail.spawnTime;
  const opacity = Math.max(0, 1 - age / trail.duration);

  const color = trail.type === 'slow' ? '#00f2ff' : '#00ff00';
  const emissive = trail.type === 'slow' ? '#0077ff' : '#00aa00';

  return (
    <mesh 
      position={[trail.position[0], 0.01, trail.position[2]]} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[trail.size, 16]} />
      <meshStandardMaterial 
        color={color} 
        emissive={emissive}
        emissiveIntensity={1.5}
        transparent 
        opacity={opacity * 0.6}
        depthWrite={false}
      />
    </mesh>
  );
}
