import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { $recoilTrigger } from '../../stores/player';

export function MovingGhost({ position, isDead, damageFlash, isInvulnerable }: { position: [number, number, number], isDead: boolean, damageFlash: boolean, isInvulnerable: boolean }) {
    const bobRef = useRef<THREE.Group>(null);
    const recoilRef = useRef(0);

    // Listen for recoil trigger
    useEffect(() => {
        return $recoilTrigger.subscribe(() => {
            recoilRef.current = 0.4; // Kick back distance
        });
    }, []);

    useFrame((state, delta) => {
        if (bobRef.current) {
            // Decay recoil
            recoilRef.current = THREE.MathUtils.lerp(recoilRef.current, 0, delta * 15);

            // Bobbing animation + Recoil (Z kick)
            bobRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
            bobRef.current.position.z = recoilRef.current; // Push BACK relative to facing
        }
    });

    return (
        <group position={position}>
            {/* Shadow Blob - Static on floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[0.6, 32]} />
                <meshBasicMaterial color="black" transparent opacity={0.3} />
            </mesh>

            {/* Animating Ghost Body */}
            <group ref={bobRef}>
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
        </group>
    );
}
