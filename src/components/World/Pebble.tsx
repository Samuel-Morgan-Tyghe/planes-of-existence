import { useMemo } from 'react';

interface PebbleProps {
    position: [number, number, number];
}

export function Pebble({ position }: PebbleProps) {
    const { scale, rotation } = useMemo(() => {
        return {
            scale: 0.3 + Math.random() * 0.4,
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number]
        };
    }, []);

    return (
        <mesh position={[position[0], 0.05, position[2]]} rotation={rotation} scale={[scale, scale * 0.5, scale]}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#555555" />
        </mesh>
    );
}
