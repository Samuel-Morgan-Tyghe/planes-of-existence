import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface DecalProps {
    position: [number, number, number];
    rotation: [number, number, number];
    scale?: number;
    onComplete: () => void;
}

export function Decal({ position, rotation, scale = 1, onComplete }: DecalProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);
    const lifeTime = useRef(0);
    const maxLife = 10; // Lasts 10 seconds

    useFrame((_, delta) => {
        lifeTime.current += delta;
        if (lifeTime.current > maxLife) {
            onComplete();
            return;
        }

        // Fade out in last 2 seconds
        if (lifeTime.current > maxLife - 2 && materialRef.current) {
            materialRef.current.opacity = (maxLife - lifeTime.current) / 2;
        }
    });

    return (
        <mesh ref={meshRef} position={position} rotation={rotation}>
            <circleGeometry args={[0.3 * scale, 8]} />
            <meshStandardMaterial
                ref={materialRef}
                color="#220000"
                transparent
                opacity={0.9}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-1} // Draw on top of walls
            />
        </mesh>
    );
}
