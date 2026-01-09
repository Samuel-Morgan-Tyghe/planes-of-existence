import { useMemo } from 'react';

interface FlowerProps {
    position: [number, number, number];
}

export function Flower({ position }: FlowerProps) {
    const color = useMemo(() => {
        const colors = ['#FFFF00', '#FF69B4', '#FFFFFF', '#00BFFF', '#FFA500'];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    const rotation = useMemo(() => {
        return [0, Math.random() * Math.PI * 2, 0] as [number, number, number];
    }, []);

    return (
        <group position={position} rotation={rotation}>
            {/* Stem */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
                <meshStandardMaterial color="#228B22" />
            </mesh>
            {/* Flower Head */}
            <mesh position={[0, 0.4, 0]}>
                <dodecahedronGeometry args={[0.15, 0]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
            </mesh>
        </group>
    );
}
