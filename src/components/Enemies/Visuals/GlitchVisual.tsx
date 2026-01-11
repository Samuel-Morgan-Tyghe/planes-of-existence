import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { Group } from 'three';

interface VisualProps {
    color: string;
    size: number;
}

/**
 * Glitch Style:
 * A central core cube that rotates/pulses, surrounded by small floating bits.
 */
export function GlitchVisual({ color, size }: VisualProps) {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Subtle floating animation
            groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <group ref={groupRef} position={[0, size / 2, 0]}>
            {/* Central Core */}
            <mesh castShadow receiveShadow>
                <boxGeometry args={[size * 0.6, size * 0.6, size * 0.6]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Floating Bits (Static relative positions, moved by parent group) */}
            <mesh position={[size * 0.4, size * 0.4, size * 0.4]}>
                <boxGeometry args={[size * 0.2, size * 0.2, size * 0.2]} />
                <meshStandardMaterial color={color} wireframe />
            </mesh>
            <mesh position={[-size * 0.3, -size * 0.2, size * 0.3]} rotation={[0.5, 0.5, 0]}>
                <boxGeometry args={[size * 0.15, size * 0.15, size * 0.15]} />
                <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, size * 0.5, -size * 0.3]}>
                <boxGeometry args={[size * 0.2, size * 0.2, size * 0.2]} />
                <meshStandardMaterial color="white" />
            </mesh>
        </group>
    );
}
