/* eslint-disable react/no-unknown-property */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color } from 'three';

interface GrassProps {
    position: [number, number, number];
}

export function Grass({ position }: GrassProps) {
    const groupRef = useRef<any>(null);

    // Create random grass blades
    const blades = useMemo(() => {
        const bladeCount = 5 + Math.floor(Math.random() * 5);
        const b = [];
        for (let i = 0; i < bladeCount; i++) {
            const height = 0.3 + Math.random() * 0.4;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 0.3;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const rot = Math.random() * Math.PI;

            // Random green variation
            const color = new Color().setHSL(0.25 + Math.random() * 0.1, 0.6, 0.3 + Math.random() * 0.2);

            b.push({
                pos: [x, height / 2, z] as [number, number, number],
                scale: [0.05, height, 0.05] as [number, number, number],
                rot: [0, rot, 0] as [number, number, number],
                color: color
            });
        }
        return b;
    }, []);

    useFrame((state) => {
        if (groupRef.current) {
            // Subtle wind sway
            const time = state.clock.getElapsedTime();
            groupRef.current.rotation.z = Math.sin(time * 0.5 + position[0]) * 0.05;
            groupRef.current.rotation.x = Math.cos(time * 0.3 + position[2]) * 0.05;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {blades.map((blade, i) => (
                <mesh key={i} position={blade.pos} rotation={blade.rot} scale={blade.scale} castShadow receiveShadow>
                    <coneGeometry args={[1, 1, 4]} />
                    <meshStandardMaterial color={blade.color} roughness={0.8} />
                </mesh>
            ))}
        </group>
    );
}
