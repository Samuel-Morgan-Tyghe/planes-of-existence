/* eslint-disable react/no-unknown-property */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { $position } from '../../stores/player';

export function PlayerShadow() {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.MeshBasicMaterial>(null);

    useFrame(() => {
        if (!meshRef.current || !materialRef.current) return;

        const pos = $position.get();
        const playerY = pos[1];
        
        // Follow player X/Z but stay on floor
        meshRef.current.position.set(pos[0], 0.05, pos[2]);
        
        // Calculate effects based on height
        const height = Math.max(0, playerY - 0.5); // 0.5 is approx center height
        
        // Scale down slightly with height
        const scale = Math.max(0.5, 1 - height * 0.1);
        meshRef.current.scale.set(scale, scale, scale);
        
        // Fade out with height
        const opacity = Math.max(0.2, 0.6 - height * 0.1);
        materialRef.current.opacity = opacity;
    });

    return (
        <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.4, 32]} />
            <meshBasicMaterial 
                ref={materialRef}
                color="black" 
                transparent 
                opacity={0.6}
                depthWrite={false}
            />
        </mesh>
    );
}
