/* eslint-disable react/no-unknown-property */
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';

interface PillarProps {
    position: [number, number, number];
}

export function Pillar({ position }: PillarProps) {

    // Randomize style slightly
    const style = useMemo(() => {
        return Math.random() > 0.5 ? 'square' : 'round';
    }, []);

    return (
        <RigidBody position={position} type="fixed" colliders={false} userData={{ isObstacle: true }}>
            <CuboidCollider args={[0.4, 2, 0.4]} position={[0, 2, 0]} />

            <group position={[0, 0, 0]}>
                {/* Base */}
                <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1, 0.8, 1]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>

                {/* Shaft */}
                <mesh position={[0, 2, 0]} castShadow receiveShadow>
                    {style === 'square' ? (
                        <boxGeometry args={[0.7, 3.2, 0.7]} />
                    ) : (
                        <cylinderGeometry args={[0.4, 0.4, 3.2, 8]} />
                    )}
                    <meshStandardMaterial color="#555555" />
                </mesh>

                {/* Top */}
                <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.9, 0.4, 0.9]} />
                    <meshStandardMaterial color="#444444" />
                </mesh>
            </group>
        </RigidBody>
    );
}
