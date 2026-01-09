/* eslint-disable react/no-unknown-property */
import { useFrame } from '@react-three/fiber';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef } from 'react';

interface TorchProps {
    position: [number, number, number];
}

export function Torch({ position }: TorchProps) {
    const lightRef = useRef<any>(null);

    useFrame((state) => {
        if (lightRef.current) {
            // Flicker effect
            const time = state.clock.getElapsedTime();
            lightRef.current.intensity = 1.2 + Math.sin(time * 10) * 0.1 + Math.cos(time * 23) * 0.1;
            lightRef.current.position.y = 1.3 + Math.sin(time * 5) * 0.02;
        }
    });

    return (
        <RigidBody position={position} type="fixed" colliders={false} userData={{ isObstacle: true }}>
            <CuboidCollider args={[0.2, 0.7, 0.2]} position={[0, 0.7, 0]} />

            <group position={[0, 0, 0]}>
                {/* Stand */}
                <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.05, 0.1, 1.2, 6]} />
                    <meshStandardMaterial color="#222" />
                </mesh>

                {/* Bowl */}
                <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.25, 0.1, 0.15, 6]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Fire (emissive mesh + light) */}
                <mesh position={[0, 1.3, 0]}>
                    <dodecahedronGeometry args={[0.15, 0]} />
                    <meshBasicMaterial color="#ffaa00" />
                </mesh>

                <pointLight
                    ref={lightRef}
                    position={[0, 1.3, 0]}
                    distance={6}
                    decay={2}
                    color="#ffaa00"
                    castShadow
                />
            </group>
        </RigidBody>
    );
}
