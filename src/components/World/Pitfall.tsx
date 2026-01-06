
interface PitfallProps {
  position: [number, number, number];
}

/**
 * A visual pit in the ground. 
 * Relies on the floor collider having a gap at this location to allow entities to fall.
 */
export function Pitfall({ position }: PitfallProps) {
  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 
          No Physics here! 
          The "Hole" is created by GridMap omitting the floor collider at this tile.
      */}

      {/* Pit Visuals - Black hole surface at floor level */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.45, 0]}>
        <planeGeometry args={[1.98, 1.98]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Depth Box - renders inside the floor */}
      <mesh position={[0, -5, 0]}>
        <boxGeometry args={[1.9, 10, 1.9]} />
        <meshStandardMaterial color="#050505" />
      </mesh>

      {/* Rim/Shadow - subtle darken around the edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.44, 0]}>
        <ringGeometry args={[1.8, 2, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
