import { useMemo } from 'react';

interface MushroomProps {
    position: [number, number, number];
}

export function Mushroom({ position }: MushroomProps) {
    const { color, scale, rotation, type } = useMemo(() => {
        const types = ['red', 'brown', 'glowing'];
        const selectedType = types[Math.floor(Math.random() * types.length)];

        let baseColor = '#8B4513';
        if (selectedType === 'red') baseColor = '#FF0000';
        if (selectedType === 'glowing') baseColor = '#00FFFF';

        return {
            color: baseColor,
            type: selectedType,
            scale: 0.5 + Math.random() * 0.5,
            rotation: [0, Math.random() * Math.PI * 2, 0] as [number, number, number]
        };
    }, []);

    return (
        <group position={position} rotation={rotation} scale={[scale, scale, scale]}>
            {/* Stem */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.08, 0.1, 0.5, 6]} />
                <meshStandardMaterial color="#F5DEB3" />
            </mesh>
            {/* Cap */}
            <mesh position={[0, 0.5, 0]}>
                <coneGeometry args={[0.3, 0.2, 8]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={type === 'glowing' ? 0.8 : 0.1}
                />
            </mesh>
            {/* Spots for Red mushrooms */}
            {type === 'red' && (
                <>
                    <mesh position={[0.15, 0.55, 0.1]}>
                        <sphereGeometry args={[0.05, 4, 4]} />
                        <meshStandardMaterial color="#FFFFFF" />
                    </mesh>
                    <mesh position={[-0.1, 0.58, -0.1]}>
                        <sphereGeometry args={[0.04, 4, 4]} />
                        <meshStandardMaterial color="#FFFFFF" />
                    </mesh>
                </>
            )}
        </group>
    );
}
