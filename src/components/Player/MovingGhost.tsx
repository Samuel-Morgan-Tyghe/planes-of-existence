import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function MovingGhost({ position, isDead, damageFlash, isInvulnerable }: { position: [number, number, number], isDead: boolean, damageFlash: boolean, isInvulnerable: boolean }) {
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.position.y = position[1] + 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
        }
    });

    return (
        <group ref={meshRef} position={position}>
            {/* Ghost Body (Cylinder + Hemisphere Top) */}
            <mesh position={[0, 0.5, 0]} castShadow>
                <capsuleGeometry args={[0.4, 0.8, 4, 16]} />
                <meshStandardMaterial
                    color={isDead ? '#000000' : damageFlash ? '#ff0000' : isInvulnerable ? '#00ffff' : '#E0FFFF'}
                    emissive={isDead ? '#ff0000' : damageFlash ? '#ff0000' : isInvulnerable ? '#00ffff' : '#E0FFFF'}
                    emissiveIntensity={isDead ? 1.0 : damageFlash ? 0.8 : isInvulnerable ? 0.5 : 0.2}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Eyes for direction */}
            <group position={[0, 1.0, -0.35]}>
                <mesh position={[-0.15, 0, 0]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="black" />
                </mesh>
                <mesh position={[0.15, 0, 0]}>
                    <sphereGeometry args={[0.08, 16, 16]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            </group>
        </group>
    );
}
